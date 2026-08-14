import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow admin access
    let hospitalId: string | null = null
    if (user.role === 'hospital') {
      const hospital = await db.hospital.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
      }
      hospitalId = hospital.id
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const doctorId = searchParams.get('doctorId')

    // Build where clause — only discharged patients
    const where: Record<string, unknown> = {
      status: { in: ['Discharged', 'DAMA', 'Expired', 'Transferred'] },
    }

    if (hospitalId) {
      where.hospitalId = hospitalId
    }

    if (fromDate || toDate) {
      where.dischargeDate = {} as Record<string, unknown>
      if (fromDate) (where.dischargeDate as Record<string, unknown>).gte = new Date(fromDate)
      if (toDate) (where.dischargeDate as Record<string, unknown>).lte = new Date(toDate)
    }

    if (doctorId && doctorId !== 'all') {
      where.attendingDoctorId = doctorId
    }

    const admissions = await db.ipdAdmission.findMany({
      where,
      select: {
        id: true,
        admissionNo: true,
        patientName: true,
        patientAge: true,
        patientGender: true,
        dischargeDate: true,
        dischargeTime: true,
        dischargeType: true,
        finalDiagnosis: true,
        department: {
          select: { name: true },
        },
        attendingDoctor: {
          select: { name: true },
        },
        ward: {
          select: { name: true },
        },
      },
      orderBy: { dischargeDate: 'desc' },
      take: 200,
    })

    const result = admissions.map((a) => ({
      id: a.id,
      admissionNo: a.admissionNo,
      patientName: a.patientName,
      patientAge: a.patientAge,
      patientGender: a.patientGender,
      dischargeDate: a.dischargeDate,
      dischargeTime: a.dischargeTime,
      dischargeType: a.dischargeType,
      finalDiagnosis: a.finalDiagnosis,
      departmentName: a.department.name,
      doctorName: a.attendingDoctor.name,
      wardName: a.ward.name,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Discharge summaries API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
