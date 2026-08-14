import { requireRole, requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths, subYears, format, isWithinInterval, parseISO, endOfDay } from 'date-fns'

function getHospitalId(user: { id: string; role: string; email: string; name: string; gender: string | null; profileImg: string | null; mobileNo: string | null }) {
  if (user.role === 'admin') return undefined
  if (user.role === 'hospital') return user.id
  return user.id
}

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'month'
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
  const customFrom = searchParams.get('from')
  const customTo = searchParams.get('to')

  const now = new Date()
  let currentStart: Date
  let currentEnd: Date = endOfDay(now)
  let prevStart: Date
  let prevEnd: Date

  switch (period) {
    case 'today':
      currentStart = startOfDay(now)
      prevStart = startOfDay(subDays(now, 1))
      prevEnd = endOfDay(subDays(now, 1))
      break
    case 'week':
      currentStart = startOfWeek(now, { weekStartsOn: 1 })
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      prevEnd = endOfDay(subDays(currentStart, 1))
      break
    case 'year':
      currentStart = startOfYear(new Date(year, 0, 1))
      currentEnd = endOfDay(new Date(year, 11, 31))
      prevStart = startOfYear(new Date(year - 1, 0, 1))
      prevEnd = endOfDay(new Date(year - 1, 11, 31))
      break
    case 'custom':
      currentStart = parseISO(customFrom || format(now, 'yyyy-MM-dd'))
      currentEnd = endOfDay(parseISO(customTo || format(now, 'yyyy-MM-dd')))
      const diffDays = Math.max(1, Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)))
      prevStart = subDays(currentStart, diffDays)
      prevEnd = endOfDay(subDays(currentStart, 1))
      break
    default: // month
      currentStart = startOfMonth(new Date(year, month - 1, 1))
      currentEnd = endOfDay(new Date(year, month, 0))
      prevStart = startOfMonth(subMonths(new Date(year, month - 1, 1), 1))
      prevEnd = endOfDay(new Date(year, month - 1, 0))
      break
  }

  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  // Current period payments (IPD)
  const ipdPayments = await db.billPayment.findMany({
    where: {
      ...hospitalFilter,
      paymentDate: { gte: currentStart, lte: currentEnd },
    },
  })

  // Current period OPD bills
  const opdBills = await db.opdBill.findMany({
    where: {
      ...hospitalFilter,
      paymentDate: { gte: currentStart, lte: currentEnd },
    },
  })

  // Previous period payments
  const prevIpdPayments = await db.billPayment.findMany({
    where: {
      ...hospitalFilter,
      paymentDate: { gte: prevStart, lte: prevEnd },
    },
  })

  const prevOpdBills = await db.opdBill.findMany({
    where: {
      ...hospitalFilter,
      paymentDate: { gte: prevStart, lte: prevEnd },
    },
  })

  // Current period advances
  const advances = await db.patientAdvance.findMany({
    where: {
      ...hospitalFilter,
      createdAt: { gte: currentStart, lte: currentEnd },
    },
  })

  const totalRevenue = ipdPayments.reduce((s, p) => s + p.amount, 0) + opdBills.reduce((s, b) => s + b.totalAmount, 0)
  const previousPeriodRevenue = prevIpdPayments.reduce((s, p) => s + p.amount, 0) + prevOpdBills.reduce((s, b) => s + b.totalAmount, 0)
  const percentChange = previousPeriodRevenue > 0 ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : totalRevenue > 0 ? 100 : 0

  const ipdRevenue = ipdPayments.reduce((s, p) => s + p.amount, 0)
  const opdRevenue = opdBills.reduce((s, b) => s + b.totalAmount, 0)
  const advanceCollected = advances.reduce((s, a) => s + a.amount, 0)

  // Payment breakdown by method
  const methodMap: Record<string, number> = {}
  ipdPayments.forEach(p => { methodMap[p.paymentMethod] = (methodMap[p.paymentMethod] || 0) + p.amount })
  opdBills.forEach(b => { methodMap[b.paymentMethod] = (methodMap[b.paymentMethod] || 0) + b.totalAmount })
  const paymentBreakdown = Object.entries(methodMap).map(([method, amount]) => ({ method, amount, percent: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0 }))

  // Daily trend - build array of days in current period
  const dailyTrend: { date: string; revenue: number; ipd: number; opd: number }[] = []
  const dayCount = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  for (let i = 0; i < dayCount && i < 90; i++) {
    const day = new Date(currentStart)
    day.setDate(day.getDate() + i)
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    const dayIpd = ipdPayments.filter(p => isWithinInterval(p.paymentDate, { start: dayStart, end: dayEnd })).reduce((s, p) => s + p.amount, 0)
    const dayOpd = opdBills.filter(b => isWithinInterval(b.paymentDate, { start: dayStart, end: dayEnd })).reduce((s, b) => s + b.totalAmount, 0)

    dailyTrend.push({ date: dayStr, revenue: dayIpd + dayOpd, ipd: dayIpd, opd: dayOpd })
  }

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    previousPeriodRevenue: Math.round(previousPeriodRevenue * 100) / 100,
    percentChange: Math.round(percentChange * 10) / 10,
    ipdRevenue: Math.round(ipdRevenue * 100) / 100,
    opdRevenue: Math.round(opdRevenue * 100) / 100,
    advanceCollected: Math.round(advanceCollected * 100) / 100,
    paymentBreakdown,
    dailyTrend,
  })
}
