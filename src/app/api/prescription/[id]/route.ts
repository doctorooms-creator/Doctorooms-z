import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const prescription = await db.prescription.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            patientName: true,
            age: true,
            gender: true,
            bloodGroup: true,
            disease: true,
            timeSlot: true,
            bookingDate: true,
          },
        },
        doctor: {
          select: {
            id: true,
            user: { select: { name: true, email: true, contactNo: true, phoneNo: true } },
            specialization: true,
            address: true,
            city: true,
            state: true,
            registrationDetail: true,
          },
        },
        chiefComplaints: {
          include: {
            co: {
              select: { id: true, coDetail: true, coDetailEn: true, coCode: true },
            },
          },
        },
        labels: true,
        medicines: true,
        suggestions: true,
        diagnosisTables: true,
      },
    })

    if (!prescription || prescription.doctorId !== prescription.doctor.id) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json({ prescription })
  } catch (error) {
    console.error('Get prescription error:', error)
    return NextResponse.json({ error: 'Failed to load prescription' }, { status: 500 })
  }
}
