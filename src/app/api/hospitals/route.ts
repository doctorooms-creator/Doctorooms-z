import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const city = searchParams.get('city') || ''
  const sort = searchParams.get('sort') || ''

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

    const [hospitals, citiesResult] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          profileImg: true,
          hospital: {
            select: {
              hospitalName: true,
              address: true,
              city: true,
              state: true,
              contactNo: true,
            },
          },
        },
      }),
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

    return NextResponse.json({ hospitals, cities: uniqueCities })
  } catch (error) {
    console.error('Hospitals API error:', error)
    return NextResponse.json({ hospitals: [], cities: [] })
  }
}
