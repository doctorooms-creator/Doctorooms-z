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

/** Auto-generate receipt number */
async function generateReceiptNo(hospitalId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = 'ADV-'
  const lastAdvance = await db.patientAdvance.findFirst({
    where: {
      hospitalId,
      receiptNo: { startsWith: `${prefix}${year}` },
    },
    orderBy: { receiptNo: 'desc' },
  })
  const lastNum = lastAdvance ? parseInt(lastAdvance.receiptNo.split('-').pop() || '0') : 0
  return `${prefix}${year}-${String(lastNum + 1).padStart(6, '0')}`
}

// GET /api/patient-advances — List advances for an admission
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

    const advances = await db.patientAdvance.findMany({
      where: { admissionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        receiptNo: true,
        amount: true,
        paymentMethod: true,
        paymentRef: true,
        notes: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ advances })
  } catch (error) {
    console.error('Patient advances GET error:', error)
    return NextResponse.json({ error: 'Failed to load advances' }, { status: 500 })
  }
}

// POST /api/patient-advances — Record a new advance payment
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId, userId } = auth

    const body = await req.json()
    const { admissionId, amount, paymentMethod, paymentRef, notes } = body

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Verify admission belongs to this hospital
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
    })

    if (!admission || admission.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Generate receipt number
    const receiptNo = await generateReceiptNo(hospitalId)

    // Create advance record
    const advance = await db.patientAdvance.create({
      data: {
        receiptNo,
        admissionId,
        hospitalId,
        patientId: admission.userId,
        amount,
        paymentMethod: paymentMethod || 'Cash',
        paymentRef: paymentRef || '',
        receivedBy: userId,
        notes: notes || '',
      },
    })

    // Update admission advance amount
    await db.ipdAdmission.update({
      where: { id: admissionId },
      data: {
        advanceAmount: { increment: amount },
      },
    })

    // If bill exists, update advanceAdjusted
    const existingBill = await db.ipdBill.findUnique({ where: { admissionId } })
    if (existingBill) {
      const newAdvanceAdjusted = (existingBill.advanceAdjusted || 0) + amount
      const newNetPayable = existingBill.totalAmount - (existingBill.discountAmount || 0) - newAdvanceAdjusted
      await db.ipdBill.update({
        where: { admissionId },
        data: {
          advanceAdjusted: newAdvanceAdjusted,
          netPayable: Math.max(0, newNetPayable),
        },
      })
    }

    return NextResponse.json({ advance }, { status: 201 })
  } catch (error) {
    console.error('Patient advances POST error:', error)
    return NextResponse.json({ error: 'Failed to record advance' }, { status: 500 })
  }
}
