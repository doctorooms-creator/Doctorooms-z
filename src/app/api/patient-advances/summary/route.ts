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

// GET /api/patient-advances/summary — Advance summary for an admission
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(req.url)
    const admissionId = searchParams.get('admissionId')

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }

    // Verify admission belongs to this hospital
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { hospitalId: true },
    })
    if (!admission || admission.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Aggregate advance data
    const advances = await db.patientAdvance.findMany({
      where: { admissionId },
      orderBy: { createdAt: 'desc' },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0)
    const lastAdvanceDate = advances.length > 0 ? advances[0].createdAt : null
    const lastAdvanceAmount = advances.length > 0 ? advances[0].amount : 0

    return NextResponse.json({
      totalAdvance,
      lastAdvanceDate,
      lastAdvanceAmount,
      advanceCount: advances.length,
    })
  } catch (error) {
    console.error('Patient advances summary error:', error)
    return NextResponse.json({ error: 'Failed to load advance summary' }, { status: 500 })
  }
}
