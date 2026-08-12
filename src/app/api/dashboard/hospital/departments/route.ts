import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const departments = await db.department.findMany({
      where: { hospitalId: hospital.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { doctorLinks: true },
        },
      },
    })

    return NextResponse.json({
      departments: departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        nameHi: dept.nameHi,
        description: dept.description,
        icon: dept.icon,
        floorNo: dept.floorNo,
        opdRoom: dept.opdRoom,
        status: dept.status,
        sortOrder: dept.sortOrder,
        doctorCount: dept._count.doctorLinks,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Hospital departments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load departments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, nameHi, description, icon, floorNo, opdRoom } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Get max sortOrder for new department
    const maxSort = await db.department.aggregate({
      where: { hospitalId: hospital.id },
      _max: { sortOrder: true },
    })

    const department = await db.department.create({
      data: {
        hospitalId: hospital.id,
        name: name.trim(),
        nameHi: nameHi?.trim() || '',
        description: description?.trim() || '',
        icon: icon?.trim() || '',
        floorNo: floorNo?.trim() || '',
        opdRoom: opdRoom?.trim() || '',
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json({ department }, { status: 201 })
  } catch (error) {
    console.error('Hospital departments POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
