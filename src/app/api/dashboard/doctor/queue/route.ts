import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISTRange, todayISTStr } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true, dailyLimit: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Today's date in IST
    const { start: startOfDay, end: endOfDay } = todayISTRange()
    const todayStr = todayISTStr()

    // Fetch all Approve/Visited bookings for today
    const bookings = await db.booking.findMany({
      where: {
        doctorId: doctor.id,
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ['Approve', 'Visited'] },
      },
      include: {
        user: { select: { name: true, profileImg: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Count completed OPD today
    const opdCompletedToday = await db.booking.count({
      where: {
        doctorId: doctor.id,
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'Finish',
      },
    })

    // Calculate queue position for each booking (FCFS)
    const queueWithPositions = await Promise.all(
      bookings.map(async (booking) => {
        // Count bookings ahead of this one (created earlier, same doctor+date, Approve/Visited)
        const aheadCount = await db.booking.count({
          where: {
            doctorId: doctor.id,
            bookingDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { in: ['Approve', 'Visited'] },
            createdAt: { lte: booking.createdAt },
            id: { not: booking.id },
          },
        })

        return {
          id: booking.id,
          appointmentNo: booking.appointmentNo,
          patientName: booking.patientName || booking.user?.name || 'Walk-in',
          patientImg: booking.user?.profileImg || 'default.png',
          disease: booking.disease,
          timeSlot: booking.timeSlot,
          bookingMode: booking.bookingMode,
          bookingType: booking.bookingType,
          createdAt: booking.createdAt.toISOString(),
          status: booking.status,
          queuePosition: aheadCount + 1,
        }
      })
    )

    // Sort by createdAt ascending (already done by Prisma, but ensure)
    queueWithPositions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return NextResponse.json({
      date: todayStr,
      totalInQueue: queueWithPositions.length,
      queue: queueWithPositions,
      opdLimit: doctor.dailyLimit,
      opdCompletedToday,
    })
  } catch (error) {
    console.error('Doctor queue error:', error)
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }
}
