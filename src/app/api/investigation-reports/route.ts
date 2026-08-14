import { requireRole, requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      admissionId,
      sampleCollectionId,
      testName,
      resultData,
      normalRange,
      isAbnormal,
      remarks,
    } = body

    if (!admissionId || !testName) {
      return NextResponse.json({ error: 'admissionId and testName are required' }, { status: 400 })
    }

    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true, status: true },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }
    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not currently admitted' }, { status: 400 })
    }

    const report = await db.investigationReport.create({
      data: {
        admissionId,
        sampleCollectionId: sampleCollectionId || null,
        testName,
        resultData: typeof resultData === 'string' ? resultData : JSON.stringify(resultData || {}),
        normalRange: typeof normalRange === 'string' ? normalRange : JSON.stringify(normalRange || {}),
        isAbnormal: isAbnormal || false,
        remarks: remarks || '',
      },
    })

    return NextResponse.json({ report: { id: report.id } }, { status: 201 })
  } catch (error) {
    console.error('Investigation report POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const admissionId = searchParams.get('admissionId')
    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }

    const reports = await db.investigationReport.findMany({
      where: { admissionId },
      orderBy: { reportDate: 'desc' },
    })

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        admissionId: r.admissionId,
        sampleCollectionId: r.sampleCollectionId,
        testName: r.testName,
        reportDate: r.reportDate.toISOString(),
        resultData: r.resultData,
        normalRange: r.normalRange,
        isAbnormal: r.isAbnormal,
        reportedBy: r.reportedBy,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt?.toISOString() || null,
        remarks: r.remarks,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Investigation reports GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
