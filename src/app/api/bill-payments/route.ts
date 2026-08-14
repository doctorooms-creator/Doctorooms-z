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

/** Auto-generate receipt number for bill payments */
async function generateReceiptNo(hospitalId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = 'REC-'
  const lastPayment = await db.billPayment.findFirst({
    where: {
      hospitalId,
      receiptNo: { startsWith: `${prefix}${year}` },
    },
    orderBy: { receiptNo: 'desc' },
  })
  const lastNum = lastPayment ? parseInt(lastPayment.receiptNo.split('-').pop() || '0') : 0
  return `${prefix}${year}-${String(lastNum + 1).padStart(6, '0')}`
}

// GET /api/bill-payments — List all bill payments with filters
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(req.url)
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined
    const paymentMethod = searchParams.get('paymentMethod') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { hospitalId }

    if (fromDate || toDate) {
      const dateFilter: Record<string, unknown> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      where.paymentDate = dateFilter
    }

    if (paymentMethod) where.paymentMethod = paymentMethod

    const [payments, total] = await Promise.all([
      db.billPayment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bill: {
            select: {
              billNo: true,
              admission: {
                select: {
                  patientName: true,
                  admissionNo: true,
                },
              },
            },
          },
        },
      }),
      db.billPayment.count({ where }),
    ])

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        receiptNo: p.receiptNo,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paymentRef: p.paymentRef,
        paymentDate: p.paymentDate,
        billNo: p.bill.billNo,
        patientName: p.bill.admission.patientName,
        admissionNo: p.bill.admission.admissionNo,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Bill payments GET error:', error)
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 })
  }
}

// POST /api/bill-payments — Record a payment against a bill
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId, userId } = auth

    const body = await req.json()
    const { billId, amount, paymentMethod, paymentRef, notes } = body

    if (!billId) {
      return NextResponse.json({ error: 'billId is required' }, { status: 400 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Fetch bill
    const bill = await db.ipdBill.findUnique({ where: { id: billId } })
    if (!bill || bill.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // Generate receipt number
    const receiptNo = await generateReceiptNo(hospitalId)

    // Create payment
    const payment = await db.billPayment.create({
      data: {
        receiptNo,
        billId,
        admissionId: bill.admissionId,
        hospitalId,
        amount,
        paymentMethod: paymentMethod || 'Cash',
        paymentRef: paymentRef || '',
        receivedBy: userId,
        notes: notes || '',
      },
    })

    // Calculate total paid for this bill
    const allPayments = await db.billPayment.findMany({
      where: { billId },
      select: { amount: true },
    })
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

    // Update bill status
    let newStatus = bill.status
    if (totalPaid >= bill.netPayable + (bill.discountAmount || 0)) {
      newStatus = 'Paid'
    } else if (totalPaid > 0) {
      newStatus = 'PartiallyPaid'
    }

    await db.ipdBill.update({
      where: { id: billId },
      data: { status: newStatus },
    })

    // Update admission payment status
    if (newStatus === 'Paid') {
      await db.ipdAdmission.update({
        where: { id: bill.admissionId },
        data: { paymentStatus: 'Paid' },
      })
    }

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Bill payments POST error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
