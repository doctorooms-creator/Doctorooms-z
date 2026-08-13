import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    if (search.length < 2) {
      return NextResponse.json({ doctors: [] })
    }

    // Search by doctor's user name - returns Doctor.id (not User.id)
    const doctors = await db.doctor.findMany({
      where: {
        user: {
          role: 'doctor',
          status: 'Active',
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        },
      },
      select: {
        id: true,            // Doctor.id - this is what DoctorHospital.doctorId needs
        userId: true,
        specialization: true,
        user: {
          select: {
            name: true,
            profileImg: true,
            email: true,
          },
        },
      },
      take: 10,
    })

    return NextResponse.json({
      doctors: doctors.map((d) => ({
        id: d.id,                    // Doctor.id
        userId: d.userId,            // User.id
        name: d.user.name,
        profileImg: d.user.profileImg,
        email: d.user.email,
        specialization: d.specialization,
      })),
    })
  } catch (error) {
    console.error('Search doctors error:', error)
    return NextResponse.json({ doctors: [] }, { status: 500 })
  }
}
