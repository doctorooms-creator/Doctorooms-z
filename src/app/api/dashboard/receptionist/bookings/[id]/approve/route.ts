import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    if (!user || !RECEPTION_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        user: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify booking status is Pending
    if (booking.status !== 'Pending') {
      return NextResponse.json(
        { error: `Cannot approve booking with status: ${booking.status}` },
        { status: 400 }
      )
    }

    // Check OPD limit again (race condition guard)
    const bookingDate = new Date(booking.bookingDate)
    const dateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
    const nextDay = new Date(dateOnly)
    nextDay.setDate(nextDay.getDate() + 1)

    const activeBookingsCount = await db.booking.count({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: dateOnly, lt: nextDay },
        status: { in: ['Approve', 'Visited', 'Finish'] },
      },
    })

    if (activeBookingsCount >= booking.doctor.dailyLimit) {
      // OPD full — reject with explanation
      await db.booking.update({
        where: { id },
        data: { status: 'Rejected' },
      })

      if (booking.userId) {
        await db.notification.create({
          data: {
            userId: booking.userId,
            title: 'Booking Rejected',
            message: `Your appointment request with Dr. ${booking.doctor?.user?.name || 'Unknown'} has been rejected. The OPD limit for ${bookingDate.toLocaleDateString()} is full. Please try another date or time.`,
          },
        })
      }

      return NextResponse.json({
        success: false,
        error: 'OPD limit reached for this date. Booking has been rejected.',
        status: 'Rejected',
      })
    }

    // Approve the booking
    await db.booking.update({
      where: { id },
      data: { status: 'Approve' },
    })

    // Calculate queue position
    const patientsAhead = await db.booking.count({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: dateOnly, lt: nextDay },
        status: 'Approve',
        createdAt: { lte: booking.createdAt },
        id: { not: booking.id },
      },
    })
    const queuePosition = patientsAhead + 1

    // Notify patient
    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          title: 'Appointment Confirmed',
          message: `Your appointment with Dr. ${booking.doctor?.user?.name || 'Unknown'} on ${bookingDate.toLocaleDateString()} has been confirmed. Your queue number is #${queuePosition}.`,
        },
      })
    }

    // Notify doctor
    await db.notification.create({
      data: {
        userId: booking.doctor.userId,
        title: 'New Patient Booking',
        message: `New patient ${booking.user?.name || booking.patientName} booked for ${bookingDate.toLocaleDateString()}. Queue #${queuePosition}.`,
      },
    })

    return NextResponse.json({
      success: true,
      status: 'Approve',
      queuePosition,
    })
  } catch (error) {
    console.error('Approve booking error:', error)
    return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 })
  }
}
