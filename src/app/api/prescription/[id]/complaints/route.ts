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
    const { complaintIds } = body

    if (!Array.isArray(complaintIds)) {
      return NextResponse.json({ error: 'complaintIds array is required' }, { status: 400 })
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

    // Delete existing complaints
    await db.pCo.deleteMany({ where: { prescriptionId: id } })

    // Create new complaint links
    if (complaintIds.length > 0) {
      await db.pCo.createMany({
        data: complaintIds.map((coId: string) => ({
          prescriptionId: id,
          coId,
          createdById: user.id,
        })),
      })
    }

    // Fetch the saved complaints with master data for response
    const savedComplaints = await db.pCo.findMany({
      where: { prescriptionId: id },
      include: {
        co: {
          select: { id: true, coDetail: true, coDetailEn: true, coCode: true },
        },
      },
    })

    return NextResponse.json({ complaints: savedComplaints })
  } catch (error) {
    console.error('Save complaints error:', error)
    return NextResponse.json({ error: 'Failed to save complaints' }, { status: 500 })
  }
}
