import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await req.json()
    const { name, otType, floorNo, status } = body

    const existing = await db.operationTheater.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'OT not found' }, { status: 404 })
    }

    const updated = await db.operationTheater.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(otType !== undefined && { otType }),
        ...(floorNo !== undefined && { floorNo }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ ot: { id: updated.id, name: updated.name } })
  } catch (error) {
    console.error('Operation theater PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'hospital')
    if (!user) {
      const adminUser = await requireRole(req, 'admin')
      if (!adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id } = await params

    const existing = await db.operationTheater.findUnique({
      where: { id },
      include: { _count: { select: { schedules: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'OT not found' }, { status: 404 })
    }
    if (existing._count.schedules > 0) {
      return NextResponse.json(
        { error: 'Cannot delete OT with existing schedules' },
        { status: 400 }
      )
    }

    await db.operationTheater.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Operation theater DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
