import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const city = searchParams.get('city') || ''
  const sort = searchParams.get('sort') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  try {
    const where: Prisma.UserWhereInput = {
      role: 'hospital',
      status: 'Active',
      hospital: { isNot: null },
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { hospital: { hospitalName: { contains: search } } },
      ]
    }

    if (city) {
      where.hospital = { ...((where.hospital as Record<string, unknown>) || {}), city }
    }

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sort === 'az'
        ? { hospital: { hospitalName: 'asc' } }
        : sort === 'za'
          ? { hospital: { hospitalName: 'desc' } }
          : { createdAt: 'desc' }

    const [hospitals, total, citiesResult] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          profileImg: true,
          hospital: {
            select: {
              id: true,
              hospitalName: true,
              address: true,
              city: true,
              state: true,
              contactNo: true,
              hospitalType: true,
              accreditation: true,
              facilities: true,
              establishedYear: true,
              bedCount: true,
              _count: {
                select: {
                  departments: true,
                  doctorLinks: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
      db.user.findMany({
        where: { role: 'hospital', status: 'Active', hospital: { city: { not: '' } } },
        select: { hospital: { select: { city: true } } },
        distinct: ['id'],
      }),
    ])

    const uniqueCities = [
      ...new Set(
        citiesResult
          .map((c) => c.hospital?.city)
          .filter(Boolean)
      ),
    ].sort() as string[]

    return NextResponse.json({
      data: hospitals,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Hospitals API error:', error)
    return NextResponse.json({ data: [], page, limit, total: 0, totalPages: 0 })
  }
}
