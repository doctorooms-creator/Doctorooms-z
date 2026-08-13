import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { getCurrentShift, checkVitalAlerts } from '@/lib/ipd-utils'

export async function GET(req: NextRequest) {
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

    const shift = getCurrentShift()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const assignments = await db.nursePatientAssignment.findMany({
      where: {
        nurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
        shiftType: shift,
        status: 'Active',
      },
      include: {
        admission: {
          include: {
            ward: true,
            bed: true,
            department: true,
            attendingDoctor: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    const now = new Date()
    const patients = await Promise.all(
      assignments.map(async (assignment) => {
        const adm = assignment.admission

        // Latest vital record
        const latestVital = await db.vitalRecord.findFirst({
          where: { admissionId: adm.id },
          orderBy: { recordedAt: 'desc' },
        })

        // Check for abnormal vitals
        let hasCriticalAlert = false
        if (latestVital) {
          const alerts = checkVitalAlerts({
            spo2: latestVital.spo2 || undefined,
            bpSystolic: latestVital.bpSystolic || undefined,
            bpDiastolic: latestVital.bpDiastolic || undefined,
            pulse: latestVital.pulse || undefined,
            temperature: latestVital.temperature || undefined,
            respiratoryRate: latestVital.respiratoryRate || undefined,
          })
          hasCriticalAlert = alerts.some((a) => a.level === 'critical')
        }

        // Pending medicine count for current time slot
        const todayOrders = await db.doctorOrder.findMany({
          where: {
            admissionId: adm.id,
            status: 'Active',
          },
          select: {
            id: true,
            scheduledTime: true,
            administrations: {
              where: {
                scheduledTime: { gte: todayStart, lte: todayEnd },
              },
              select: { id: true, status: true },
            },
          },
        })

        let pendingMedicineCount = 0
        for (const order of todayOrders) {
          const [h, m] = order.scheduledTime.split(':').map(Number)
          const scheduledDt = new Date()
          scheduledDt.setHours(h, m, 0, 0)
          const given = order.administrations.find((a) => a.status === 'Given')
          if (!given && scheduledDt <= new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
            pendingMedicineCount++
          }
        }

        return {
          id: adm.id,
          admissionNo: adm.admissionNo,
          patientName: adm.patientName,
          age: adm.patientAge,
          gender: adm.patientGender,
          bedNumber: adm.bed?.bedNumber || '',
          wardName: adm.ward?.name || '',
          departmentName: adm.department?.name || '',
          doctorName: adm.attendingDoctor?.user?.name || '',
          status: adm.status,
          initialDiagnosis: adm.initialDiagnosis,
          latestVital: latestVital
            ? {
                id: latestVital.id,
                temperature: latestVital.temperature,
                pulse: latestVital.pulse,
                spo2: latestVital.spo2,
                bpSystolic: latestVital.bpSystolic,
                bpDiastolic: latestVital.bpDiastolic,
                respiratoryRate: latestVital.respiratoryRate,
                patientStatus: latestVital.patientStatus,
                recordedAt: latestVital.recordedAt.toISOString(),
              }
            : null,
          hasCriticalAlert,
          pendingMedicineCount,
        }
      })
    )

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Nurse patients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
