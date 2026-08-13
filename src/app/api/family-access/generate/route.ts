import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

const RECEPTION_ROLES = ['receptionist', 'hospital', 'admin']

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)]
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')
    if (!user) {
      // Also allow hospital and admin
      const hospitalUser = await requireRole(request, 'hospital')
      const adminUser = await requireRole(request, 'admin')
      if (!hospitalUser && !adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { admissionId, relationName, relationMobile, canViewVitals, canViewDiet, canViewBill } = body

    if (!admissionId || !relationName || !relationMobile) {
      return NextResponse.json(
        { error: 'admissionId, relationName, and relationMobile are required' },
        { status: 400 }
      )
    }

    // Fetch admission with patient name and hospital info
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: {
        id: true,
        patientName: true,
        hospitalId: true,
        status: true,
      },
    })

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not currently admitted' }, { status: 400 })
    }

    // Check if access already exists for this admission
    const existing = await db.familyAccess.findUnique({
      where: { admissionId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Family access already generated for this admission. Revoke the existing one first.' },
        { status: 409 }
      )
    }

    // Generate unique access code
    let accessCode = generateAccessCode()
    let attempts = 0
    while (await db.familyAccess.findUnique({ where: { accessCode } })) {
      accessCode = generateAccessCode()
      attempts++
      if (attempts > 50) {
        return NextResponse.json({ error: 'Failed to generate unique access code' }, { status: 500 })
      }
    }

    // Create FamilyAccess record
    const familyAccess = await db.familyAccess.create({
      data: {
        admissionId,
        hospitalId: admission.hospitalId,
        accessCode,
        patientName: admission.patientName,
        relationName,
        relationMobile,
        canViewVitals: canViewVitals !== false,
        canViewDiet: canViewDiet !== false,
        canViewBill: canViewBill !== false,
      },
    })

    return NextResponse.json({
      accessCode: familyAccess.accessCode,
      shareableLink: `/family/${familyAccess.accessCode}`,
      id: familyAccess.id,
    })
  } catch (error) {
    console.error('Generate family access error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
