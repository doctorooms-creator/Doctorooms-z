import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const specialization = searchParams.get('specialization') || ''
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

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

    const [doctors, total, citiesResult, statesResult, specsResult] = await Promise.all([
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
        skip,
        take: limit,
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
      db.user.findMany({
        where: { role: 'doctor', status: 'Active', doctor: { specialization: { not: '' } } },
        select: { doctor: { select: { specialization: true } } },
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

    const uniqueSpecs = [
      ...new Set(
        specsResult
          .map((s) => s.doctor?.specialization)
          .filter(Boolean)
      ),
    ].sort() as string[]

    return NextResponse.json({
      data: doctorsWithRatings,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      filters: {
        cities: uniqueCities,
        states: uniqueStates,
        specializations: uniqueSpecs,
      },
    })
  } catch (error) {
    console.error('Doctors API error:', error)
    return NextResponse.json({ data: [], page, limit, total: 0, totalPages: 0, filters: { cities: [], states: [], specializations: [] } })
  }
}
