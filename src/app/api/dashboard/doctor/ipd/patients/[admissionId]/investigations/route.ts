import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { admissionId } = await params
    const body = await req.json()
    const { testName, sampleType } = body

    if (!testName || !sampleType) {
      return NextResponse.json(
        { error: 'testName and sampleType are required' },
        { status: 400 }
      )
    }

    // Verify admission belongs to this doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true, status: true, wardId: true },
    })
    if (!admission || (admission.attendingDoctorId !== doctor.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }
    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not admitted' }, { status: 400 })
    }

    // Find any nurse assigned to this patient for the nurseId field
    const assignment = await db.nursePatientAssignment.findFirst({
      where: { admissionId, active: true },
      select: { nurseId: true },
    })

    // If no active assignment, find any nurse in the ward
    let nurseId = assignment?.nurseId || ''
    if (!nurseId) {
      const wardNurse = await db.staffNurse.findFirst({
        where: { wardId: admission.wardId, user: { status: 'Active' } },
        select: { id: true },
      })
      nurseId = wardNurse?.id || ''
    }

    const sample = await db.sampleCollection.create({
      data: {
        admissionId,
        nurseId,
        doctorId: doctor.id,
        testName,
        sampleType,
        status: 'Ordered',
      },
    })

    return NextResponse.json({ sample: { id: sample.id } }, { status: 201 })
  } catch (error) {
    console.error('Doctor investigation order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
