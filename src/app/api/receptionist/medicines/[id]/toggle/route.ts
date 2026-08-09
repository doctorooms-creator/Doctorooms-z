import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { userId: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const existing = await db.doctorMedicine.findUnique({ where: { id } })

    if (!existing || existing.userId !== doctor.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const newStatus = existing.status === 'Active' ? 'Inactive' : 'Active'

    const updated = await db.doctorMedicine.update({
      where: { id },
      data: { status: newStatus },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Receptionist medicine toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle medicine status' }, { status: 500 })
  }
}
