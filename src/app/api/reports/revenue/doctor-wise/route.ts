import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns'

function getDateRange(period: string, year: number, month: number) {
  const now = new Date()
  let start: Date
  let end: Date = endOfDay(now)
  switch (period) {
    case 'today':
      start = startOfDay(now); break
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 }); break
    case 'year':
      start = startOfYear(new Date(year, 0, 1));
      end = endOfDay(new Date(year, 11, 31)); break
    default:
      start = startOfMonth(new Date(year, month - 1, 1))
      end = endOfDay(new Date(year, month, 0)); break
  }
  return { start, end }
}

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'month'
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  const { start, end } = getDateRange(period, year, month)
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  // IPD: payments -> bill -> admission -> attendingDoctor
  const ipdPayments = await db.billPayment.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
    include: {
      bill: {
        include: {
          admission: {
            include: {
              attendingDoctor: { include: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  })

  // OPD: bills -> booking -> doctor
  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
    include: {
      booking: {
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
      },
    },
  })

  const docMap: Record<string, { name: string; ipd: number; opd: number }> = {}

  ipdPayments.forEach(p => {
    const doc = p.bill?.admission?.attendingDoctor
    if (!doc) return
    const name = doc.user?.name || 'Unknown'
    if (!docMap[doc.id]) docMap[doc.id] = { name, ipd: 0, opd: 0 }
    docMap[doc.id].ipd += p.amount
  })

  opdBills.forEach(b => {
    const doc = b.booking?.doctor
    if (!doc) return
    const name = doc.user?.name || 'Unknown'
    if (!docMap[doc.id]) docMap[doc.id] = { name, ipd: 0, opd: 0 }
    docMap[doc.id].opd += b.totalAmount
  })

  const doctors = Object.entries(docMap)
    .map(([id, d]) => ({
      doctorId: id,
      doctorName: d.name,
      ipdRevenue: Math.round(d.ipd * 100) / 100,
      opdRevenue: Math.round(d.opd * 100) / 100,
      totalRevenue: Math.round((d.ipd + d.opd) * 100) / 100,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  return NextResponse.json({ doctors })
}
