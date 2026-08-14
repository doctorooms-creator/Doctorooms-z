import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(new Date(year, month - 1, 1))
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  const ipdPayments = await db.billPayment.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: monthStart, lte: monthEnd } },
    select: { amount: true, paymentDate: true },
  })

  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: monthStart, lte: monthEnd } },
    select: { totalAmount: true, paymentDate: true },
  })

  // Build calendar data
  const days: { date: string; day: number; amount: number }[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayStart = startOfDay(new Date(year, month - 1, d))
    const dayEnd = endOfDay(new Date(year, month - 1, d))

    const ipdAmt = ipdPayments
      .filter(p => isWithinInterval(p.paymentDate, { start: dayStart, end: dayEnd }))
      .reduce((s, p) => s + p.amount, 0)
    const opdAmt = opdBills
      .filter(b => isWithinInterval(b.paymentDate, { start: dayStart, end: dayEnd }))
      .reduce((s, b) => s + b.totalAmount, 0)

    days.push({ date: dateStr, day: d, amount: Math.round((ipdAmt + opdAmt) * 100) / 100 })
  }

  const total = days.reduce((s, d) => s + d.amount, 0)
  const maxAmount = Math.max(...days.map(d => d.amount), 1)

  return NextResponse.json({
    year, month,
    days,
    total: Math.round(total * 100) / 100,
    maxAmount: Math.round(maxAmount * 100) / 100,
    averageDaily: Math.round((total / daysInMonth) * 100) / 100,
  })
}
