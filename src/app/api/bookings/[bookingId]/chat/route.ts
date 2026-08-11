import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

// ==================== GET: Fetch all chat messages for a booking ====================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireAuth(_req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await params

    // Fetch booking to verify ownership
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        doctor: {
          select: {
            userId: true,
            receptionistLinks: { select: { userId: true } },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify caller has access to this booking's chat
    const isPatient = booking.userId === user.id
    const isDoctor = booking.doctor.userId === user.id
    const isReceptionist = booking.doctor.receptionistLinks.some((r) => r.userId === user.id)

    if (!isPatient && !isDoctor && !isReceptionist) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const messages = await db.bookingChat.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, profileImg: true },
        },
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Fetch chat messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// ==================== POST: Send a new message ====================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await params
    const body = await req.json()
    const { message } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    // Fetch booking with doctor info
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: {
          include: {
            user: { select: { id: true } },
            receptionistLinks: { select: { userId: true } },
          },
        },
        user: { select: { id: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Authorization: determine if user is patient or doctor/receptionist
    let toId: string | null = null

    if (user.role === 'patient') {
      // Patient can only chat on their own bookings
      if (booking.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Message goes to the doctor's user
      toId = booking.doctor.userId
    } else if (user.role === 'doctor') {
      // Doctor can only chat on bookings assigned to them
      if (booking.doctor.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Message goes to the patient
      toId = booking.userId
    } else if (user.role === 'receptionist') {
      // Receptionist must belong to this doctor
      const isLinked = booking.doctor.receptionistLinks.some((r) => r.userId === user.id)
      if (!isLinked) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Message goes to the patient
      toId = booking.userId
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!toId) {
      return NextResponse.json({ error: 'Cannot determine recipient' }, { status: 400 })
    }

    // Mark messages sent TO current user as READ
    await db.bookingChat.updateMany({
      where: {
        bookingId,
        toId: user.id,
        status: 'UNREAD',
      },
      data: { status: 'READ' },
    })

    // Create the message
    const chatMessage = await db.bookingChat.create({
      data: {
        bookingId,
        fromId: user.id,
        toId,
        message: message.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, profileImg: true },
        },
      },
    })

    return NextResponse.json({ message: chatMessage })
  } catch (error) {
    console.error('Send chat message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
