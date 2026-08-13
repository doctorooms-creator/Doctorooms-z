import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { checkVitalAlerts } from '@/lib/ipd-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({
      where: { userId: user.id },
      include: { hospital: true, ward: true },
    })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    // If nurse has no ward assigned, return all wards of their hospital
    if (!nurse.wardId) {
      const wards = await db.ward.findMany({
        where: { hospitalId: nurse.hospitalId, status: 'Active' },
        include: {
          beds: {
            select: { id: true, status: true },
          },
        },
        orderBy: [{ floorNo: 'asc' }, { name: 'asc' }],
      })

      const wardList = wards.map((w) => {
        const total = w.beds.length
        const occupied = w.beds.filter((b) => b.status === 'Occupied').length
        const available = w.beds.filter((b) => b.status === 'Available').length
        return {
          id: w.id,
          name: w.name,
          wardType: w.wardType,
          floorNo: w.floorNo,
          totalBeds: total,
          occupied,
          available,
        }
      })

      return NextResponse.json({
        hasWard: false,
        hospitalName: nurse.hospital?.name || '',
        wards: wardList,
      })
    }

    // Nurse has a ward — return ward details with all beds
    const ward = await db.ward.findUnique({
      where: { id: nurse.wardId },
      include: {
        hospital: true,
        beds: {
          include: {
            admission: {
              include: {
                department: true,
                attendingDoctor: {
                  include: { user: { select: { name: true } } },
                },
                vitalRecords: {
                  orderBy: { recordedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { bedNumber: 'asc' },
        },
      },
    })

    if (!ward) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    const totalBeds = ward.beds.length
    const occupiedCount = ward.beds.filter((b) => b.status === 'Occupied').length
    const availableCount = ward.beds.filter((b) => b.status === 'Available').length

    const beds = ward.beds.map((bed) => {
      if (bed.status !== 'Occupied' || !bed.admission) {
        return {
          id: bed.id,
          bedNumber: bed.bedNumber,
          bedType: bed.bedType,
          status: bed.status,
          dailyRate: bed.dailyRate,
          patient: null,
          vitalAlerts: [],
        }
      }

      const admission = bed.admission
      const latestVital = admission.vitalRecords[0] || null

      // Check vital alerts
      const vitalAlerts = latestVital
        ? checkVitalAlerts({
            spo2: latestVital.spo2 || undefined,
            bpSystolic: latestVital.bpSystolic || undefined,
            bpDiastolic: latestVital.bpDiastolic || undefined,
            pulse: latestVital.pulse || undefined,
            temperature: latestVital.temperature || undefined,
            respiratoryRate: latestVital.respiratoryRate || undefined,
          })
        : []

      return {
        id: bed.id,
        bedNumber: bed.bedNumber,
        bedType: bed.bedType,
        status: bed.status,
        dailyRate: bed.dailyRate,
        patient: {
          admissionId: admission.id,
          admissionNo: admission.admissionNo,
          patientName: admission.patientName,
          age: admission.patientAge,
          gender: admission.patientGender,
          diagnosis: admission.initialDiagnosis,
          doctorName: admission.attendingDoctor?.user?.name || '',
          departmentName: admission.department?.name || '',
          status: admission.status,
          admissionDate: admission.admissionDate,
        },
        latestVital: latestVital
          ? {
              temperature: latestVital.temperature,
              pulse: latestVital.pulse,
              spo2: latestVital.spo2,
              bpSystolic: latestVital.bpSystolic,
              bpDiastolic: latestVital.bpDiastolic,
              respiratoryRate: latestVital.respiratoryRate,
              patientStatus: latestVital.patientStatus,
              recordedAt: latestVital.recordedAt,
            }
          : null,
        vitalAlerts,
        hasCriticalAlert: vitalAlerts.some((a) => a.level === 'critical'),
      }
    })

    return NextResponse.json({
      hasWard: true,
      ward: {
        id: ward.id,
        name: ward.name,
        wardType: ward.wardType,
        floorNo: ward.floorNo,
        hospitalName: ward.hospital?.name || '',
      },
      beds,
      stats: {
        totalBeds,
        occupied: occupiedCount,
        available: availableCount,
      },
    })
  } catch (error) {
    console.error('Nurse ward patients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
