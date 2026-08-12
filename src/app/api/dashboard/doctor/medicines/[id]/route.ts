import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

function parseDose(dose: string): string[] {
  try {
    const parsed = JSON.parse(dose)
    if (Array.isArray(parsed)) return parsed
  } catch {
 // legacy single-string dose
    if (dose && dose !== '[]') return [dose]
  }
  return []
}

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
    const { name, doseArray, morning, afternoon, evening, tab, description, status } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Medicine name cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (doseArray !== undefined) {
      const safeDoseArray = Array.isArray(doseArray) ? doseArray.map(String) : []
      updateData.dose = JSON.stringify(safeDoseArray)
    }
    if (morning !== undefined) updateData.morning = typeof morning === 'number' ? Math.max(0, Math.round(morning)) : 0
    if (afternoon !== undefined) updateData.afternoon = typeof afternoon === 'number' ? Math.max(0, Math.round(afternoon)) : 0
    if (evening !== undefined) updateData.evening = typeof evening === 'number' ? Math.max(0, Math.round(evening)) : 0
    if (tab !== undefined) updateData.tab = typeof tab === 'number' ? Math.max(1, Math.round(tab)) : 1
    if (description !== undefined) updateData.description = typeof description === 'string' ? description.trim() : ''
    if (status !== undefined) updateData.status = status

    const medicine = await db.doctorMedicine.update({
      where: { id },
      data: updateData,
    })

    const doseArrayOut = parseDose(medicine.dose)
    return NextResponse.json({ medicine: { ...medicine, doseArray: doseArrayOut } })
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
