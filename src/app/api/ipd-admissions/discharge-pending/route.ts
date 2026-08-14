import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/** Resolve hospitalId from receptionist/hospital role */
async function resolveHospitalId(req: NextRequest): Promise<{ hospitalId: string } | null> {
  let user = await requireRole(req, 'receptionist')
  if (!user) user = await requireRole(req, 'hospital')
  if (!user) return null

  if (user.role === 'hospital') {
    const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
    if (!hospital) return null
    return { hospitalId: hospital.id }
  }

  const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
  if (!receptionist) return null
  return { hospitalId: receptionist.hospitalId }
}

// GET /api/ipd-admissions/discharge-pending — List admissions pending discharge
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(req.url)
    const queryHospitalId = searchParams.get('hospitalId')
    const effectiveHospitalId = queryHospitalId || hospitalId

    const admissions = await db.ipdAdmission.findMany({
      where: {
        hospitalId: effectiveHospitalId,
        OR: [
          { dischargeAdvised: true },
          { status: 'Admitted' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ward: { select: { id: true, name: true } },
        bed: { select: { id: true, bedNumber: true, bedType: true } },
        department: { select: { id: true, name: true } },
        attendingDoctor: { select: { id: true, name: true, speciality: true } },
      },
    })

    return NextResponse.json({
      admissions: admissions.map((a) => ({
        id: a.id,
        admissionNo: a.admissionNo,
        patientName: a.patientName,
        status: a.status,
        admissionDate: a.admissionDate,
        dischargeAdvised: a.dischargeAdvised,
        paymentStatus: a.paymentStatus,
        ward: a.ward,
        bed: a.bed,
        department: a.department,
        attendingDoctor: a.attendingDoctor
          ? {
              id: a.attendingDoctor.id,
              name: a.attendingDoctor.name,
              speciality: a.attendingDoctor.speciality,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('Discharge pending GET error:', error)
    return NextResponse.json({ error: 'Failed to load pending discharges' }, { status: 500 })
  }
}
