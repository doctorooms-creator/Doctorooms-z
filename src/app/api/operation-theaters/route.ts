import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'hospital')
    if (!user) {
      const adminUser = await requireRole(req, 'admin')
      if (!adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      let effectiveUser = adminUser
    } else {
      let effectiveUser = user
    }

    const body = await req.json()
    const { name, otType, floorNo } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Resolve hospitalId
    let hospitalId: string
    if (effectiveUser.role === 'hospital') {
      const hospital = await db.hospital.findUnique({ where: { userId: effectiveUser.id } })
      if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
      hospitalId = hospital.id
    } else {
      const bodyHospitalId = body.hospitalId
      if (!bodyHospitalId) {
        return NextResponse.json({ error: 'hospitalId is required for admin' }, { status: 400 })
      }
      hospitalId = bodyHospitalId
    }

    const ot = await db.operationTheater.create({
      data: {
        hospitalId,
        name,
        otType: otType || 'Major',
        floorNo: floorNo || '',
        status: 'Available',
      },
    })

    return NextResponse.json({ ot: { id: ot.id, name: ot.name } }, { status: 201 })
  } catch (error) {
    console.error('Operation theater POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'hospital')
    if (!user) {
      const adminUser = await requireRole(req, 'admin')
      if (!adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      let effectiveUser = adminUser
    } else {
      let effectiveUser = user
    }

    // Resolve hospitalId
    let hospitalId: string | undefined
    if (effectiveUser.role === 'hospital') {
      const hospital = await db.hospital.findUnique({ where: { userId: effectiveUser.id } })
      if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
      hospitalId = hospital.id
    } else {
      const { searchParams } = new URL(req.url)
      hospitalId = searchParams.get('hospitalId') || undefined
    }

    const where: Record<string, unknown> = {}
    if (hospitalId) where.hospitalId = hospitalId

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const ots = await db.operationTheater.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            schedules: {
              where: {
                scheduledDate: { gte: today, lt: tomorrow },
                status: { in: ['Scheduled', 'InProgress'] },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      operationTheaters: ots.map((ot) => ({
        id: ot.id,
        hospitalId: ot.hospitalId,
        name: ot.name,
        otType: ot.otType,
        floorNo: ot.floorNo,
        status: ot.status,
        todayScheduleCount: ot._count.schedules,
        createdAt: ot.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Operation theaters GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
