import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    // Resolve doctor IDs for hospital mode
    let doctorIds: string[] = []
    if (isHospitalMode) {
      const dhLinks = await db.doctorHospital.findMany({
        where: { hospitalId: receptionist.hospitalId, status: 'Active' },
        select: { doctorId: true },
      })
      doctorIds = dhLinks.map(d => d.doctorId)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Build booking filter based on mode
    const bookingFilter = isHospitalMode
      ? { doctorId: { in: doctorIds }, hospitalId: receptionist.hospitalId }
      : { doctorId: receptionist.doctorId! }

    const where: Record<string, unknown> = {
      role: 'patient',
      bookings: { some: bookingFilter },
    }
    if (search) {
      where.AND = [
        { role: 'patient' },
        { bookings: { some: bookingFilter } },
        {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { mobileNo: { contains: search } },
          ],
        },
      ]
      delete where.role
      delete where.bookings
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
              where: bookingFilter,
            },
          },
        },
      },
    })

    // Get latest booking date per patient
    const latestBookings = await db.booking.groupBy({
      by: ['userId'],
      where: {
        ...bookingFilter,
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
