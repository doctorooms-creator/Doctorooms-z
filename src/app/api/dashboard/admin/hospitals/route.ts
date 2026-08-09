import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const cityFilter = searchParams.get('city') || 'all'

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { hospitalName: { contains: search } },
        { user: { name: { contains: search } } },
      ]
    }
    if (cityFilter !== 'all') {
      where.city = cityFilter
    }

    const [hospitals, cities] = await Promise.all([
      db.hospital.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      db.hospital.findMany({
        distinct: ['city'],
        select: { city: true },
        where: { city: { not: '' } },
      }),
    ])

    return NextResponse.json({
      hospitals: hospitals.map((h) => ({
        id: h.id,
        hospitalName: h.hospitalName,
        address: h.address,
        city: h.city,
        state: h.state,
        contactNo: h.contactNo,
        createdAt: h.createdAt,
        userName: h.user.name,
        userEmail: h.user.email,
      })),
      cities: cities.map((c) => c.city).sort(),
      total: hospitals.length,
    })
  } catch (error) {
    console.error('Admin hospitals list error:', error)
    return NextResponse.json({ error: 'Failed to load hospitals' }, { status: 500 })
  }
}
