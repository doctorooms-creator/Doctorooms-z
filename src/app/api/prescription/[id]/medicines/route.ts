import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { medicines } = body

    if (!Array.isArray(medicines)) {
      return NextResponse.json({ error: 'medicines array is required' }, { status: 400 })
    }

    // Verify prescription ownership
    const prescription = await db.prescription.findUnique({
      where: { id },
      select: { id: true, doctorId: true },
    })
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: prescription.doctorId, userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete existing medicines
    await db.pMedicine.deleteMany({ where: { prescriptionId: id } })

    // Create new medicine records
    const validMeds = medicines.filter(
      (m: Record<string, unknown>) => String(m.medicineName || m.medicine || '').trim()
    )

    if (validMeds.length > 0) {
      await db.pMedicine.createMany({
        data: validMeds.map((m: Record<string, unknown>) => ({
          prescriptionId: id,
          medicine: String(m.medicineName || m.medicine || ''),
          dose: String(m.selectedDose || m.dose || ''),
          morning: Math.max(0, Math.round(Number(m.morning) || 0)),
          afternoon: Math.max(0, Math.round(Number(m.afternoon) || 0)),
          evening: Math.max(0, Math.round(Number(m.evening) || 0)),
          tab: Math.max(0, Math.round(Number(m.tab) || 1)),
          description: String(m.description || ''),
          createdById: user.id,
        })),
      })
    }

    const savedMedicines = await db.pMedicine.findMany({
      where: { prescriptionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ medicines: savedMedicines })
  } catch (error) {
    console.error('Save medicines error:', error)
    return NextResponse.json({ error: 'Failed to save medicines' }, { status: 500 })
  }
}
