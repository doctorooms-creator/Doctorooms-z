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

// POST /api/ipd-bills/[id]/finalize — Finalize an IPD bill
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

    // Fetch bill with line items
    const bill = await db.ipdBill.findUnique({
      where: { id },
      include: { lineItems: true },
    })

    if (!bill || bill.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    if (bill.status !== 'Draft') {
      return NextResponse.json({ error: 'Only draft bills can be finalized' }, { status: 400 })
    }

    // Recalculate totals from line items
    const lineItemSubtotal = bill.lineItems.reduce((sum, li) => sum + li.amount, 0)
    const lineItemTax = bill.lineItems.reduce((sum, li) => sum + li.taxAmount, 0)
    const subtotal = (bill.roomRentAmount || 0) + lineItemSubtotal
    const taxAmount = lineItemTax
    const totalAmount = subtotal + taxAmount
    const advanceAdjusted = bill.advanceAdjusted
    const netPayable = totalAmount - (bill.discountAmount || 0) - advanceAdjusted

    // Finalize bill
    const finalizedBill = await db.ipdBill.update({
      where: { id },
      data: {
        status: 'Final',
        finalizedAt: new Date(),
        subtotal,
        taxAmount,
        totalAmount,
        netPayable,
      },
      include: {
        admission: {
          select: {
            patientName: true,
            admissionNo: true,
          },
        },
        lineItems: {
          include: {
            chargeItem: {
              select: { name: true, category: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Update admission payment status based on net payable
    const paymentStatus = netPayable <= 0 ? 'Paid' : 'Pending'
    await db.ipdAdmission.update({
      where: { id: bill.admissionId },
      data: {
        totalBillAmount: totalAmount,
        paymentStatus,
      },
    })

    return NextResponse.json({ bill: finalizedBill })
  } catch (error) {
    console.error('IPD bill finalize error:', error)
    return NextResponse.json({ error: 'Failed to finalize bill' }, { status: 500 })
  }
}
