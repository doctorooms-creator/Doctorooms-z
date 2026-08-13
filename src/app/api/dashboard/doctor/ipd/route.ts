import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
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

    const url = req.nextUrl
    const status = url.searchParams.get('status') || ''
    const search = url.searchParams.get('search') || ''

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const where: Record<string, unknown> = {
      attendingDoctorId: doctor.id,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { admissionNo: { contains: search } },
      ]
    }

    const admissions = await db.ipdAdmission.findMany({
      where,
      include: {
        ward: { select: { name: true } },
        bed: { select: { bedNumber: true } },
        department: { select: { name: true } },
        vitalRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        doctorOrders: {
          where: { status: 'Active' },
          select: { id: true },
        },
        medicineAdministrations: {
          where: {
            createdAt: { gte: todayStart },
            status: 'Pending',
          },
          select: { id: true },
        },
      },
      orderBy: { admissionDate: 'desc' },
    })

    // Stats
    const totalPatients = await db.ipdAdmission.count({
      where: { attendingDoctorId: doctor.id },
    })
    const admittedCount = await db.ipdAdmission.count({
      where: { attendingDoctorId: doctor.id, status: 'Admitted' },
    })
    const dischargedTodayCount = await db.ipdAdmission.count({
      where: {
        attendingDoctorId: doctor.id,
        status: 'Discharged',
        dischargeDate: { gte: todayStart, lte: todayEnd },
      },
    })
    const pendingMedsCount = await db.medicineAdministration.count({
      where: {
        admission: { attendingDoctorId: doctor.id, status: 'Admitted' },
        status: 'Pending',
        createdAt: { gte: todayStart },
      },
    })

    const patients = admissions.map((a) => {
      const latestVital = a.vitalRecords[0] || null
      return {
        id: a.id,
        admissionNo: a.admissionNo,
        patientName: a.patientName,
        patientAge: a.patientAge,
        patientGender: a.patientGender,
        wardName: a.ward?.name || '',
        bedNumber: a.bed?.bedNumber || '',
        departmentName: a.department?.name || '',
        status: a.status,
        admissionDate: a.admissionDate.toISOString(),
        initialDiagnosis: a.initialDiagnosis,
        latestVital: latestVital
          ? {
              bpSystolic: latestVital.bpSystolic,
              bpDiastolic: latestVital.bpDiastolic,
              pulse: latestVital.pulse,
              spo2: latestVital.spo2,
              temperature: latestVital.temperature,
              recordedAt: latestVital.recordedAt.toISOString(),
            }
          : null,
        activeOrderCount: a.doctorOrders.length,
        pendingMedicineCount: a.medicineAdministrations.length,
      }
    })

    return NextResponse.json({
      patients,
      stats: {
        totalPatients,
        admitted: admittedCount,
        dischargedToday: dischargedTodayCount,
        pendingMeds: pendingMedsCount,
      },
    })
  } catch (error) {
    console.error('Doctor IPD list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
