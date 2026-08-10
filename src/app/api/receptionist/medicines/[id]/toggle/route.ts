import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    // DoctorMedicine.userId stores Doctor.id
    const existing = await db.doctorMedicine.findUnique({ where: { id } })

    if (!existing || existing.userId !== receptionist.doctorId) {
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
