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
    const { vitals, labels } = body

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

    // Update prescription vitals
    await db.prescription.update({
      where: { id },
      data: {
        weight: vitals?.weight?.toString() || '',
        bp: vitals?.bp?.toString() || '',
        temperature: vitals?.temperature?.toString() || '',
      },
    })

    // Delete existing labels
    await db.pLabel.deleteMany({ where: { prescriptionId: id } })

    // Create new label records
    if (Array.isArray(labels) && labels.length > 0) {
      await db.pLabel.createMany({
        data: labels.map((lbl: Record<string, unknown>) => ({
          prescriptionId: id,
          label: String(lbl.label || ''),
          labelEn: String(lbl.labelEn || ''),
          value: String(lbl.value || ''),
          labelUnit: String(lbl.labelUnit || ''),
          showUnit: Boolean(lbl.showUnit !== false),
          createdById: user.id,
        })),
      })
    }

    // Fetch saved labels for response
    const savedLabels = await db.pLabel.findMany({
      where: { prescriptionId: id },
    })

    return NextResponse.json({ labels: savedLabels })
  } catch (error) {
    console.error('Save vitals error:', error)
    return NextResponse.json({ error: 'Failed to save vitals' }, { status: 500 })
  }
}
