import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(
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

    // Verify admission belongs to this doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true },
    })
    if (!admission || (admission.attendingDoctorId !== doctor.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }

    const orders = await db.doctorOrder.findMany({
      where: { admissionId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    })

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        drugName: o.drugName,
        route: o.route,
        dose: o.dose,
        frequency: o.frequency,
        scheduledTime: o.scheduledTime,
        instructions: o.instructions,
        isPrn: o.isPrn,
        isStat: o.isStat,
        status: o.status,
        stoppedBy: o.stoppedBy,
        stoppedAt: o.stoppedAt?.toISOString() || null,
        stoppedReason: o.stoppedReason,
        createdAt: o.createdAt.toISOString(),
        doctorName: o.doctor.user?.name || '',
      })),
    })
  } catch (error) {
    console.error('Doctor orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { drugName, route, dose, frequency, scheduledTime, instructions, isPrn, isStat } = body

    if (!drugName || !route || !dose || !frequency || !scheduledTime) {
      return NextResponse.json(
        { error: 'drugName, route, dose, frequency, scheduledTime are required' },
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
    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not admitted' }, { status: 400 })
    }

    const order = await db.doctorOrder.create({
      data: {
        admissionId,
        doctorId: doctor.id,
        drugName,
        route,
        dose,
        frequency,
        scheduledTime,
        instructions: instructions || '',
        isPrn: isPrn || false,
        isStat: isStat || false,
        status: 'Active',
      },
    })

    return NextResponse.json({ order: { id: order.id } }, { status: 201 })
  } catch (error) {
    console.error('Doctor orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
