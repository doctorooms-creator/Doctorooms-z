import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const completedBookings = await db.booking.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['Visited', 'Finish'] },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, profileImg: true } },
          },
        },
      },
    })

    const existingRatings = await db.doctorRating.findMany({
      where: { patientId: session.user.id },
      select: { doctorId: true },
    })

    const ratedDoctorIds = new Set(existingRatings.map((r) => r.doctorId))

    const feedbackList = completedBookings.map((b) => {
      const doctorUserId = b.doctor?.userId || ''
      return {
        id: b.id,
        appointmentNo: b.appointmentNo,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg || '',
        doctorUserId,
        disease: b.disease,
        date: b.bookingDate,
        status: b.status,
        alreadyRated: ratedDoctorIds.has(doctorUserId),
      }
    })

    return NextResponse.json({ feedback: feedbackList })
  } catch (error) {
    console.error('Feedback list error:', error)
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, doctorUserId, star, consultationRating, waitTimeRating, staffRating, review, wouldRecommend, isAnonymous } = body

    if (!doctorUserId || !star) {
      return NextResponse.json({ error: 'Doctor and star rating are required' }, { status: 400 })
    }

    const existing = await db.doctorRating.findFirst({
      where: {
        patientId: session.user.id,
        doctorId: doctorUserId,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already rated this doctor' }, { status: 409 })
    }

    const rating = await db.doctorRating.create({
      data: {
        patientId: session.user.id,
        doctorId: doctorUserId,
        star,
        consultationRating: consultationRating || 0,
        waitTimeRating: waitTimeRating || 0,
        staffRating: staffRating || 0,
        review: review || '',
        wouldRecommend: wouldRecommend ?? true,
        isAnonymous: isAnonymous ?? false,
      },
    })

    return NextResponse.json(rating, { status: 201 })
  } catch (error) {
    console.error('Feedback submit error:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
