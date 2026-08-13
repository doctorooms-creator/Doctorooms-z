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
    const { visitTime, examinationFindings, currentDiagnosis, newOrders, advise, isMobileVisit } = body

    if (!examinationFindings && !currentDiagnosis && !advise) {
      return NextResponse.json(
        { error: 'At least one of examinationFindings, currentDiagnosis, or advise is required' },
        { status: 400 }
      )
    }

    // Verify admission belongs to this doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true, status: true },
    })
    if (!admission || (admission.attendingDoctorId !== doctor.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }

    const now = new Date()
    const timeStr = visitTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

    const visit = await db.doctorVisit.create({
      data: {
        admissionId,
        doctorId: doctor.id,
        visitDate: now,
        visitTime: timeStr,
        examinationFindings: examinationFindings || '',
        currentDiagnosis: currentDiagnosis || '',
        newOrders: typeof newOrders === 'string' ? newOrders : JSON.stringify(newOrders || []),
        stoppedOrders: '[]',
        advise: advise || '',
        isMobileVisit: isMobileVisit || false,
      },
    })

    return NextResponse.json({ visit: { id: visit.id } }, { status: 201 })
  } catch (error) {
    console.error('Doctor visit POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
