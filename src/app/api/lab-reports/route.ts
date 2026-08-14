import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireAuth } from '@/lib/api-auth'
import { emitNotification, hospitalRoom, roleRoom } from '@/lib/emit-notification'
import { validateBody, createLabReportSchema } from '@/lib/validations'

// POST /api/lab-reports — Order lab test
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['doctor', 'receptionist'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const v = validateBody(createLabReportSchema, body)
    if (!v.success) return v.error
    const { testMasterId, admissionId, bookingId, patientName, patientAge, patientGender, urgency } = v.data
    const { patientId, doctorId } = body

    // Resolve hospitalId
    let hospitalId: string | null = null
    if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
      if (doctor) hospitalId = doctor.hospitalId
    } else if (user.role === 'receptionist') {
      const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
      if (receptionist) hospitalId = receptionist.hospitalId
    }

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital not found for this user' }, { status: 400 })
    }

    // Verify test master exists and belongs to hospital
    const testMaster = await db.labTestMaster.findFirst({
      where: { id: testMasterId, hospitalId, status: 'Active' },
      include: { parameters: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!testMaster) {
      return NextResponse.json({ error: 'Lab test not found or inactive' }, { status: 404 })
    }

    // Auto-generate report number
    const count = await db.labReport.count({ where: { hospitalId } })
    const reportNo = `LR-${String(count + 1).padStart(5, '0')}`

    const report = await db.$transaction(async (tx) => {
      const labReport = await tx.labReport.create({
        data: {
          reportNo,
          hospitalId,
          testMasterId,
          admissionId: admissionId || null,
          bookingId: bookingId || null,
          patientId: patientId || null,
          patientName,
          patientAge: typeof patientAge === 'number' ? patientAge : 0,
          patientGender: patientGender || '',
          doctorId: doctorId || null,
          orderedById: user.id,
          urgency: urgency || 'Normal',
        },
      })

      // Create empty parameter values for each test parameter
      if (testMaster.parameters.length > 0) {
        await tx.labParameterValue.createMany({
          data: testMaster.parameters.map((param) => ({
            labReportId: labReport.id,
            testParameterId: param.id,
          })),
        })
      }

      return tx.labReport.findUnique({
        where: { id: labReport.id },
        include: {
          parameterValues: {
            include: { testParameter: true },
            orderBy: { testParameter: { sortOrder: 'asc' } },
          },
        },
      })
    })

    if (report) {
      emitNotification('sample-ordered', [roleRoom('lab_technician'), hospitalRoom(hospitalId)], {
        id: report.id,
        title: 'Lab Test Ordered',
        message: `Lab test ordered for ${report.patientName}`,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ labReport: report }, { status: 201 })
  } catch (error) {
    console.error('Lab reports POST error:', error)
    return NextResponse.json({ error: 'Failed to order lab test' }, { status: 500 })
  }
}

// GET /api/lab-reports — List lab reports
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined
    const status = searchParams.get('status') || undefined
    const patientName = searchParams.get('patientName') || undefined
    const testName = searchParams.get('testName') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Resolve hospitalId based on role
    let hospitalId: string | undefined
    let doctorId: string | undefined

    if (user.role === 'hospital') {
      const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
      if (hospital) hospitalId = hospital.id
    } else if (user.role === 'lab_technician') {
      const tech = await db.labTechnician.findUnique({ where: { userId: user.id } })
      if (tech) hospitalId = tech.hospitalId
    } else if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
      if (doctor) { hospitalId = doctor.hospitalId; doctorId = doctor.id }
    } else if (user.role === 'receptionist') {
      const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
      if (receptionist) hospitalId = receptionist.hospitalId
    }
    // admin gets all (no hospitalId filter)

    const where: Record<string, unknown> = {
      ...(hospitalId && { hospitalId }),
      ...(doctorId && { doctorId }),
      ...(status && { status }),
      ...(patientName && { patientName: { contains: patientName } }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { ...(fromDate ? {} : { gte: new Date('2000-01-01') }), lte: new Date(toDate + 'T23:59:59') } }),
    }

    // If testName is provided, filter through testMaster relation
    if (testName) {
      const testMasters = await db.labTestMaster.findMany({
        where: { name: { contains: testName } },
        select: { id: true },
      })
      if (testMasters.length > 0) {
        where.testMasterId = { in: testMasters.map((t) => t.id) }
      } else {
        return NextResponse.json({ data: [], page, limit, total: 0, totalPages: 0 })
      }
    }

    const [labReports, total] = await Promise.all([
      db.labReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          testMaster: { select: { name: true, shortCode: true } },
        },
      }),
      db.labReport.count({ where }),
    ])

    return NextResponse.json({
      data: labReports,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Lab reports GET error:', error)
    return NextResponse.json({ error: 'Failed to load lab reports' }, { status: 500 })
  }
}
