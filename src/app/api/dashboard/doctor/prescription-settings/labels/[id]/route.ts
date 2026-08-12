import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const existing = await db.labelMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    const body = await req.json()
    const { label, labelEn, unit, showUnit, status } = body

    if (label !== undefined && !label.trim()) {
      return NextResponse.json({ error: 'Label name cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (label !== undefined) updateData.label = label.trim()
    if (labelEn !== undefined) updateData.labelEn = typeof labelEn === 'string' ? labelEn.trim() : ''
    if (unit !== undefined) updateData.unit = typeof unit === 'string' ? unit.trim() : ''
    if (showUnit !== undefined) updateData.showUnit = typeof showUnit === 'boolean' ? showUnit : true
    if (status !== undefined) updateData.status = status

    const updated = await db.labelMaster.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ label: updated })
  } catch (error) {
    console.error('Update label error:', error)
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const existing = await db.labelMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    const softDeleted = await db.labelMaster.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ label: softDeleted })
  } catch (error) {
    console.error('Delete label error:', error)
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}
