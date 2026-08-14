import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths, endOfDay, parseISO, format } from 'date-fns'

function getDateRange(period: string, year: number, month: number) {
  const now = new Date()
  let start: Date
  let end: Date = endOfDay(now)
  switch (period) {
    case 'today':
      start = startOfDay(now)
      break
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 })
      break
    case 'year':
      start = startOfYear(new Date(year, 0, 1))
      end = endOfDay(new Date(year, 11, 31))
      break
    default:
      start = startOfMonth(new Date(year, month - 1, 1))
      end = endOfDay(new Date(year, month, 0))
      break
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

  // Get IPD payments joined with admission -> department
  const ipdPayments = await db.billPayment.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
    include: {
      bill: {
        include: {
          admission: {
            include: { department: { select: { name: true } } },
          },
        },
      },
    },
  })

  // Get OPD bills joined with booking -> department
  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
    include: {
      booking: {
        include: {
          doctor: {
            include: {
              doctorLinks: {
                where: hospitalFilter.hospitalId ? { hospitalId: user.id } : undefined,
                include: { department: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  })

  const deptMap: Record<string, { ipd: number; opd: number }> = {}

  ipdPayments.forEach(p => {
    const deptName = p.bill?.admission?.department?.name || 'Other'
    if (!deptMap[deptName]) deptMap[deptName] = { ipd: 0, opd: 0 }
    deptMap[deptName].ipd += p.amount
  })

  opdBills.forEach(b => {
    const link = b.booking?.doctor?.doctorLinks?.[0]
    const deptName = link?.department?.name || 'Other'
    if (!deptMap[deptName]) deptMap[deptName] = { ipd: 0, opd: 0 }
    deptMap[deptName].opd += b.totalAmount
  })

  const departments = Object.entries(deptMap)
    .map(([name, rev]) => ({
      department: name,
      ipdRevenue: Math.round(rev.ipd * 100) / 100,
      opdRevenue: Math.round(rev.opd * 100) / 100,
      totalRevenue: Math.round((rev.ipd + rev.opd) * 100) / 100,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totalAll = departments.reduce((s, d) => s + d.totalRevenue, 0)
  departments.forEach(d => {
    (d as Record<string, unknown>).percent = totalAll > 0 ? Math.round((d.totalRevenue / totalAll) * 1000) / 10 : 0
  })

  return NextResponse.json({ departments, totalRevenue: Math.round(totalAll * 100) / 100 })
}
