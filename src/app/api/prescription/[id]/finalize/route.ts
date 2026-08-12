import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { nextVisit } = body

    // Verify prescription ownership
    const prescription = await db.prescription.findUnique({
      where: { id },
      select: { id: true, doctorId: true, bookingId: true },
    })
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: prescription.doctorId, userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update prescription status and next visit
    const updated = await db.prescription.update({
      where: { id },
      data: {
        status: 'Active',
        nextVisit: nextVisit ? new Date(nextVisit) : null,
      },
      include: {
        booking: { select: { id: true } },
        doctor: {
          select: {
            user: { select: { name: true, email: true, contactNo: true, phoneNo: true } },
            specialization: true,
            address: true,
            city: true,
            state: true,
            registrationDetail: true,
          },
        },
        chiefComplaints: { include: { co: { select: { coDetail: true, coDetailEn: true } } } },
        labels: true,
        medicines: true,
        suggestions: true,
        diagnosisTables: true,
      },
    })

    // Update booking status to Visited
    await db.booking.update({
      where: { id: prescription.bookingId },
      data: { status: 'Visited' },
    })

    return NextResponse.json({ prescription: updated })
  } catch (error) {
    console.error('Finalize prescription error:', error)
    return NextResponse.json({ error: 'Failed to finalize prescription' }, { status: 500 })
  }
}
