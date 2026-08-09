import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, AuthUser } from '@/lib/api-auth'
import { db } from '@/lib/db'

/**
 * POST /api/dashboard/doctor/video-call
 * Start a video call for a booking.
 * Accepts: doctor, receptionist, admin roles.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: accept doctor, receptionist, admin
    const user = await getAuthUser(req)
    if (!user || !['doctor', 'receptionist', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId } = body as { bookingId?: string }

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'bookingId is required' },
        { status: 400 }
      )
    }

    // Fetch the booking with doctor info
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      )
    }

    // Validate: doctor must own this booking (unless admin/receptionist)
    if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
      if (!doctor || doctor.id !== booking.doctorId) {
        return NextResponse.json(
          { success: false, message: 'This booking does not belong to your account' },
          { status: 403 }
        )
      }
    }

    // Validate status is Approve
    if (booking.status !== 'Approve') {
      return NextResponse.json(
        { success: false, message: `Cannot start video call: booking status is '${booking.status}', expected 'Approve'` },
        { status: 400 }
      )
    }

    // Validate bookingMode is VideoCall
    if (booking.bookingMode !== 'VideoCall') {
      return NextResponse.json(
        { success: false, message: 'This booking is not a video call appointment' },
        { status: 400 }
      )
    }

    // Generate room ID
    const roomId = `doctorooms-${booking.id.slice(0, 8)}`

    // Update booking: set videoRoomId and status to Visited
    await db.booking.update({
      where: { id: bookingId },
      data: {
        videoRoomId: roomId,
        status: 'Visited',
      },
    })

    const doctorName = booking.doctor.user.name
    const patientName = booking.patientName || booking.user?.name || 'Patient'

    // Create notification for patient (if userId exists)
    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          title: 'Video Consultation Started',
          message: `Dr. ${doctorName} has started your video consultation. Click Join to connect.`,
          status: 'UNREAD',
        },
      })
    }

    // Create notification for doctor
    await db.notification.create({
      data: {
        userId: booking.doctor.userId,
        title: 'Video Call Started',
        message: `Video call started for patient ${patientName}. Room: ${roomId}`,
        status: 'UNREAD',
      },
    })

    return NextResponse.json({
      success: true,
      roomId,
      joinUrl: `/dashboard/video-call/${roomId}`,
    })
  } catch (error) {
    console.error('Video call API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
