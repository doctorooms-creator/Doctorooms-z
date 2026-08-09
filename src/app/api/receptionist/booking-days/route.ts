import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { bookingDays: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    return NextResponse.json({ bookingDays: doctor.bookingDays })
  } catch (error) {
    console.error('Receptionist booking days get error:', error)
    return NextResponse.json({ error: 'Failed to load booking days' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    const body = await req.json()
    const { bookingDays } = body

    if (typeof bookingDays !== 'number' || !Number.isInteger(bookingDays) || bookingDays < 1 || bookingDays > 365) {
      return NextResponse.json({ error: 'Booking days must be an integer between 1 and 365' }, { status: 400 })
    }

    const updated = await db.doctor.update({
      where: { id: receptionist.doctorId },
      data: { bookingDays },
      select: { bookingDays: true },
    })

    return NextResponse.json({ bookingDays: updated.bookingDays })
  } catch (error) {
    console.error('Receptionist booking days update error:', error)
    return NextResponse.json({ error: 'Failed to update booking days' }, { status: 500 })
  }
}
