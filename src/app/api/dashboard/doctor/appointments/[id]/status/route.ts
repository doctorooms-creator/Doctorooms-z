import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['Visited', 'Finish', 'Extend', 'Canceled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const booking = await db.booking.findFirst({
      where: { id, doctorId: doctor.id },
    })
    if (!booking) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await db.booking.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Update appointment status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
