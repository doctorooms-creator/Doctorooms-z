import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { todayISTRange } from '@/lib/date-utils'

// ============ GET: List IPD admissions for receptionist's hospital ============
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find receptionist and their hospital
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist profile not found' }, { status: 404 })
    }

    const hospitalId = receptionist.hospitalId

    // Parse query params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status') || ''
    const wardId = searchParams.get('wardId') || ''
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { hospitalId }

    if (status) {
      where.status = status
    }
    if (wardId) {
      where.wardId = wardId
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { admissionNo: { contains: search } },
      ]
    }

    // Fetch stats in parallel
    const { start: startOfDay, end: endOfDay } = todayISTRange()

    const [admissions, total, totalAdmitted, dischargedToday, bedsOccupied, totalBeds] = await Promise.all([
      db.ipdAdmission.findMany({
        where,
        include: {
          ward: { select: { name: true, wardType: true } },
          bed: { select: { bedNumber: true, bedType: true } },
          department: { select: { name: true, shortCode: true } },
          attendingDoctor: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { admissionDate: 'desc' },
        skip,
        take: limit,
      }),
      db.ipdAdmission.count({ where }),
      db.ipdAdmission.count({
        where: { hospitalId, status: 'Admitted' },
      }),
      db.ipdAdmission.count({
        where: {
          hospitalId,
          status: 'Discharged',
          dischargeDate: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.bed.count({
        where: { ward: { hospitalId }, status: 'Occupied' },
      }),
      db.bed.count({
        where: { ward: { hospitalId } },
      }),
    ])

    // Today's admissions count
    const todayAdmissions = await db.ipdAdmission.count({
      where: {
        hospitalId,
        admissionDate: { gte: startOfDay, lte: endOfDay },
      },
    })

    const formattedAdmissions = admissions.map((a) => ({
      id: a.id,
      admissionNo: a.admissionNo,
      patientName: a.patientName,
      age: a.patientAge,
      gender: a.patientGender,
      wardName: a.ward.name,
      wardType: a.ward.wardType,
      bedNumber: a.bed.bedNumber,
      bedType: a.bed.bedType,
      departmentName: a.department.name,
      departmentShortCode: a.department.shortCode,
      attendingDoctorName: a.attendingDoctor.user.name,
      status: a.status,
      admissionDate: a.admissionDate.toISOString(),
      admissionTime: a.admissionTime,
      initialDiagnosis: a.initialDiagnosis,
    }))

    return NextResponse.json({
      admissions: formattedAdmissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAdmitted,
        dischargedToday,
        bedsOccupied,
        totalBeds,
        todayAdmissions,
      },
    })
  } catch (error) {
    console.error('IPD list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
