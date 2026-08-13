import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Verify department belongs to this hospital
    const existing = await db.department.findFirst({
      where: { id, hospitalId: hospital.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, nameHi, description, icon, floorNo, opdRoom, status, sortOrder } = body

    const department = await db.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(nameHi !== undefined && { nameHi: String(nameHi).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(icon !== undefined && { icon: String(icon).trim() }),
        ...(floorNo !== undefined && { floorNo: String(floorNo).trim() }),
        ...(opdRoom !== undefined && { opdRoom: String(opdRoom).trim() }),
        ...(status !== undefined && { status: String(status) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    })

    return NextResponse.json({ department })
  } catch (error) {
    console.error('Department PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Verify department belongs to this hospital
    const department = await db.department.findFirst({
      where: { id, hospitalId: hospital.id },
      include: {
        _count: { select: { doctorLinks: true } },
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    if (department._count.doctorLinks > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department: ${department._count.doctorLinks} doctor(s) are still linked. Unlink all doctors first.`,
        },
        { status: 400 }
      )
    }

    await db.department.delete({ where: { id } })

    return NextResponse.json({ message: 'Department deleted successfully' })
  } catch (error) {
    console.error('Department DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}
