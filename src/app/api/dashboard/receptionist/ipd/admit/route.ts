import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { generateIpdAdmissionNo } from '@/lib/ipd-utils'
import { emitNotification, hospitalRoom, roleRoom } from '@/lib/emit-notification'

// ============ POST: Create new IPD admission (Form 1 — Admission Sheet) ============
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find receptionist profile
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      wardId,
      bedId,
      departmentId,
      attendingDoctorId,
      patientName,
      patientAge,
      patientGender,
      bloodGroup,
      maritalStatus,
      mobileNo,
      aadharNo,
      fatherName,
      motherName,
      husbandWifeName,
      contactPersonName,
      contactPersonMobile,
      contactPersonRelation,
      address,
      village,
      taluka,
      district,
      state,
      pinCode,
      mlcCase,
      previousHospitalization,
      mediClaimDetails,
      initialDiagnosis,
    } = body

    // Validate required fields
    if (!wardId || !bedId || !departmentId || !attendingDoctorId || !patientName || !patientAge || !patientGender) {
      return NextResponse.json(
        { error: 'Missing required fields: wardId, bedId, departmentId, attendingDoctorId, patientName, patientAge, patientGender' },
        { status: 400 }
      )
    }

    // Verify the bed is available and belongs to the ward
    const bed = await db.bed.findFirst({
      where: { id: bedId, wardId, status: 'Available' },
      include: { ward: { select: { hospitalId: true } } },
    })

    if (!bed || bed.ward.hospitalId !== receptionist.hospitalId) {
      return NextResponse.json({ error: 'Bed not available or does not belong to this hospital' }, { status: 400 })
    }

    // Verify department belongs to this hospital
    const department = await db.department.findFirst({
      where: { id: departmentId, hospitalId: receptionist.hospitalId },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found for this hospital' }, { status: 400 })
    }

    // Generate admission number
    const admissionNo = await generateIpdAdmissionNo(receptionist.hospitalId)

    // Format admission time
    const now = new Date()
    const admissionTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    // Create IPD admission and update bed status in a transaction
    const admission = await db.$transaction(async (tx) => {
      // Create the admission record
      const newAdmission = await tx.ipdAdmission.create({
        data: {
          admissionNo,
          hospitalId: receptionist.hospitalId,
          wardId,
          bedId,
          departmentId,
          attendingDoctorId,
          patientName: patientName || '',
          patientAge: patientAge || 0,
          patientGender: patientGender || '',
          bloodGroup: bloodGroup || '',
          maritalStatus: maritalStatus || '',
          mobileNo: mobileNo || '',
          aadharNo: aadharNo || '',
          fatherName: fatherName || '',
          motherName: motherName || '',
          husbandWifeName: husbandWifeName || '',
          contactPersonName: contactPersonName || '',
          contactPersonMobile: contactPersonMobile || '',
          contactPersonRelation: contactPersonRelation || '',
          address: address || '',
          village: village || '',
          taluka: taluka || '',
          district: district || '',
          state: state || '',
          pinCode: pinCode || '',
          mlcCase: mlcCase || false,
          previousHospitalization: previousHospitalization || '',
          mediClaimDetails: mediClaimDetails || '',
          initialDiagnosis: initialDiagnosis || '',
          admissionTime,
          status: 'Admitted',
          admittedBy: user.id,
        },
        include: {
          ward: { select: { name: true, wardType: true } },
          bed: { select: { bedNumber: true, bedType: true } },
          department: { select: { name: true, shortCode: true } },
          attendingDoctor: {
            select: { user: { select: { name: true } } },
          },
        },
      })

      // Update bed status to Occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { status: 'Occupied' },
      })

      return newAdmission
    })

    emitNotification('new-admission', [roleRoom('nurse'), roleRoom('receptionist'), hospitalRoom(admission.hospitalId)], {
      id: admission.id,
      title: 'New IPD Admission',
      message: `Patient ${admission.patientName} admitted to ${admission.ward.name}`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      admission: {
        id: admission.id,
        admissionNo: admission.admissionNo,
        patientName: admission.patientName,
        age: admission.patientAge,
        gender: admission.patientGender,
        wardName: admission.ward.name,
        wardType: admission.ward.wardType,
        bedNumber: admission.bed.bedNumber,
        departmentName: admission.department.name,
        attendingDoctorName: admission.attendingDoctor.user.name,
        status: admission.status,
        admissionDate: admission.admissionDate.toISOString(),
        admissionTime: admission.admissionTime,
        initialDiagnosis: admission.initialDiagnosis,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('IPD admit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
