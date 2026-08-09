import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      )
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership or authorized role
    const isOwner = booking.userId === user.id
    const isAuthorized = RECEPTION_ROLES.includes(user.role) || user.role === 'doctor'
    if (!isOwner && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If booking is not approved, patient is not in queue yet
    if (booking.status !== 'Approve') {
      return NextResponse.json({
        inQueue: false,
        status: booking.status,
        message: 'Waiting for reception to confirm',
      })
    }

    // Calculate date boundaries
    const bookingDate = new Date(booking.bookingDate)
    const dateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
    const nextDay = new Date(dateOnly)
    nextDay.setDate(nextDay.getDate() + 1)

    // Count patients ahead: same doctor, same date, status=Approve, created before this booking, not this booking
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

    // Total in queue
    const totalInQueue = await db.booking.count({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: dateOnly, lt: nextDay },
        status: 'Approve',
      },
    })

    const estimatedWaitMinutes = patientsAhead * 15

    return NextResponse.json({
      inQueue: true,
      queuePosition,
      totalInQueue,
      patientsAhead,
      estimatedWaitMinutes,
    })
  } catch (error) {
    console.error('Get queue position error:', error)
    return NextResponse.json({ error: 'Failed to get queue position' }, { status: 500 })
  }
}
