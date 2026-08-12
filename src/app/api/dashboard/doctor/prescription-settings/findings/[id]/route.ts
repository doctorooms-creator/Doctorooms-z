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

    const existing = await db.findingsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, nameEn, status } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Finding name cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (nameEn !== undefined) updateData.nameEn = typeof nameEn === 'string' ? nameEn.trim() : ''
    if (status !== undefined) updateData.status = status

    const finding = await db.findingsMaster.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ finding })
  } catch (error) {
    console.error('Update finding error:', error)
    return NextResponse.json({ error: 'Failed to update finding' }, { status: 500 })
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

    const existing = await db.findingsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    const finding = await db.findingsMaster.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ finding })
  } catch (error) {
    console.error('Delete finding error:', error)
    return NextResponse.json({ error: 'Failed to delete finding' }, { status: 500 })
  }
}
