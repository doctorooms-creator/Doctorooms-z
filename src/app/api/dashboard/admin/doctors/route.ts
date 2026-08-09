import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'admin')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const cityFilter = searchParams.get('city') || 'all'
    const specFilter = searchParams.get('specialization') || 'all'

    const where: Record<string, unknown> = {}
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    }
    if (cityFilter !== 'all') {
      where.city = cityFilter
    }
    if (specFilter !== 'all') {
      where.specialization = specFilter
    }

    const [doctors, cities, specializations] = await Promise.all([
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
            },
          },
          _count: {
            select: {
              receivedRatings: true,
            },
          },
        },
      }),
      db.doctor.findMany({
        distinct: ['city'],
        select: { city: true },
        where: { city: { not: '' } },
      }),
      db.doctor.findMany({
        distinct: ['specialization'],
        select: { specialization: true },
        where: { specialization: { not: '' } },
      }),
    ])

    // Get average rating per doctor
    const doctorIds = doctors.map((d) => d.user.id)
    const ratingAgg = await db.doctorRating.groupBy({
      by: ['doctorId'],
      where: { doctorId: { in: doctorIds } },
      _avg: { star: true },
      _count: { star: true },
    })

    const ratingMap = new Map(ratingAgg.map((r) => [r.doctorId, { avg: r._avg.star || 0, count: r._count.star }]))

    const activeCount = doctors.filter((d) => d.user.status === 'Active').length
    const pendingCount = doctors.filter((d) => d.user.status === 'Pending').length

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
          avgRating: Math.round(rating.avg * 10) / 10,
          totalRatings: rating.count,
          experience: d.experience,
          education: d.education,
          description: d.description,
          address: d.address,
          contactNo: d.contactNo,
          createdAt: d.createdAt,
        }
      }),
      cities: cities.map((c) => c.city).sort(),
      specializations: specializations.map((s) => s.specialization).sort(),
      totalActive: activeCount,
      totalPending: pendingCount,
    })
  } catch (error) {
    console.error('Admin doctors list error:', error)
    return NextResponse.json({ error: 'Failed to load doctors' }, { status: 500 })
  }
}
