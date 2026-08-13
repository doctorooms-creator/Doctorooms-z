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
    const { chiefComplaints, informant, pastHistory, personalHistory, habits, femaleHistory, drugHistory } = body

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
        ...(chiefComplaints !== undefined && { chiefComplaints }),
        ...(informant !== undefined && { informant }),
        ...(pastHistory !== undefined && { pastHistory }),
        ...(personalHistory !== undefined && { personalHistory: typeof personalHistory === 'string' ? personalHistory : JSON.stringify(personalHistory) }),
        ...(habits !== undefined && { habits: typeof habits === 'string' ? habits : JSON.stringify(habits) }),
        ...(femaleHistory !== undefined && { femaleHistory: typeof femaleHistory === 'string' ? femaleHistory : JSON.stringify(femaleHistory) }),
        ...(drugHistory !== undefined && { drugHistory }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Doctor history update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
