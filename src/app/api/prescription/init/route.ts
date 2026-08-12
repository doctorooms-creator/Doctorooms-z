import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Check if booking exists and belongs to this doctor
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        doctorId: true,
        patientName: true,
        age: true,
        gender: true,
        status: true,
      },
    })
    if (!booking || booking.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if draft prescription already exists for this booking
    const existingDraft = await db.prescription.findFirst({
      where: { bookingId, status: 'Draft', doctorId: doctor.id },
      select: { id: true },
    })

    if (existingDraft) {
      return NextResponse.json({ prescription: { id: existingDraft.id }, isNew: false })
    }

    // Create new draft prescription
    const prescription = await db.prescription.create({
      data: {
        bookingId,
        doctorId: doctor.id,
        patientName: booking.patientName || '',
        patientAge: booking.age?.toString() || '',
        status: 'Draft',
        createdById: user.id,
      },
    })

    return NextResponse.json({ prescription: { id: prescription.id }, isNew: true }, { status: 201 })
  } catch (error) {
    console.error('Prescription init error:', error)
    return NextResponse.json({ error: 'Failed to initialize prescription' }, { status: 500 })
  }
}
