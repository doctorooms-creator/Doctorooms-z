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
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Doctor scoping: receptionist can only reject THEIR doctor's bookings
    if (user.role === 'receptionist') {
      const receptionist = await db.receptionist.findUnique({
        where: { userId: user.id },
        select: { doctorId: true },
      })
      if (!receptionist || booking.doctorId !== receptionist.doctorId) {
        return NextResponse.json({ error: 'Unauthorized — not your doctor\'s booking' }, { status: 403 })
      }
    }

    // Verify booking status is Pending
    if (booking.status !== 'Pending') {
      return NextResponse.json(
        { error: `Cannot reject booking with status: ${booking.status}` },
        { status: 400 }
      )
    }

    // Update status to Rejected
    await db.booking.update({
      where: { id },
      data: { status: 'Rejected' },
    })

    // Notify patient
    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Rejected',
          message: `Your appointment request with Dr. ${booking.doctor?.user?.name || 'Unknown'} has been rejected. Please try another date or time.`,
        },
      })
    }

    return NextResponse.json({ success: true, status: 'Rejected' })
  } catch (error) {
    console.error('Reject booking error:', error)
    return NextResponse.json({ error: 'Failed to reject booking' }, { status: 500 })
  }
}
