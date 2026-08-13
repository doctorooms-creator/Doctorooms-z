import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PUT(
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
    const { consciousnessLevel, obeyingCommands, respondingToDPS, oriented, speech, examinationNotes, generalSigns } = body

    // Verify admission belongs to this doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true },
    })
    if (!admission || (admission.attendingDoctorId !== doctor.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }

    await db.ipdAdmission.update({
      where: { id: admissionId },
      data: {
        ...(consciousnessLevel !== undefined && { consciousnessLevel }),
        ...(obeyingCommands !== undefined && { obeyingCommands }),
        ...(respondingToDPS !== undefined && { respondingToDPS }),
        ...(oriented !== undefined && { oriented }),
        ...(speech !== undefined && { speech }),
        ...(examinationNotes !== undefined && { examinationNotes }),
        ...(generalSigns !== undefined && { generalSigns: typeof generalSigns === 'string' ? generalSigns : JSON.stringify(generalSigns) }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Doctor examination update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
