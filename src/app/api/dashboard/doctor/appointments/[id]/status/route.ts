import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { sendQueueNotification, notifyApproachingPatient, notifyNextPatient } from '@/lib/queue-notifications'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['Visited', 'Finish', 'Extend', 'Canceled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true, user: { select: { name: true } } },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const booking = await db.booking.findFirst({
      where: { id, doctorId: doctor.id },
      select: {
        id: true,
        status: true,
        userId: true,
        tokenNumber: true,
        tokenOrder: true,
        bookingDate: true,
        department: { select: { name: true } },
      },
    })
    if (!booking) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Prevent invalid transitions
    if (booking.status === 'Finish' && status === 'Visited') {
      return NextResponse.json({ error: 'Cannot revert a finished consultation' }, { status: 400 })
    }
    if (booking.status === 'Canceled') {
      return NextResponse.json({ error: 'Cannot change a canceled appointment' }, { status: 400 })
    }

    await db.booking.update({
      where: { id },
      data: { status },
    })

    // Send queue notifications (non-blocking)
    const doctorName = doctor.user.name.replace('Dr. ', '')
    const ctx = {
      bookingId: booking.id,
      doctorId: doctor.id,
      patientUserId: booking.userId,
      doctorName,
      tokenNumber: booking.tokenNumber,
      departmentName: booking.department?.name || null,
    }

    if (status === 'Visited') {
      // Notify current patient that consultation started
      await sendQueueNotification('consultation_started', ctx)
      // Notify patient 2 positions ahead that their turn is coming
      await notifyApproachingPatient(doctor.id, booking.tokenOrder, booking.bookingDate)
    } else if (status === 'Finish') {
      // Notify patient that consultation is complete
      await sendQueueNotification('consultation_completed', ctx)
      // Notify the next patient in queue
      await notifyNextPatient(doctor.id, booking.tokenOrder, booking.bookingDate)
    } else if (status === 'Extend') {
      await sendQueueNotification('wait_extended', ctx)
    } else if (status === 'Canceled') {
      await sendQueueNotification('appointment_canceled', ctx)
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Update appointment status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
