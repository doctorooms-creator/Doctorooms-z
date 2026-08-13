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
    const { admissionId, testName, sampleType, remarks } = body

    if (!admissionId || !testName || !sampleType) {
      return NextResponse.json(
        { error: 'admissionId, testName, and sampleType are required' },
        { status: 400 }
      )
    }

    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { hospitalId: true, wardId: true, status: true },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }
    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not currently admitted' }, { status: 400 })
    }

    // Find any nurse assigned to this admission/ward
    const nurseAssignment = await db.nursePatientAssignment.findFirst({
      where: { admissionId, status: 'Active' },
      select: { nurseId: true },
      orderBy: { assignedAt: 'desc' },
    })

    if (!nurseAssignment) {
      // Fallback: find any nurse in the ward
      const wardNurse = await db.staffNurse.findFirst({
        where: { hospitalId: admission.hospitalId, wardId: admission.wardId },
        select: { id: true },
      })
      if (!wardNurse) {
        return NextResponse.json(
          { error: 'No nurse available for this ward' },
          { status: 400 }
        )
      }
      let nurseId = wardNurse.id
    } else {
      let nurseId = nurseAssignment.nurseId
    }

    const collection = await db.sampleCollection.create({
      data: {
        admissionId,
        nurseId,
        doctorId: doctor.id,
        testName,
        sampleType,
        status: 'Ordered',
        remarks: remarks || '',
      },
    })

    return NextResponse.json({ sample: { id: collection.id } }, { status: 201 })
  } catch (error) {
    console.error('Sample collection POST error:', error)
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
    const status = searchParams.get('status')

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { admissionId }
    if (status) where.status = status

    const samples = await db.sampleCollection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        nurse: { include: { user: { select: { name: true } } } },
      },
    })

    return NextResponse.json({
      samples: samples.map((s) => ({
        id: s.id,
        admissionId: s.admissionId,
        doctorId: s.doctorId,
        doctorName: s.doctor.user?.name || '',
        nurseId: s.nurseId,
        nurseName: s.nurse.user?.name || '',
        testName: s.testName,
        sampleType: s.sampleType,
        collectedAt: s.collectedAt?.toISOString() || null,
        sentToLabAt: s.sentToLabAt?.toISOString() || null,
        status: s.status,
        remarks: s.remarks,
        createdAt: s.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Sample collections GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
