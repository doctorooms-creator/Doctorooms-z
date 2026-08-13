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
      visitTime,
      examinationFindings,
      currentDiagnosis,
      newOrders,
      stoppedOrders,
      advise,
      isMobileVisit,
    } = body

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
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
    if (admission.attendingDoctorId !== doctor.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }

    const now = new Date()
    const timeStr =
      visitTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

    const visit = await db.doctorVisit.create({
      data: {
        admissionId,
        doctorId: doctor.id,
        visitDate: now,
        visitTime: timeStr,
        examinationFindings: examinationFindings || '',
        currentDiagnosis: currentDiagnosis || '',
        newOrders: typeof newOrders === 'string' ? newOrders : JSON.stringify(newOrders || []),
        stoppedOrders: typeof stoppedOrders === 'string' ? stoppedOrders : JSON.stringify(stoppedOrders || []),
        advise: advise || '',
        isMobileVisit: isMobileVisit || false,
      },
    })

    return NextResponse.json({ visit: { id: visit.id } }, { status: 201 })
  } catch (error) {
    console.error('IPD doctor visit POST error:', error)
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

    const visits = await db.doctorVisit.findMany({
      where: { admissionId },
      orderBy: { visitDate: 'desc' },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    })

    return NextResponse.json({
      visits: visits.map((v) => ({
        id: v.id,
        admissionId: v.admissionId,
        doctorId: v.doctorId,
        doctorName: v.doctor.user?.name || '',
        visitDate: v.visitDate.toISOString(),
        visitTime: v.visitTime,
        examinationFindings: v.examinationFindings,
        currentDiagnosis: v.currentDiagnosis,
        newOrders: v.newOrders,
        stoppedOrders: v.stoppedOrders,
        advise: v.advise,
        isMobileVisit: v.isMobileVisit,
        createdAt: v.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('IPD doctor visits GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
