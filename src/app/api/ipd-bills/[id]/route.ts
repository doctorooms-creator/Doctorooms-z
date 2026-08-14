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

// GET /api/ipd-bills/[id] — Bill detail with line items, payments, admission info
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

    const bill = await db.ipdBill.findUnique({
      where: { id },
      include: {
        admission: {
          select: {
            patientName: true,
            admissionNo: true,
            ward: { select: { name: true } },
            bed: { select: { bedNumber: true } },
            attendingDoctor: { select: { name: true } },
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
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        advances: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!bill || bill.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json({
      bill: {
        ...bill,
        admission: {
          ...bill.admission,
          wardName: bill.admission.ward?.name || '',
          bedNumber: bill.admission.bed?.bedNumber || '',
          doctorName: bill.admission.attendingDoctor?.name || '',
        },
      },
    })
  } catch (error) {
    console.error('IPD bill GET by ID error:', error)
    return NextResponse.json({ error: 'Failed to load bill' }, { status: 500 })
  }
}

// PUT /api/ipd-bills/[id] — Update draft bill (add/remove items, update discount)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId, userId } = auth
    const { id } = await params

    // Fetch existing bill
    const bill = await db.ipdBill.findUnique({
      where: { id },
      include: { lineItems: true },
    })

    if (!bill || bill.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    if (bill.status !== 'Draft') {
      return NextResponse.json({ error: 'Only draft bills can be updated' }, { status: 400 })
    }

    const body = await req.json()
    const { addItems, removeItemIds, discountAmount } = body

    // Remove line items if specified
    if (removeItemIds && Array.isArray(removeItemIds) && removeItemIds.length > 0) {
      await db.billLineItem.deleteMany({
        where: { id: { in: removeItemIds }, billId: id },
      })
    }

    // Add new line items if specified
    if (addItems && Array.isArray(addItems) && addItems.length > 0) {
      for (const item of addItems) {
        const amount = (item.rate || 0) * (item.quantity || 1)
        const taxPercent = item.isTaxable ? (item.taxPercent || 0) : 0
        const taxAmount = amount * (taxPercent / 100)

        await db.billLineItem.create({
          data: {
            billId: id,
            chargeItemId: item.chargeItemId || null,
            categoryId: item.categoryId || '',
            itemName: item.itemName || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitType: item.unitType || 'Per Service',
            rate: item.rate || 0,
            amount,
            taxPercent,
            taxAmount,
            totalAmount: amount + taxAmount,
          },
        })
      }
    }

    // Re-fetch all line items after modifications
    const allLineItems = await db.billLineItem.findMany({
      where: { billId: id },
    })

    // Recalculate totals from line items
    let serviceAmount = 0
    let labAmount = 0
    let medicineAmount = 0
    let otAmount = 0
    let otherAmount = 0
    let subtotal = bill.roomRentAmount || 0
    let taxAmount = 0

    // Sum line item amounts by category
    for (const li of allLineItems) {
      subtotal += li.amount
      taxAmount += li.taxAmount

      // Categorize based on charge item category
      if (li.chargeItemId) {
        // We could look up category, but for now use categoryId matching
      }
      // Simple categorization: add to subtotal, tax separately
    }

    // If no line items were used for categorization, keep existing category amounts
    serviceAmount = bill.serviceAmount
    labAmount = bill.labAmount
    medicineAmount = bill.medicineAmount
    otAmount = bill.otAmount
    otherAmount = bill.otherAmount

    // If we have line items, recalculate category amounts from them
    if (allLineItems.length > 0) {
      serviceAmount = 0
      labAmount = 0
      medicineAmount = 0
      otAmount = 0
      otherAmount = 0

      for (const li of allLineItems) {
        // Try to determine category from the chargeItem's category name
        if (li.chargeItemId) {
          // Categories will be resolved from the charge item relation
          // For now, accumulate into subtotal and let the frontend map
        }
      }

      // Sum all line item amounts into subtotal (on top of room rent)
      subtotal = (bill.roomRentAmount || 0)
      for (const li of allLineItems) {
        subtotal += li.amount
        taxAmount += li.taxAmount
      }
    }

    const totalAmount = subtotal + taxAmount
    const newDiscount = typeof discountAmount === 'number' ? discountAmount : bill.discountAmount
    const advanceAdjusted = bill.advanceAdjusted
    const netPayable = totalAmount - newDiscount - advanceAdjusted

    // Update bill
    const updatedBill = await db.ipdBill.update({
      where: { id },
      data: {
        serviceAmount,
        labAmount,
        medicineAmount,
        otAmount,
        otherAmount,
        subtotal,
        taxAmount,
        discountAmount: newDiscount,
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

    return NextResponse.json({ bill: updatedBill })
  } catch (error) {
    console.error('IPD bill PUT error:', error)
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
  }
}
