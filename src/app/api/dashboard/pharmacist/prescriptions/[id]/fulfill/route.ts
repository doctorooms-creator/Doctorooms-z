import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_STATUSES = ['Packed', 'Dispensed']

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'pharmacist')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const body = await req.json()
    const { status } = body as { status: string }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get pharmacist link info
    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    // Get the prescription
    const prescription = await db.prescription.findUnique({
      where: { id },
      select: { doctorId: true, fulfillmentStatus: true },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const isHospitalMode = !!pharmacist.hospitalId && !pharmacist.doctorId

    // Verify access
    if (isHospitalMode) {
      // Hospital mode: verify the prescription's doctor is linked to pharmacist's hospital
      const doctorLink = await db.doctorHospital.findFirst({
        where: {
          doctorId: prescription.doctorId,
          hospitalId: pharmacist.hospitalId,
        },
      })
      if (!doctorLink) {
        return NextResponse.json(
          { error: 'Prescription not from your hospital' },
          { status: 403 }
        )
      }
    } else {
      // Clinic mode: verify the prescription belongs to pharmacist's doctor
      if (prescription.doctorId !== pharmacist.doctorId) {
        return NextResponse.json(
          { error: 'Prescription not from your doctor' },
          { status: 403 }
        )
      }
    }

    // Update the prescription
    const updated = await db.prescription.update({
      where: { id },
      data: {
        fulfillmentStatus: status,
        packedBy: user.id,
        packedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: updated.id,
      fulfillmentStatus: updated.fulfillmentStatus,
      packedBy: updated.packedBy,
      packedAt: updated.packedAt,
    })
  } catch (error) {
    console.error('Prescription fulfill error:', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}
