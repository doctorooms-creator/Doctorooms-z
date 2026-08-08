import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const specialization = searchParams.get('specialization') || ''
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''

  try {
    const where: Prisma.UserWhereInput = {
      role: 'doctor',
      status: 'Active',
      doctor: { isNot: null },
    }

    if (search) {
      where.name = { contains: search }
    }

    if (specialization) {
      where.doctor = { ...((where.doctor as Record<string, unknown>) || {}), specialization }
    }

    if (city) {
      where.doctor = { ...((where.doctor as Record<string, unknown>) || {}), city }
    }

    if (state) {
      where.doctor = { ...((where.doctor as Record<string, unknown>) || {}), state }
    }

    const [doctors, total, citiesResult, statesResult] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          profileImg: true,
          doctor: {
            select: {
              specialization: true,
              city: true,
              state: true,
              fees: true,
              experience: true,
              isEmergency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
      db.user.findMany({
        where: { role: 'doctor', status: 'Active', doctor: { city: { not: '' } } },
        select: { doctor: { select: { city: true } } },
        distinct: ['id'],
      }),
      db.user.findMany({
        where: { role: 'doctor', status: 'Active', doctor: { state: { not: '' } } },
        select: { doctor: { select: { state: true } } },
        distinct: ['id'],
      }),
    ])

    // Get rating averages for all doctors
    const doctorIds = doctors.map((d) => d.id)
    const ratingAggregates =
      doctorIds.length > 0
        ? await db.doctorRating.groupBy({
            by: ['doctorId'],
            where: { doctorId: { in: doctorIds } },
            _avg: { star: true },
            _count: { star: true },
          })
        : []

    const ratingMap = new Map(
      ratingAggregates.map((r) => [
        r.doctorId,
        { _avg: { star: r._avg.star || 0 }, _count: { star: r._count.star || 0 } },
      ])
    )

    const doctorsWithRatings = doctors.map((d) => ({
      ...d,
      _avgRating: ratingMap.get(d.id)?._avg || { star: 0 },
      _ratingCount: ratingMap.get(d.id)?._count || { star: 0 },
    }))

    const uniqueCities = [
      ...new Set(
        citiesResult
          .map((c) => c.doctor?.city)
          .filter(Boolean)
      ),
    ].sort() as string[]

    const uniqueStates = [
      ...new Set(
        statesResult
          .map((s) => s.doctor?.state)
          .filter(Boolean)
      ),
    ].sort() as string[]

    return NextResponse.json({
      doctors: doctorsWithRatings,
      total,
      cities: uniqueCities,
      states: uniqueStates,
    })
  } catch (error) {
    console.error('Doctors API error:', error)
    return NextResponse.json({ doctors: [], total: 0, cities: [], states: [] })
  }
}
