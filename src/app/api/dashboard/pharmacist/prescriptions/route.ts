import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { istDateRange } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'pharmacist')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const isHospitalMode = !!pharmacist.hospitalId && !pharmacist.doctorId
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filterDoctorId = searchParams.get('doctorId') || ''
    const filterDepartmentId = searchParams.get('departmentId') || ''
    const filterStatus = searchParams.get('fulfillmentStatus') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    // Determine which doctor IDs this pharmacist can see
    let doctorIds: string[]

    if (isHospitalMode) {
      const hospitalDoctorLinks = await db.doctorHospital.findMany({
        where: { hospitalId: pharmacist.hospitalId },
        select: { doctorId: true },
      })
      doctorIds = hospitalDoctorLinks.map((d) => d.doctorId)
    } else {
      doctorIds = [pharmacist.doctorId!]
    }

    // Build where clause
    const where: Record<string, unknown> = { doctorId: { in: doctorIds } }

    if (search) {
      where.patientName = { contains: search }
    }

    if (filterDoctorId && isHospitalMode) {
      where.doctorId = filterDoctorId
    }

    if (filterStatus) {
      where.fulfillmentStatus = filterStatus
    }

    if (filterDepartmentId && isHospitalMode) {
      const deptDoctorLinks = await db.doctorHospital.findMany({
        where: { hospitalId: pharmacist.hospitalId, departmentId: filterDepartmentId },
        select: { doctorId: true },
      })
      const deptDoctorIds = deptDoctorLinks.map((d) => d.doctorId)
      if (filterDoctorId) {
        // Both doctor and department filter: intersect
        where.doctorId = deptDoctorIds.includes(filterDoctorId) ? filterDoctorId : '___none___'
      } else {
        where.doctorId = { in: deptDoctorIds }
      }
    }

    if (dateFrom) {
      const { start } = istDateRange(dateFrom)
      where.createdAt = { ...(where.createdAt as Record<string, unknown> || {}), gte: start }
    }
    if (dateTo) {
      const { end } = istDateRange(dateTo)
      where.createdAt = { ...(where.createdAt as Record<string, unknown> || {}), lte: end }
    }

    const [prescriptions, statusCounts] = await Promise.all([
      db.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          medicines: true,
          labels: true,
          doctor: {
            select: {
              id: true,
              user: { select: { name: true, profileImg: true } },
              doctorHospitals: {
                where: isHospitalMode
                  ? { hospitalId: pharmacist.hospitalId }
                  : undefined,
                select: {
                  department: { select: { id: true, name: true } },
                },
                take: 1,
              },
            },
          },
        },
      }),
      db.prescription.groupBy({
        by: ['fulfillmentStatus'],
        where: { doctorId: { in: doctorIds } },
        _count: { fulfillmentStatus: true },
      }),
    ])

    // Build fulfillment stats map
    const fulfillmentStats: Record<string, number> = {}
    for (const sc of statusCounts) {
      fulfillmentStats[sc.fulfillmentStatus] = sc._count.fulfillmentStatus
    }

    // Collect unique packedBy user IDs and batch-fetch names
    const packedByIds = [...new Set(prescriptions.map((rx) => rx.packedBy).filter(Boolean))] as string[]
    let packedByNames: Record<string, string> = {}
    if (packedByIds.length > 0) {
      const packedByUsers = await db.user.findMany({
        where: { id: { in: packedByIds } },
        select: { id: true, name: true },
      })
      for (const u of packedByUsers) {
        packedByNames[u.id] = u.name
      }
    }

    return NextResponse.json({
      isHospitalMode,
      prescriptions: prescriptions.map((rx) => ({
        id: rx.id,
        patientName: rx.patientName,
        disease: rx.disease,
        createdAt: rx.createdAt,
        updatedAt: rx.updatedAt,
        fulfillmentStatus: rx.fulfillmentStatus,
        packedBy: rx.packedBy,
        packedAt: rx.packedAt,
        doctorName: rx.doctor.user.name,
        departmentName: rx.doctor.doctorHospitals[0]?.department?.name || null,
        departmentId: rx.doctor.doctorHospitals[0]?.department?.id || null,
        doctorId: rx.doctorId,
        medicines: rx.medicines,
        labels: rx.labels,
        packedByName: rx.packedBy ? packedByNames[rx.packedBy] || null : null,
      })),
      fulfillmentStats,
    })
  } catch (error) {
    console.error('Pharmacist prescriptions error:', error)
    return NextResponse.json({ error: 'Failed to load prescriptions' }, { status: 500 })
  }
}
