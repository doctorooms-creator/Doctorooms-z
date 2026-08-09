import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get('doctorId')
    const dateStr = searchParams.get('date')
    const timeSlot = searchParams.get('timeSlot') || ''

    if (!doctorId || !dateStr) {
      return NextResponse.json(
        { error: 'doctorId and date are required' },
        { status: 400 }
      )
    }

    // Validate doctor exists
    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const dateObj = new Date(dateStr)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    // Extract date-only for comparison
    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    const nextDay = new Date(dateOnly)
    nextDay.setDate(nextDay.getDate() + 1)

    // Check holiday
    const holiday = await db.doctorHoliday.findFirst({
      where: {
        userId: doctor.userId,
        date: { gte: dateOnly, lt: nextDay },
      },
    })

    if (holiday) {
      return NextResponse.json({
        available: false,
        reason: `Dr. ${doctorId} is on holiday on this date. Reason: ${holiday.remark || 'Not specified'}`,
        opdCount: 0,
        opdLimit: doctor.dailyLimit,
      })
    }

    // Check OPD limit
    const opdCount = await db.booking.count({
      where: {
        doctorId,
        bookingDate: { gte: dateOnly, lt: nextDay },
        status: { in: ['Approve', 'Visited', 'Finish'] },
      },
    })

    if (opdCount >= doctor.dailyLimit) {
      return NextResponse.json({
        available: false,
        reason: `OPD limit (${doctor.dailyLimit}) has been reached for this date`,
        opdCount,
        opdLimit: doctor.dailyLimit,
      })
    }

    // Check time slot conflict if provided
    if (timeSlot) {
      const slotConflict = await db.booking.findFirst({
        where: {
          doctorId,
          bookingDate: { gte: dateOnly, lt: nextDay },
          timeSlot,
          status: { in: ['Approve', 'Visited', 'Finish'] },
        },
      })

      if (slotConflict) {
        return NextResponse.json({
          available: false,
          reason: `Time slot ${timeSlot} is already booked for this date`,
          opdCount,
          opdLimit: doctor.dailyLimit,
        })
      }
    }

    // Calculate queue position (if approved now)
    const queuePosition = opdCount + 1

    return NextResponse.json({
      available: true,
      queuePosition,
      opdCount,
      opdLimit: doctor.dailyLimit,
    })
  } catch (error) {
    console.error('Check slot availability error:', error)
    return NextResponse.json({ error: 'Failed to check slot availability' }, { status: 500 })
  }
}
