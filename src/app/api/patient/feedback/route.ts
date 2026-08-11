import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

function avatarUrl(img: string | null | undefined): string {
  if (!img || img === 'default.png') return ''
  return img.startsWith('/') ? img : `/uploads/profile/${img}`
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const completedBookings = await db.booking.findMany({
      where: {
        userId: user.id,
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

    // Check ratings by bookingId for per-visit ratings
    const existingRatings = await db.doctorRating.findMany({
      where: { patientId: user.id },
      select: { bookingId: true, doctorId: true },
    })

    // Map bookingId -> rated for per-visit checks
    const ratedBookingIds = new Set(
      existingRatings.filter((r) => r.bookingId).map((r) => r.bookingId)
    )

    const feedbackList = completedBookings.map((b) => {
      const doctorUserId = b.doctor?.userId || ''
      return {
        id: b.id,
        appointmentNo: b.appointmentNo,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: avatarUrl(b.doctor?.user?.profileImg),
        doctorUserId,
        disease: b.disease,
        date: b.bookingDate,
        status: b.status,
        alreadyRated: ratedBookingIds.has(b.id),
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
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, doctorUserId, star, consultationRating, waitTimeRating, staffRating, review, wouldRecommend, isAnonymous } = body

    if (!doctorUserId || !star) {
      return NextResponse.json({ error: 'Doctor and star rating are required' }, { status: 400 })
    }

    // If bookingId is provided, check for existing rating on this specific booking
    if (bookingId) {
      const existing = await db.doctorRating.findFirst({
        where: {
          patientId: user.id,
          bookingId: bookingId,
        },
      })

      if (existing) {
        // Update existing rating
        const updated = await db.doctorRating.update({
          where: { id: existing.id },
          data: {
            star,
            consultationRating: consultationRating || 0,
            waitTimeRating: waitTimeRating || 0,
            staffRating: staffRating || 0,
            review: review || '',
            wouldRecommend: wouldRecommend ?? true,
            isAnonymous: isAnonymous ?? false,
          },
        })
        return NextResponse.json(updated)
      }
    }

    // Check if already rated this doctor without bookingId (legacy behavior)
    const existingLegacy = await db.doctorRating.findFirst({
      where: {
        patientId: user.id,
        doctorId: doctorUserId,
        bookingId: null,
      },
    })

    if (existingLegacy && !bookingId) {
      return NextResponse.json({ error: 'Already rated this doctor' }, { status: 409 })
    }

    // Create new rating
    const rating = await db.doctorRating.create({
      data: {
        patientId: user.id,
        doctorId: doctorUserId,
        bookingId: bookingId || null,
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
