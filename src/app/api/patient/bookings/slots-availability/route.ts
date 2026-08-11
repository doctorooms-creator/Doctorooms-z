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

    if (!doctorId || !dateStr) {
      return NextResponse.json({ error: 'doctorId and date are required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({ where: { id: doctorId } })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const dateObj = new Date(dateStr)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    const nextDay = new Date(dateOnly)
    nextDay.setDate(nextDay.getDate() + 1)

    // Check holiday (uses doctor.userId)
    const holiday = await db.doctorHoliday.findFirst({
      where: { userId: doctor.userId, date: { gte: dateOnly, lt: nextDay } },
    })

    if (holiday) {
      return NextResponse.json({
        available: false,
        reason: `Doctor is on holiday. ${holiday.remark || ''}`.trim(),
        opdCount: 0,
        opdLimit: doctor.dailyLimit,
        bookedSlots: [],
        queuePosition: 0,
      })
    }

    // Get all active bookings for this doctor+date
    const bookings = await db.booking.findMany({
      where: {
        doctorId,
        bookingDate: { gte: dateOnly, lt: nextDay },
        status: { in: ['Approve', 'Visited', 'Finish'] },
      },
      select: { timeSlot: true },
    })

    const opdCount = bookings.length
    const bookedSlots = bookings.map((b) => b.timeSlot).filter(Boolean)
    const queuePosition = opdCount + 1
    const opdLimitReached = opdCount >= doctor.dailyLimit

    return NextResponse.json({
      available: !opdLimitReached,
      reason: opdLimitReached ? `OPD limit (${doctor.dailyLimit}) reached` : undefined,
      opdCount,
      opdLimit: doctor.dailyLimit,
      bookedSlots,
      queuePosition,
    })
  } catch (error) {
    console.error('Slots availability error:', error)
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
  }
}
