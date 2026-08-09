import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: session.user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { hospitalId: hospital.id }
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    }

    const [doctors, specializations] = await Promise.all([
      db.doctor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImg: true,
              status: true,
              mobileNo: true,
            },
          },
          _count: {
            select: { bookings: true, receivedRatings: true },
          },
        },
      }),
      db.doctor.findMany({
        distinct: ['specialization'],
        select: { specialization: true },
        where: { hospitalId: hospital.id, specialization: { not: '' } },
      }),
    ])

    const doctorIds = doctors.map((d) => d.user.id)
    const ratingAgg = await db.doctorRating.groupBy({
      by: ['doctorId'],
      where: { doctorId: { in: doctorIds } },
      _avg: { star: true },
      _count: { star: true },
    })
    const ratingMap = new Map(
      ratingAgg.map((r) => [r.doctorId, { avg: r._avg.star || 0, count: r._count.star }])
    )

    return NextResponse.json({
      doctors: doctors.map((d) => {
        const rating = ratingMap.get(d.user.id) || { avg: 0, count: 0 }
        return {
          id: d.id,
          userId: d.user.id,
          name: d.user.name,
          email: d.user.email,
          profileImg: d.user.profileImg,
          specialization: d.specialization,
          city: d.city,
          fees: d.fees,
          status: d.user.status,
          mobileNo: d.user.mobileNo,
          experience: d.experience,
          education: d.education,
          avgRating: Math.round(rating.avg * 10) / 10,
          totalRatings: rating.count,
          totalAppointments: d._count.bookings,
          createdAt: d.createdAt,
        }
      }),
      specializations: specializations.map((s) => s.specialization).sort(),
    })
  } catch (error) {
    console.error('Hospital doctors list error:', error)
    return NextResponse.json({ error: 'Failed to load doctors' }, { status: 500 })
  }
}
