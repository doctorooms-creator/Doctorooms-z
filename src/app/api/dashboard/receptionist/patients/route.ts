import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      role: 'patient',
      bookings: {
        some: { doctorId: receptionist.doctorId },
      },
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobileNo: { contains: search } },
      ]
    }

    const patients = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNo: true,
        profileImg: true,
        gender: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            bookings: {
              where: { doctorId: receptionist.doctorId },
            },
          },
        },
      },
    })

    // Get latest booking date per patient for this doctor
    const latestBookings = await db.booking.groupBy({
      by: ['userId'],
      where: {
        doctorId: receptionist.doctorId,
        userId: { not: null },
      },
      _max: { bookingDate: true },
    })
    const latestMap = new Map(
      latestBookings
        .filter((b) => b.userId)
        .map((b) => [b.userId!, b._max.bookingDate])
    )

    return NextResponse.json({
      patients: patients.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        mobileNo: p.mobileNo,
        profileImg: p.profileImg,
        gender: p.gender,
        status: p.status,
        visitCount: p._count.bookings,
        lastVisit: latestMap.get(p.id) || null,
        createdAt: p.createdAt,
      })),
    })
  } catch (error) {
    console.error('Receptionist patients list error:', error)
    return NextResponse.json({ error: 'Failed to load patients' }, { status: 500 })
  }
}
