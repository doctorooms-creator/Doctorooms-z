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

// POST /api/ipd-admissions/[id]/discharge — Initiate patient discharge
export async function POST(
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

    const body = await req.json()
    const { dischargeType, dischargeTime } = body

    if (!dischargeType || !['Normal', 'DAMA', 'LAMA'].includes(dischargeType)) {
      return NextResponse.json({ error: 'Valid discharge type is required (Normal/DAMA/LAMA)' }, { status: 400 })
    }

    // Fetch admission
    const admission = await db.ipdAdmission.findUnique({
      where: { id },
      include: {
        bed: true,
        bill: {
          include: { lineItems: true },
        },
      },
    })

    if (!admission || admission.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not currently admitted' }, { status: 400 })
    }

    // Generate bill if not exists
    let bill = admission.bill
    if (!bill) {
      const now = new Date()
      const admissionDate = new Date(admission.admissionDate)
      const diffMs = now.getTime() - admissionDate.getTime()
      const daysAdmitted = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      const roomRentAmount = (admission.bed?.dailyRate || 0) * daysAdmitted

      const year = new Date().getFullYear()
      const prefix = 'IPD-BILL-'
      const lastBill = await db.ipdBill.findFirst({
        where: {
          hospitalId,
          billNo: { startsWith: `${prefix}${year}` },
        },
        orderBy: { billNo: 'desc' },
      })
      const lastNum = lastBill ? parseInt(lastBill.billNo.split('-').pop() || '0') : 0
      const billNo = `${prefix}${year}-${String(lastNum + 1).padStart(6, '0')}`

      bill = await db.ipdBill.create({
        data: {
          billNo,
          admissionId: id,
          hospitalId,
          roomRentAmount,
          subtotal: roomRentAmount,
          totalAmount: roomRentAmount,
          advanceAdjusted: admission.advanceAmount || 0,
          netPayable: roomRentAmount - (admission.advanceAmount || 0),
          status: 'Draft',
          generatedAt: now,
          generatedBy: auth.userId,
        },
      })

      // Update admission with room rent days
      await db.ipdAdmission.update({
        where: { id },
        data: { roomRentDays: daysAdmitted },
      })
    }

    // Finalize if Draft
    if (bill.status === 'Draft') {
      const lineItemSubtotal = (bill.lineItems || []).reduce((sum, li) => sum + li.amount, 0)
      const lineItemTax = (bill.lineItems || []).reduce((sum, li) => sum + li.taxAmount, 0)
      const subtotal = (bill.roomRentAmount || 0) + lineItemSubtotal
      const taxAmount = lineItemTax
      const totalAmount = subtotal + taxAmount
      const advanceAdjusted = bill.advanceAdjusted
      const netPayable = totalAmount - (bill.discountAmount || 0) - advanceAdjusted

      await db.ipdBill.update({
        where: { id: bill.id },
        data: {
          status: 'Final',
          finalizedAt: new Date(),
          subtotal,
          taxAmount,
          totalAmount,
          netPayable,
        },
      })

      // Update admission payment status
      const paymentStatus = netPayable <= 0 ? 'Paid' : 'Pending'
      await db.ipdAdmission.update({
        where: { id },
        data: {
          totalBillAmount: totalAmount,
          paymentStatus,
        },
      })
    }

    // Set admission status
    const statusMap: Record<string, string> = {
      Normal: 'Discharged',
      DAMA: 'DAMA',
      LAMA: 'LAMA',
    }
    const newStatus = statusMap[dischargeType] || 'Discharged'

    // Calculate room rent days if not set
    const now = new Date()
    const admissionDate = new Date(admission.admissionDate)
    const diffMs = now.getTime() - admissionDate.getTime()
    const daysAdmitted = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    // Transaction: discharge patient, free bed, complete nurse assignments
    await db.$transaction(async (tx) => {
      // Update admission status
      await tx.ipdAdmission.update({
        where: { id },
        data: {
          status: newStatus,
          dischargeDate: now,
          dischargeTime: dischargeTime || now.toTimeString().slice(0, 5),
          dischargeType,
          roomRentDays: admission.roomRentDays || daysAdmitted,
        },
      })

      // Free the bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'Available' },
      })

      // Complete all active nurse assignments
      await tx.nursePatientAssignment.updateMany({
        where: {
          admissionId: id,
          status: 'Active',
        },
        data: {
          status: 'Completed',
          unassignedAt: now,
        },
      })
    })

    return NextResponse.json({
      message: 'Patient discharged successfully',
      billNo: bill.billNo,
      status: newStatus,
    })
  } catch (error) {
    console.error('Discharge POST error:', error)
    return NextResponse.json({ error: 'Failed to discharge patient' }, { status: 500 })
  }
}
