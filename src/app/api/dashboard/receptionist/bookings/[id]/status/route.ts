import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'

const VALID_TRANSITIONS: Record<string, string[]> = {
  Pending: ['Extend', 'Visited', 'Approve', 'Canceled'],
  Extend: ['Approve', 'Canceled'],
  Approve: ['Visited', 'Canceled'],
  Visited: [],
  Canceled: [],
  Finish: [],
}

const STATUS_MESSAGES: Record<string, { title: string; patientMsg: string; doctorMsg: string }> = {
  Extend: {
    title: 'Appointment Extended',
    patientMsg: 'Your appointment has been put on hold and extended.',
    doctorMsg: 'A booking has been extended.',
  },
  Visited: {
    title: 'Visit Completed',
    patientMsg: 'Your appointment has been marked as visited.',
    doctorMsg: 'A booking has been marked as visited.',
  },
  Approve: {
    title: 'Appointment Confirmed',
    patientMsg: 'Your appointment has been confirmed.',
    doctorMsg: 'A booking has been approved.',
  },
  Canceled: {
    title: 'Booking Canceled',
    patientMsg: 'Your appointment has been canceled.',
    doctorMsg: 'A booking has been canceled.',
  },
}

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
    const body = await req.json()
    const { status } = body

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Find receptionist by userId — works for receptionist, hospital, and admin roles
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

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

    // Verify booking belongs to the receptionist's doctor
    if (booking.doctorId !== receptionist.doctorId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[booking.status]
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from "${booking.status}" to "${status}"` },
        { status: 400 }
      )
    }

    // Update status
    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        user: { select: { name: true } },
      },
    })

    // Send notifications
    const messages = STATUS_MESSAGES[status]
    const doctorName = booking.doctor?.user?.name || 'Unknown'
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString()

    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          title: messages.title,
          message: `${messages.patientMsg} (Dr. ${doctorName}, ${bookingDate})`,
        },
      })
    }

    await db.notification.create({
      data: {
        userId: booking.doctor.userId,
        title: messages.title,
        message: `${messages.doctorMsg} Patient: ${booking.user?.name || booking.patientName}, ${bookingDate}.`,
      },
    })

    return NextResponse.json({
      success: true,
      status,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
      },
    })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 })
  }
}
