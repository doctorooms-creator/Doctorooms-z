import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'
import { todayISTRange } from '@/lib/date-utils'
import { generateTokenNumber } from '@/lib/token-utils'

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

    // ── Receptionist scoping ──
    if (user.role === 'receptionist') {
      const receptionist = await db.receptionist.findUnique({
        where: { userId: user.id },
        select: { doctorId: true, hospitalId: true },
      })

      if (!receptionist) {
        return NextResponse.json({ error: 'Receptionist profile not found' }, { status: 403 })
      }

      const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

      if (isHospitalMode) {
        // Hospital receptionist: verify booking belongs to their hospital
        if (booking.hospitalId !== receptionist.hospitalId) {
          return NextResponse.json(
            { error: 'Unauthorized — not your hospital\'s booking' },
            { status: 403 }
          )
        }
      } else {
        // Clinic receptionist: verify booking belongs to their doctor
        if (booking.doctorId !== receptionist.doctorId) {
          return NextResponse.json(
            { error: 'Unauthorized — not your doctor\'s booking' },
            { status: 403 }
          )
        }
      }
    }

    // Verify booking status is Pending
    if (booking.status !== 'Pending') {
      return NextResponse.json(
        { error: `Cannot approve booking with status: ${booking.status}` },
        { status: 400 }
      )
    }

    // Check OPD limit again (race condition guard)
    const { start: startOfDay, end: endOfDay } = todayISTRange()

    const activeBookingsCount = await db.booking.count({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Approve', 'Visited', 'Finish'] },
      },
    })

    if (activeBookingsCount >= booking.doctor.dailyLimit) {
      await db.booking.update({
        where: { id },
        data: { status: 'Canceled' },
      })

      if (booking.userId) {
        await db.notification.create({
          data: {
            userId: booking.userId,
            title: 'Booking Rejected',
            message: `Your appointment request with Dr. ${booking.doctor?.user?.name || 'Unknown'} has been rejected. The OPD limit for today is full. Please try another date or time.`,
          },
        })
      }

      return NextResponse.json({
        success: false,
        error: 'OPD limit reached for today. Booking has been rejected.',
        status: 'Canceled',
      })
    }

    // ── Generate token for hospital bookings ──
    let tokenNumber = booking.tokenNumber
    let tokenOrder = booking.tokenOrder

    if (booking.hospitalId && booking.departmentId) {
      const token = await generateTokenNumber(booking.doctorId, booking.departmentId)
      tokenNumber = token.tokenNumber
      tokenOrder = token.tokenOrder
    }

    // Approve the booking
    await db.booking.update({
      where: { id },
      data: {
        status: 'Approve',
        receptionistId: user.id,
        tokenNumber,
        tokenOrder,
      },
    })

    // Calculate queue position
    const patientsAhead = await db.booking.count({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: 'Approve',
        createdAt: { lte: booking.createdAt },
        id: { not: booking.id },
      },
    })
    const queuePosition = patientsAhead + 1

    // Build token display for notifications
    const tokenDisplay = tokenNumber ? ` Token: ${tokenNumber}.` : ''

    // Notify patient
    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          title: 'Appointment Confirmed',
          message: `Your appointment with Dr. ${booking.doctor?.user?.name || 'Unknown'} has been confirmed. Queue #${queuePosition}.${tokenDisplay}`,
        },
      })
    }

    // Notify doctor
    await db.notification.create({
      data: {
        userId: booking.doctor.userId,
        title: 'New Patient Booking',
        message: `New patient ${booking.user?.name || booking.patientName} booked. Queue #${queuePosition}.${tokenDisplay}`,
      },
    })

    return NextResponse.json({
      success: true,
      status: 'Approve',
      queuePosition,
      tokenNumber,
      tokenOrder,
    })
  } catch (error) {
    console.error('Approve booking error:', error)
    return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 })
  }
}
