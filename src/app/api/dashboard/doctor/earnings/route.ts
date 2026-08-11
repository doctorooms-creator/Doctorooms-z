import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachDayOfInterval } from 'date-fns'
import { todayISTRange } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'

    const now = new Date()
    let rangeStart: Date
    let rangeEnd: Date

    switch (period) {
      case 'week':
        rangeStart = startOfWeek(now, { weekStartsOn: 1 })
        rangeEnd = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'year':
        rangeStart = startOfYear(now)
        rangeEnd = endOfYear(now)
        break
      default: // month
        rangeStart = startOfMonth(now)
        rangeEnd = endOfMonth(now)
        break
    }

    const { start: todayStart, end: todayEnd } = todayISTRange()

    // Fetch all finished bookings in the period
    const bookings = await db.booking.findMany({
      where: {
        doctorId: doctor.id,
        status: 'Finish',
        bookingDate: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { bookingDate: 'desc' },
    })

    // Fetch today's finished bookings
    const todayBookings = await db.booking.findMany({
      where: {
        doctorId: doctor.id,
        status: 'Finish',
        bookingDate: { gte: todayStart, lte: todayEnd },
      },
    })

    // Calculate totals
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.appointmentCharge || 0), 0)
    const totalConsultations = bookings.length
    const todayEarnings = todayBookings.reduce((sum, b) => sum + (b.appointmentCharge || 0), 0)
    const todayConsultations = todayBookings.length

    // Build earnings by day
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    const bookingMap = new Map<string, { earnings: number; consultations: number }>()

    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      bookingMap.set(key, { earnings: 0, consultations: 0 })
    }

    for (const b of bookings) {
      const key = format(new Date(b.bookingDate), 'yyyy-MM-dd')
      const existing = bookingMap.get(key)
      if (existing) {
        existing.earnings += b.appointmentCharge || 0
        existing.consultations += 1
      }
    }

    const earningsByDay = days.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const data = bookingMap.get(key)!
      return {
        date: key,
        label: format(day, 'EEE'),
        earnings: data.earnings,
        consultations: data.consultations,
      }
    })

    // Recent transactions (last 10 finished bookings)
    const recentTransactions = bookings.slice(0, 10).map((b) => ({
      id: b.id,
      appointmentNo: b.appointmentNo,
      patientName: b.patientName || 'Walk-in',
      appointmentCharge: b.appointmentCharge || 0,
      bookingDate: b.bookingDate,
      disease: b.disease,
    }))

    return NextResponse.json({
      totalEarnings,
      totalConsultations,
      averagePerConsultation: totalConsultations > 0 ? Math.round(totalEarnings / totalConsultations) : 0,
      todayEarnings,
      todayConsultations,
      earningsByDay,
      recentTransactions,
    })
  } catch (error) {
    console.error('Doctor earnings error:', error)
    return NextResponse.json({ error: 'Failed to load earnings' }, { status: 500 })
  }
}
