import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { checkVitalAlerts } from '@/lib/ipd-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { admissionId } = await params

    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: {
        ward: true,
        bed: true,
        department: true,
        attendingDoctor: {
          include: { user: { select: { name: true, mobileNo: true } } },
        },
        referringDoctor: {
          include: { user: { select: { name: true } } },
        },
        hospital: { select: { name: true } },
        doctorOrders: {
          where: { status: 'Active' },
          orderBy: { createdAt: 'desc' },
        },
        vitalRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        sampleCollections: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Check latest vitals for alerts
    const latestVital = admission.vitalRecords[0] || null
    let vitalAlerts: { parameter: string; level: string; message: string; value: number }[] = []
    if (latestVital) {
      vitalAlerts = checkVitalAlerts({
        spo2: latestVital.spo2 || undefined,
        bpSystolic: latestVital.bpSystolic || undefined,
        bpDiastolic: latestVital.bpDiastolic || undefined,
        pulse: latestVital.pulse || undefined,
        temperature: latestVital.temperature || undefined,
        respiratoryRate: latestVital.respiratoryRate || undefined,
      })
    }

    return NextResponse.json({
      admission: {
        id: admission.id,
        admissionNo: admission.admissionNo,
        admissionDate: admission.admissionDate,
        admissionTime: admission.admissionTime,
        status: admission.status,
        // Patient info
        patientName: admission.patientName,
        patientAge: admission.patientAge,
        patientGender: admission.patientGender,
        patientDob: admission.patientDob,
        bloodGroup: admission.bloodGroup,
        mobileNo: admission.mobileNo,
        aadharNo: admission.aadharNo,
        address: admission.address,
        fatherName: admission.fatherName,
        motherName: admission.motherName,
        husbandWifeName: admission.husbandWifeName,
        contactPersonName: admission.contactPersonName,
        contactPersonMobile: admission.contactPersonMobile,
        contactPersonRelation: admission.contactPersonRelation,
        maritalStatus: admission.maritalStatus,
        occupation: admission.occupation,
        // Medical
        initialDiagnosis: admission.initialDiagnosis,
        finalDiagnosis: admission.finalDiagnosis,
        mlcCase: admission.mlcCase,
        previousHospitalization: admission.previousHospitalization,
        mediClaimDetails: admission.mediClaimDetails,
        // History
        chiefComplaints: admission.chiefComplaints,
        informant: admission.informant,
        pastHistory: admission.pastHistory,
        personalHistory: admission.personalHistory,
        habits: admission.habits,
        femaleHistory: admission.femaleHistory,
        drugHistory: admission.drugHistory,
        // Physical Examination
        consciousnessLevel: admission.consciousnessLevel,
        obeyingCommands: admission.obeyingCommands,
        respondingToDPS: admission.respondingToDPS,
        oriented: admission.oriented,
        speech: admission.speech,
        examinationNotes: admission.examinationNotes,
        generalSigns: admission.generalSigns,
        // Related
        wardName: admission.ward?.name || '',
        wardType: admission.ward?.wardType || '',
        bedNumber: admission.bed?.bedNumber || '',
        bedType: admission.bed?.bedType || '',
        departmentName: admission.department?.name || '',
        attendingDoctorName: admission.attendingDoctor?.user?.name || '',
        attendingDoctorMobile: admission.attendingDoctor?.user?.mobileNo || '',
        referringDoctorName: admission.referringDoctor?.user?.name || '',
        hospitalName: admission.hospital?.name || '',
      },
      latestVital: latestVital
        ? {
            id: latestVital.id,
            temperature: latestVital.temperature,
            pulse: latestVital.pulse,
            spo2: latestVital.spo2,
            bpSystolic: latestVital.bpSystolic,
            bpDiastolic: latestVital.bpDiastolic,
            respiratoryRate: latestVital.respiratoryRate,
            inputMl: latestVital.inputMl,
            urineMl: latestVital.urineMl,
            outputMl: latestVital.outputMl,
            patientStatus: latestVital.patientStatus,
            ventilatorOn: latestVital.ventilatorOn,
            oxygenLiters: latestVital.oxygenLiters,
            infusionPump: latestVital.infusionPump,
            rbs: latestVital.rbs,
            remarks: latestVital.remarks,
            recordedAt: latestVital.recordedAt.toISOString(),
          }
        : null,
      vitalAlerts,
      doctorOrders: admission.doctorOrders,
      vitalRecords: admission.vitalRecords.map((v) => ({
        id: v.id,
        temperature: v.temperature,
        pulse: v.pulse,
        spo2: v.spo2,
        bpSystolic: v.bpSystolic,
        bpDiastolic: v.bpDiastolic,
        respiratoryRate: v.respiratoryRate,
        inputMl: v.inputMl,
        urineMl: v.urineMl,
        outputMl: v.outputMl,
        patientStatus: v.patientStatus,
        ventilatorOn: v.ventilatorOn,
        oxygenLiters: v.oxygenLiters,
        infusionPump: v.infusionPump,
        rbs: v.rbs,
        remarks: v.remarks,
        recordedAt: v.recordedAt.toISOString(),
      })),
      sampleCollections: admission.sampleCollections,
    })
  } catch (error) {
    console.error('Nurse patient detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
