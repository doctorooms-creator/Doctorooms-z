import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

/**
 * Check if a specific booking has been rated.
 * Used by appointment detail page to show/hide "Rate This Visit" button.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = req.nextUrl.searchParams.get('bookingId')
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }

    const rating = await db.doctorRating.findFirst({
      where: {
        patientId: user.id,
        bookingId: bookingId,
      },
      select: {
        id: true,
        star: true,
        review: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ rating: rating || null })
  } catch (error) {
    console.error('Rating check error:', error)
    return NextResponse.json({ error: 'Failed to check rating' }, { status: 500 })
  }
}
