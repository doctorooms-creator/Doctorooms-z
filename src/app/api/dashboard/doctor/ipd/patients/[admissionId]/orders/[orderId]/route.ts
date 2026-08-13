import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string; orderId: string }> }
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

    const { admissionId, orderId } = await params
    const body = await req.json()

    // Verify admission belongs to this doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true },
    })
    if (!admission || (admission.attendingDoctorId !== doctor.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }

    const order = await db.doctorOrder.findUnique({
      where: { id: orderId },
    })
    if (!order || order.admissionId !== admissionId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (body.action === 'stop') {
      if (order.status !== 'Active') {
        return NextResponse.json({ error: 'Only active orders can be stopped' }, { status: 400 })
      }
      await db.doctorOrder.update({
        where: { id: orderId },
        data: {
          status: 'Stopped',
          stoppedBy: user.id,
          stoppedAt: new Date(),
          stoppedReason: body.reason || '',
        },
      })
      return NextResponse.json({ success: true })
    }

    // Regular update of order details
    const { drugName, route, dose, frequency, scheduledTime, instructions, isPrn, isStat } = body
    await db.doctorOrder.update({
      where: { id: orderId },
      data: {
        ...(drugName !== undefined && { drugName }),
        ...(route !== undefined && { route }),
        ...(dose !== undefined && { dose }),
        ...(frequency !== undefined && { frequency }),
        ...(scheduledTime !== undefined && { scheduledTime }),
        ...(instructions !== undefined && { instructions }),
        ...(isPrn !== undefined && { isPrn }),
        ...(isStat !== undefined && { isStat }),
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Doctor order update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string; orderId: string }> }
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

    const { admissionId, orderId } = await params

    // Verify admission belongs to this doctor
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { attendingDoctorId: true },
    })
    if (!admission || (admission.attendingDoctorId !== doctor.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Not your patient' }, { status: 403 })
    }

    const order = await db.doctorOrder.findUnique({ where: { id: orderId } })
    if (!order || order.admissionId !== admissionId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'Active') {
      return NextResponse.json({ error: 'Only active orders can be stopped' }, { status: 400 })
    }

    await db.doctorOrder.update({
      where: { id: orderId },
      data: {
        status: 'Stopped',
        stoppedBy: user.id,
        stoppedAt: new Date(),
        stoppedReason: 'Deleted by doctor',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Doctor order delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
