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

    // Verify ownership via doctor record
    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const existing = await db.doctorMedicine.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== doctor.id) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, morning, afternoon, evening, dose, tab, description, status } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Medicine name cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (morning !== undefined) updateData.morning = morning
    if (afternoon !== undefined) updateData.afternoon = afternoon
    if (evening !== undefined) updateData.evening = evening
    if (dose !== undefined) updateData.dose = dose
    if (tab !== undefined) updateData.tab = typeof tab === 'number' ? tab : 1
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    const medicine = await db.doctorMedicine.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ medicine })
  } catch (error) {
    console.error('Update medicine error:', error)
    return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 })
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

    // Verify ownership via doctor record
    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const existing = await db.doctorMedicine.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== doctor.id) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    // Soft delete: set status to Inactive
    const medicine = await db.doctorMedicine.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ medicine })
  } catch (error) {
    console.error('Delete medicine error:', error)
    return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 })
  }
}
