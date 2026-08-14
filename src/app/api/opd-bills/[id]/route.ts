import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/** Resolve hospitalId from hospital/admin/receptionist role */
async function resolveHospitalId(req: NextRequest): Promise<{ hospitalId: string; userId: string } | null> {
  let user = await requireRole(req, 'hospital')
  if (!user) user = await requireRole(req, 'admin')
  if (!user) user = await requireRole(req, 'receptionist')
  if (!user) return null

  if (user.role === 'hospital' || user.role === 'admin') {
    const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
    if (!hospital) return null
    return { hospitalId: hospital.id, userId: user.id }
  }

  const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
  if (!receptionist) return null
  return { hospitalId: receptionist.hospitalId, userId: user.id }
}

// GET /api/opd-bills/[id] — OPD bill detail with booking, patient, doctor, hospital info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const bill = await db.opdBill.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            appointmentNo: true,
            patientName: true,
            disease: true,
            bookingDate: true,
            timeSlot: true,
            status: true,
            doctor: {
              select: {
                name: true,
                qualification: true,
                specialization: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                mobileNo: true,
                email: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            contactNo: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            mobileNo: true,
            email: true,
          },
        },
      },
    })

    if (!bill || bill.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json({ bill })
  } catch (error) {
    console.error('OPD bill GET by ID error:', error)
    return NextResponse.json({ error: 'Failed to load bill' }, { status: 500 })
  }
}
