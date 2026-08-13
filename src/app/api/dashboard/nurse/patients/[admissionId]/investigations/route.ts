import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { SAMPLE_STATUS_FLOW } from '@/lib/ipd-utils'

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

    // Verify admission exists
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { id: true, attendingDoctorId: true },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Get all sample collections for this admission
    const samples = await db.sampleCollection.findMany({
      where: { admissionId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        nurse: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    // Get investigation orders of type 'investigation' for this admission
    const investigationOrders = await db.doctorOrder.findMany({
      where: { admissionId, status: 'Active' },
      select: { id: true, drugName: true, instructions: true, createdAt: true },
    })

    // Get all investigation reports for this admission
    const reports = await db.investigationReport.findMany({
      where: { admissionId },
      orderBy: { reportDate: 'desc' },
    })

    // Build a map of sampleId -> report for quick lookup
    const reportMap = new Map<string, typeof reports[0]>()
    for (const r of reports) {
      if (r.sampleCollectionId) {
        reportMap.set(r.sampleCollectionId, r)
      }
    }

    return NextResponse.json({
      samples: samples.map((s) => ({
        id: s.id,
        testName: s.testName,
        sampleType: s.sampleType,
        status: s.status,
        statusFlow: SAMPLE_STATUS_FLOW as unknown as string[],
        collectedAt: s.collectedAt?.toISOString() || null,
        sentToLabAt: s.sentToLabAt?.toISOString() || null,
        remarks: s.remarks,
        createdAt: s.createdAt.toISOString(),
        doctorName: s.doctor?.user?.name || '',
        nurseName: s.nurse?.user?.name || '',
        report: reportMap.get(s.id)
          ? {
              id: reportMap.get(s.id)!.id,
              testName: reportMap.get(s.id)!.testName,
              reportDate: reportMap.get(s.id)!.reportDate.toISOString(),
              resultData: reportMap.get(s.id)!.resultData,
              normalRange: reportMap.get(s.id)!.normalRange,
              isAbnormal: reportMap.get(s.id)!.isAbnormal,
              remarks: reportMap.get(s.id)!.remarks,
            }
          : null,
      })),
      reports: reports.map((r) => ({
        id: r.id,
        sampleCollectionId: r.sampleCollectionId,
        testName: r.testName,
        reportDate: r.reportDate.toISOString(),
        resultData: r.resultData,
        normalRange: r.normalRange,
        isAbnormal: r.isAbnormal,
        remarks: r.remarks,
      })),
    })
  } catch (error) {
    console.error('Get investigations error:', error)
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
    const { testName, sampleType, remarks } = body

    if (!testName || !sampleType) {
      return NextResponse.json({ error: 'testName and sampleType are required' }, { status: 400 })
    }

    // Get the admission to find the attending doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { id: true, attendingDoctorId: true },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    const now = new Date()
    const sample = await db.sampleCollection.create({
      data: {
        admissionId,
        nurseId: nurse.id,
        doctorId: admission.attendingDoctorId,
        testName,
        sampleType,
        collectedAt: now,
        status: 'Collected',
        remarks: remarks || '',
      },
    })

    return NextResponse.json({
      sample: {
        id: sample.id,
        testName: sample.testName,
        sampleType: sample.sampleType,
        status: sample.status,
        collectedAt: sample.collectedAt?.toISOString() || null,
        sentToLabAt: sample.sentToLabAt?.toISOString() || null,
        remarks: sample.remarks,
        createdAt: sample.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Create sample collection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
