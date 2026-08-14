import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, format } from 'date-fns'

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

  const bookings = await db.booking.findMany({
    where: {
      ...hospitalFilter,
      bookingDate: { gte: start, lte: end },
    },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          doctorLinks: {
            where: hospitalFilter.hospitalId ? { hospitalId: user.id } : undefined,
            include: { department: { select: { name: true } } },
          },
        },
      },
    },
  })

  const totalBookings = bookings.length
  const visited = bookings.filter(b => b.status === 'Visited' || b.status === 'Finish').length
  const canceled = bookings.filter(b => b.status === 'Canceled').length
  const pending = bookings.filter(b => b.status === 'Pending' || b.status === 'Approve').length
  const walkIns = bookings.filter(b => b.bookingType === 'By Hospital' || b.bookingType === 'By Receptionist').length

  // Revenue
  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: start, lte: end } },
  })
  const totalRevenue = opdBills.reduce((s, b) => s + b.totalAmount, 0)

  // By department
  const deptMap: Record<string, number> = {}
  bookings.forEach(b => {
    const link = b.doctor?.doctorLinks?.[0]
    const dept = link?.department?.name || 'Unassigned'
    deptMap[dept] = (deptMap[dept] || 0) + 1
  })
  const departmentBreakdown = Object.entries(deptMap)
    .map(([dept, count]) => ({ department: dept, count }))
    .sort((a, b) => b.count - a.count)

  // By day of week
  const dowMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
  bookings.forEach(b => {
    const dow = format(b.bookingDate, 'EEE')
    dowMap[dow] = (dowMap[dow] || 0) + 1
  })
  const dayOfWeekBreakdown = Object.entries(dowMap).map(([day, count]) => ({ day, count }))

  return NextResponse.json({
    totalBookings,
    visited,
    canceled,
    pending,
    walkIns,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    avgPerDay: totalBookings > 0 ? Math.round((totalBookings / Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)))) * 10) / 10 : 0,
    departmentBreakdown,
    dayOfWeekBreakdown,
  })
}
