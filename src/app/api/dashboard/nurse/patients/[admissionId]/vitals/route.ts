import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { checkVitalAlerts } from '@/lib/ipd-utils'
import { emitNotification, hospitalRoom, roleRoom } from '@/lib/emit-notification'

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

    const vitals = await db.vitalRecord.findMany({
      where: { admissionId },
      orderBy: { recordedAt: 'desc' },
      include: {
        nurse: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    return NextResponse.json({
      vitals: vitals.map((v) => ({
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
        recordedByName: v.nurse?.user?.name || '',
      })),
    })
  } catch (error) {
    console.error('Get vitals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({
      where: { userId: user.id },
    })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    const { admissionId } = await params
    const body = await req.json()

    const {
      temperature,
      pulse,
      spo2,
      bpSystolic,
      bpDiastolic,
      respiratoryRate,
      inputMl,
      urineMl,
      outputMl,
      patientStatus,
      ventilatorOn,
      oxygenLiters,
      infusionPump,
      remarks,
      rbs,
    } = body

    const vital = await db.vitalRecord.create({
      data: {
        admissionId,
        nurseId: nurse.id,
        recordedAt: new Date(),
        temperature: parseFloat(temperature) || 0,
        pulse: parseInt(pulse) || 0,
        spo2: parseFloat(spo2) || 0,
        bpSystolic: parseInt(bpSystolic) || 0,
        bpDiastolic: parseInt(bpDiastolic) || 0,
        respiratoryRate: parseInt(respiratoryRate) || 0,
        inputMl: parseFloat(inputMl) || 0,
        urineMl: parseFloat(urineMl) || 0,
        outputMl: parseFloat(outputMl) || 0,
        patientStatus: patientStatus || 'Conscious',
        ventilatorOn: !!ventilatorOn,
        oxygenLiters: parseFloat(oxygenLiters) || 0,
        infusionPump: infusionPump || '',
        remarks: remarks || '',
        rbs: rbs ? parseFloat(rbs) : null,
      },
    })

    // Notify doctors about new vitals
    const vitalAdmission = await db.ipdAdmission.findUnique({ where: { id: admissionId }, select: { hospitalId: true } })
    if (vitalAdmission) {
      emitNotification('vital-recorded', [roleRoom('doctor'), hospitalRoom(vitalAdmission.hospitalId)], {
        id: vital.id,
        admissionId,
        title: 'Vitals Recorded',
        message: 'New vital signs recorded',
        timestamp: new Date().toISOString(),
      })
    }

    // Check for critical alerts and notify attending doctor
    const alerts = checkVitalAlerts({
      spo2: parseFloat(spo2) || undefined,
      bpSystolic: parseInt(bpSystolic) || undefined,
      bpDiastolic: parseInt(bpDiastolic) || undefined,
      pulse: parseInt(pulse) || undefined,
      temperature: parseFloat(temperature) || undefined,
      respiratoryRate: parseInt(respiratoryRate) || undefined,
    })

    const criticalAlerts = alerts.filter((a) => a.level === 'critical')
    if (criticalAlerts.length > 0) {
      const admission = await db.ipdAdmission.findUnique({
        where: { id: admissionId },
        select: { attendingDoctorId: true, patientName: true },
      })

      if (admission) {
        const doctor = await db.doctor.findUnique({
          where: { id: admission.attendingDoctorId },
          select: { userId: true },
        })

        if (doctor) {
          await db.notification.create({
            data: {
              userId: doctor.userId,
              title: `⚠️ Critical Vitals — ${admission.patientName}`,
              message: criticalAlerts.map((a) => a.message).join('; '),
              status: 'UNREAD',
            },
          })
        }
      }
    }

    return NextResponse.json({
      vital: {
        id: vital.id,
        recordedAt: vital.recordedAt.toISOString(),
      },
      alerts,
      criticalCount: criticalAlerts.length,
    })
  } catch (error) {
    console.error('Record vitals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
