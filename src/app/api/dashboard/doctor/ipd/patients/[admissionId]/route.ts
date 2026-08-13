import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { checkVitalAlerts } from '@/lib/ipd-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { admissionId } = await params

    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: {
        ward: true,
        bed: true,
        department: true,
        hospital: { select: { name: true } },
        attendingDoctor: {
          include: { user: { select: { name: true, mobileNo: true } } },
        },
        referringDoctor: {
          include: { user: { select: { name: true } } },
        },
        vitalRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 24,
        },
        doctorOrders: {
          where: { status: 'Active' },
          orderBy: { createdAt: 'desc' },
        },
        medicineAdministrations: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            order: { select: { drugName: true, dose: true, route: true } },
            nurse: { include: { user: { select: { name: true } } } },
          },
        },
        sampleCollections: {
          orderBy: { createdAt: 'desc' },
        },
        investigationReports: {
          orderBy: { reportDate: 'desc' },
        },
        doctorVisits: {
          orderBy: { visitDate: 'desc' },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
      },
    })

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Verify this doctor is the attending doctor
    if (admission.attendingDoctorId !== doctor.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
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
        admissionDate: admission.admissionDate.toISOString(),
        admissionTime: admission.admissionTime,
        status: admission.status,
        dischargeDate: admission.dischargeDate?.toISOString() || null,
        dischargeType: admission.dischargeType,
        finalDiagnosis: admission.finalDiagnosis,
        // Patient info
        patientName: admission.patientName,
        patientAge: admission.patientAge,
        patientGender: admission.patientGender,
        patientDob: admission.patientDob?.toISOString() || null,
        bloodGroup: admission.bloodGroup,
        mobileNo: admission.mobileNo,
        aadharNo: admission.aadharNo,
        maritalStatus: admission.maritalStatus,
        occupation: admission.occupation,
        address: admission.address,
        fatherName: admission.fatherName,
        contactPersonName: admission.contactPersonName,
        contactPersonMobile: admission.contactPersonMobile,
        contactPersonRelation: admission.contactPersonRelation,
        // Medical
        initialDiagnosis: admission.initialDiagnosis,
        mlcCase: admission.mlcCase,
        previousHospitalization: admission.previousHospitalization,
        mediClaimDetails: admission.mediClaimDetails,
        // History (Form 2)
        chiefComplaints: admission.chiefComplaints,
        informant: admission.informant,
        pastHistory: admission.pastHistory,
        personalHistory: admission.personalHistory,
        habits: admission.habits,
        femaleHistory: admission.femaleHistory,
        drugHistory: admission.drugHistory,
        // Physical Examination (Form 6)
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
      doctorOrders: admission.doctorOrders.map((o) => ({
        id: o.id,
        drugName: o.drugName,
        route: o.route,
        dose: o.dose,
        frequency: o.frequency,
        scheduledTime: o.scheduledTime,
        instructions: o.instructions,
        isPrn: o.isPrn,
        isStat: o.isStat,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      medicineAdministrations: admission.medicineAdministrations.map((m) => ({
        id: m.id,
        status: m.status,
        scheduledTime: m.scheduledTime.toISOString(),
        administeredTime: m.administeredTime?.toISOString() || null,
        remarks: m.remarks,
        drugName: m.order.drugName,
        dose: m.order.dose,
        route: m.order.route,
        nurseName: m.nurse.user?.name || '',
      })),
      sampleCollections: admission.sampleCollections.map((s) => ({
        id: s.id,
        testName: s.testName,
        sampleType: s.sampleType,
        status: s.status,
        collectedAt: s.collectedAt?.toISOString() || null,
        sentToLabAt: s.sentToLabAt?.toISOString() || null,
        createdAt: s.createdAt.toISOString(),
      })),
      investigationReports: admission.investigationReports.map((r) => ({
        id: r.id,
        testName: r.testName,
        reportDate: r.reportDate.toISOString(),
        resultData: r.resultData,
        normalRange: r.normalRange,
        isAbnormal: r.isAbnormal,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt?.toISOString() || null,
        remarks: r.remarks,
      })),
      doctorVisits: admission.doctorVisits.map((v) => ({
        id: v.id,
        visitDate: v.visitDate.toISOString(),
        visitTime: v.visitTime,
        examinationFindings: v.examinationFindings,
        currentDiagnosis: v.currentDiagnosis,
        newOrders: v.newOrders,
        stoppedOrders: v.stoppedOrders,
        advise: v.advise,
        isMobileVisit: v.isMobileVisit,
        doctorName: v.doctor.user?.name || '',
      })),
    })
  } catch (error) {
    console.error('Doctor IPD patient detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
