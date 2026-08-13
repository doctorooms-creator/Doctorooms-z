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
      start = startOfYear(new Date(year, 0, 1))
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

  const ipdPayments = await db.billPayment.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
    select: { paymentMethod: true, amount: true },
  })

  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
    select: { paymentMethod: true, totalAmount: true },
  })

  const map: Record<string, { amount: number; count: number }> = {}
  ipdPayments.forEach(p => {
    if (!map[p.paymentMethod]) map[p.paymentMethod] = { amount: 0, count: 0 }
    map[p.paymentMethod].amount += p.amount
    map[p.paymentMethod].count += 1
  })
  opdBills.forEach(b => {
    if (!map[b.paymentMethod]) map[b.paymentMethod] = { amount: 0, count: 0 }
    map[b.paymentMethod].amount += b.totalAmount
    map[b.paymentMethod].count += 1
  })

  const total = Object.values(map).reduce((s, m) => s + m.amount, 0)
  const methods = Object.entries(map).map(([method, data]) => ({
    method,
    amount: Math.round(data.amount * 100) / 100,
    count: data.count,
    percent: total > 0 ? Math.round((data.amount / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.amount - a.amount)

  return NextResponse.json({ methods, total: Math.round(total * 100) / 100 })
}
