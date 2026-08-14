import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { differenceInDays } from 'date-fns'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { admissionId } = await params

    // Parse body
    const body = await req.json()
    const { dischargeType, finalDiagnosis, dischargeSummary, roomRentDays } = body as {
      dischargeType: 'Normal' | 'DAMA' | 'LAMA' | 'Expired'
      finalDiagnosis: string
      dischargeSummary: string
      roomRentDays?: number
    }

    // Validate required fields
    if (!dischargeType || !finalDiagnosis || !dischargeSummary) {
      return NextResponse.json({ error: 'Discharge type, final diagnosis, and discharge summary are required' }, { status: 400 })
    }

    if (!['Normal', 'DAMA', 'LAMA', 'Expired'].includes(dischargeType)) {
      return NextResponse.json({ error: 'Invalid discharge type' }, { status: 400 })
    }

    // Fetch admission and validate
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
    })

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: `Patient is already ${admission.status.toLowerCase()}, cannot discharge again` }, { status: 400 })
    }

    if (admission.attendingDoctorId !== doctor.id) {
      return NextResponse.json({ error: 'You are not the attending doctor for this patient' }, { status: 403 })
    }

    // Calculate room rent days if not provided
    const now = new Date()
    const calculatedDays = Math.max(1, differenceInDays(now, admission.admissionDate) + 1)
    const finalRoomRentDays = roomRentDays ?? calculatedDays

    const dischargeTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    // Determine the final admission status
    const finalStatus = dischargeType === 'Expired' ? 'Expired' : dischargeType === 'DAMA' ? 'DAMA' : 'Discharged'

    // Execute in a transaction
    const updatedAdmission = await db.$transaction(async (tx) => {
      // 1. Update IpdAdmission
      const updated = await tx.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          status: finalStatus,
          dischargeDate: now,
          dischargeTime,
          dischargeType,
          finalDiagnosis,
          dischargeSummary,
          roomRentDays: finalRoomRentDays,
        },
      })

      // 2. Stop ALL active DoctorOrders for this admission
      await tx.doctorOrder.updateMany({
        where: {
          admissionId,
          status: 'Active',
        },
        data: {
          status: 'Completed',
          stoppedAt: now,
          stoppedReason: 'Patient discharged',
        },
      })

      // 3. Update Bed status to Available
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'Available' },
      })

      // 4. Update all active NursePatientAssignments
      await tx.nursePatientAssignment.updateMany({
        where: {
          admissionId,
          status: 'Active',
        },
        data: {
          status: 'Completed',
          unassignedAt: now,
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      admission: {
        id: updatedAdmission.id,
        admissionNo: updatedAdmission.admissionNo,
        status: updatedAdmission.status,
        dischargeDate: updatedAdmission.dischargeDate?.toISOString() || null,
        dischargeTime: updatedAdmission.dischargeTime,
        dischargeType: updatedAdmission.dischargeType,
        finalDiagnosis: updatedAdmission.finalDiagnosis,
        dischargeSummary: updatedAdmission.dischargeSummary,
        roomRentDays: updatedAdmission.roomRentDays,
      },
    })
  } catch (error) {
    console.error('Discharge POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
