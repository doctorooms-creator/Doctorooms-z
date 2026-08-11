import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

/**
 * POST /api/prescription-access/request
 * Doctor Z requests access to a prescription created by Doctor Y for a patient.
 * Body: { prescriptionId, patientId }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { prescriptionId, patientId } = body as { prescriptionId?: string; patientId?: string }

    if (!prescriptionId || !patientId) {
      return NextResponse.json(
        { error: 'prescriptionId and patientId are required' },
        { status: 400 }
      )
    }

    // Fetch the prescription with its doctor info
    const prescription = await db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        booking: { select: { userId: true } },
        doctor: { select: { id: true, user: { select: { name: true } } } },
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Verify the patient owns this prescription (via booking.userId)
    const actualPatientId = prescription.booking?.userId
    if (!actualPatientId) {
      return NextResponse.json(
        { error: 'This prescription has no linked patient' },
        { status: 400 }
      )
    }
    if (actualPatientId !== patientId) {
      return NextResponse.json({ error: 'Patient ID mismatch' }, { status: 400 })
    }

    // If this doctor created the prescription, no need to request access
    if (prescription.doctorId === doctor.id) {
      return NextResponse.json(
        { error: 'This is your own prescription. No access request needed.' },
        { status: 400 }
      )
    }

    // Check if a request already exists (pending or approved)
    const existingRequest = await db.prescriptionAccessRequest.findFirst({
      where: {
        prescriptionId,
        requestingDoctorId: doctor.id,
        patientId: actualPatientId,
        status: { in: ['Pending', 'Approved'] },
      },
    })

    if (existingRequest) {
      if (existingRequest.status === 'Approved') {
        return NextResponse.json({
          success: false,
          message: 'You already have access to this prescription',
          requestStatus: 'Approved',
        })
      }
      return NextResponse.json({
        success: false,
        message: 'A pending request already exists for this prescription',
        requestStatus: 'Pending',
      })
    }

    // Create the access request
    const accessRequest = await db.prescriptionAccessRequest.create({
      data: {
        prescriptionId,
        requestingDoctorId: doctor.id,
        patientId: actualPatientId,
        originalDoctorId: prescription.doctorId,
        status: 'Pending',
      },
      include: {
        requestingDoctor: {
          include: { user: { select: { name: true, profileImg: true } } },
        },
        originalDoctor: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    // Create notification for the patient
    await db.notification.create({
      data: {
        userId: actualPatientId,
        title: 'Prescription Access Request',
        message: `Dr. ${accessRequest.requestingDoctor.user.name} has requested access to your prescription (by Dr. ${accessRequest.originalDoctor.user.name}). Please review and approve or reject this request in your prescription access settings.`,
        status: 'UNREAD',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Access request sent to patient',
      request: accessRequest,
    }, { status: 201 })
  } catch (error) {
    console.error('Prescription access request error:', error)
    return NextResponse.json({ error: 'Failed to create access request' }, { status: 500 })
  }
}
