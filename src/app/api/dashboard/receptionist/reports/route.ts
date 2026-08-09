import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date')
    const targetDate = dateStr ? new Date(dateStr) : new Date()
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    const [bookings, doctor] = await Promise.all([
      db.booking.findMany({
        where: {
          doctorId: receptionist.doctorId,
          bookingDate: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { name: true, profileImg: true } },
        },
      }),
      db.doctor.findUnique({
        where: { id: receptionist.doctorId },
        include: { user: { select: { name: true } } },
      }),
    ])

    // Compute stats
    const total = bookings.length
    const pending = bookings.filter(b => b.status === 'Pending').length
    const approved = bookings.filter(b => b.status === 'Approve').length
    const visited = bookings.filter(b => b.status === 'Visited').length
    const finished = bookings.filter(b => b.status === 'Finish').length
    const canceled = bookings.filter(b => b.status === 'Canceled').length
    const extended = bookings.filter(b => b.status === 'Extend').length
    const revenue = bookings
      .filter(b => ['Visited', 'Finish', 'Approve'].includes(b.status))
      .reduce((sum, b) => sum + b.appointmentCharge, 0)

    return NextResponse.json({
      doctor: doctor ? { name: doctor.user.name, dailyLimit: doctor.dailyLimit } : null,
      date: targetDate.toISOString(),
      stats: { total, pending, approved, visited, finished, canceled, extended, revenue },
      bookings: bookings.map(b => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg,
        disease: b.disease,
        bookingDate: b.bookingDate.toISOString(),
        status: b.status,
        appointmentCharge: b.appointmentCharge,
        bookingMode: b.bookingMode,
        bookingType: b.bookingType,
        timeSlot: b.timeSlot,
      })),
    })
  } catch (error) {
    console.error('Receptionist report error:', error)
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
  }
}
