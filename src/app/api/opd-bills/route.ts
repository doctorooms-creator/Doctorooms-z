import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { emitNotification, roleRoom } from '@/lib/emit-notification'
import { validateBody, createOpdBillSchema } from '@/lib/validations'

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

/** Auto-generate OPD bill receipt number */
async function generateReceiptNo(hospitalId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = 'OPD-BILL-'
  const lastBill = await db.opdBill.findFirst({
    where: {
      hospitalId,
      receiptNo: { startsWith: `${prefix}${year}` },
    },
    orderBy: { receiptNo: 'desc' },
  })
  const lastNum = lastBill ? parseInt(lastBill.receiptNo.split('-').pop() || '0') : 0
  return `${prefix}${year}-${String(lastNum + 1).padStart(6, '0')}`
}

// GET /api/opd-bills — List OPD bills with filters
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
    const doctorId = searchParams.get('doctorId') || undefined
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

    if (doctorId) {
      where.booking = { doctorId }
    }

    const [bills, total] = await Promise.all([
      db.opdBill.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              patientName: true,
              doctor: {
                select: { name: true },
              },
            },
          },
        },
      }),
      db.opdBill.count({ where }),
    ])

    return NextResponse.json({
      bills: bills.map((b) => ({
        id: b.id,
        receiptNo: b.receiptNo,
        patientName: b.booking.patientName,
        doctorName: b.booking.doctor?.name || '',
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod,
        paymentDate: b.paymentDate,
        status: b.status,
        createdAt: b.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('OPD bills GET error:', error)
    return NextResponse.json({ error: 'Failed to load OPD bills' }, { status: 500 })
  }
}

// POST /api/opd-bills — Create OPD bill
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId, userId } = auth

    const body = await req.json()
    const v = validateBody(createOpdBillSchema, body)
    if (!v.success) return v.error
    const { bookingId, consultationFee, labCharges, medicineCharges, otherCharges, discount, tax, paymentMethod, paymentRef, notes } = v.data

    // Validate booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: { select: { name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Booking must be visited
    if (booking.status !== 'Visited') {
      return NextResponse.json({ error: 'Booking must have status Visited to create a bill' }, { status: 400 })
    }

    // Check hospital match (booking.hospitalId or via doctor)
    const bookingHospitalId = booking.hospitalId
    if (bookingHospitalId && bookingHospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Booking does not belong to your hospital' }, { status: 403 })
    }

    // Check for existing OPD bill on this booking
    const existingBill = await db.opdBill.findUnique({ where: { bookingId } })
    if (existingBill) {
      return NextResponse.json({ error: 'OPD bill already exists for this booking', bill: existingBill }, { status: 409 })
    }

    // Generate receipt number
    const receiptNo = await generateReceiptNo(bookingHospitalId || hospitalId)

    // Calculate totals
    const subtotal = consultationFee + labCharges + medicineCharges + otherCharges
    const taxAmount = tax
    const totalAmount = subtotal + taxAmount - discount

    // Create OPD bill
    const opdBill = await db.opdBill.create({
      data: {
        receiptNo,
        bookingId,
        hospitalId: bookingHospitalId || hospitalId,
        patientId: booking.userId,
        consultationFee,
        labAmount: labCharges,
        medicineAmount: medicineCharges,
        otherAmount: otherCharges,
        discountAmount: discount,
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod: paymentMethod || 'Cash',
        paymentRef: paymentRef || '',
        receivedBy: userId,
        status: 'Paid',
      },
      include: {
        booking: {
          select: {
            patientName: true,
            doctor: { select: { name: true } },
          },
        },
      },
    })

    emitNotification('bill-generated', [roleRoom('receptionist'), roleRoom('hospital')], {
      id: opdBill.id,
      title: 'OPD Bill Created',
      message: `OPD bill for ${opdBill.booking.patientName}`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ bill: opdBill }, { status: 201 })
  } catch (error) {
    console.error('OPD bills POST error:', error)
    return NextResponse.json({ error: 'Failed to create OPD bill' }, { status: 500 })
  }
}
