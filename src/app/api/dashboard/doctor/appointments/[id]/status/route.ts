import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['Pending', 'Approve', 'Visited', 'Canceled', 'Finish', 'Extend']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
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
