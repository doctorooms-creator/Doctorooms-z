import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    // Get distinct patients who have booked with this doctor
    const bookings = await db.booking.findMany({
      where: {
        doctorId: doctor.id,
        ...(search ? { patientName: { contains: search } } : {}),
      },
      distinct: ['userId'],
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, profileImg: true, gender: true, mobileNo: true } },
      },
    })

    const patientIds = bookings.filter((b) => b.userId).map((b) => b.userId!)

    // Get visit counts
    const visitCounts = patientIds.length > 0
      ? await db.booking.groupBy({
          by: ['userId'],
          where: { doctorId: doctor.id, userId: { in: patientIds } },
          _count: { userId: true },
        })
      : []

    const visitMap = visitCounts.reduce(
      (acc, v) => {
        if (v.userId) acc[v.userId] = v._count.userId
        return acc
      },
      {} as Record<string, number>
    )

    // Get last visit dates
    const lastVisits = patientIds.length > 0
      ? await db.booking.groupBy({
          by: ['userId'],
          where: { doctorId: doctor.id, userId: { in: patientIds } },
          _max: { bookingDate: true },
        })
      : []

    const lastVisitMap = lastVisits.reduce(
      (acc, v) => {
        if (v.userId) acc[v.userId] = v._max.bookingDate
        return acc
      },
      {} as Record<string, Date | null>
    )

    const patients = bookings
      .filter((b) => b.userId)
      .map((b) => ({
        userId: b.userId!,
        name: b.user?.name || b.patientName || 'Unknown',
        img: b.user?.profileImg || '',
        gender: b.user?.gender || '',
        mobile: b.user?.mobileNo || '',
        totalVisits: visitMap[b.userId!] || 0,
        lastVisit: lastVisitMap[b.userId!] || null,
      }))

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Doctor patients error:', error)
    return NextResponse.json({ error: 'Failed to load patients' }, { status: 500 })
  }
}
