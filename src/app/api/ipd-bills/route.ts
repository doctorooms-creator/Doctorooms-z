import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireAuth } from '@/lib/api-auth'

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

  // receptionist — find via Receptionist table
  const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
  if (!receptionist) return null
  return { hospitalId: receptionist.hospitalId, userId: user.id }
}

/** Auto-generate bill number */
async function generateBillNo(hospitalId: string): Promise<string> {
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
  return `${prefix}${year}-${String(lastNum + 1).padStart(6, '0')}`
}

// GET /api/ipd-bills — List IPD bills with pagination & filters
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { hospitalId }

    if (status) where.status = status

    if (fromDate || toDate) {
      const dateFilter: Record<string, unknown> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      where.generatedAt = dateFilter
    }

    if (search) {
      where.admission = {
        patientName: { contains: search },
      }
    }

    const [bills, total] = await Promise.all([
      db.ipdBill.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          billNo: true,
          totalAmount: true,
          netPayable: true,
          status: true,
          generatedAt: true,
          finalizedAt: true,
          admission: {
            select: {
              patientName: true,
              admissionNo: true,
            },
          },
        },
      }),
      db.ipdBill.count({ where }),
    ])

    return NextResponse.json({
      bills: bills.map((b) => ({
        id: b.id,
        billNo: b.billNo,
        patientName: b.admission.patientName,
        admissionNo: b.admission.admissionNo,
        totalAmount: b.totalAmount,
        netPayable: b.netPayable,
        status: b.status,
        generatedAt: b.generatedAt,
        finalizedAt: b.finalizedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('IPD bills GET error:', error)
    return NextResponse.json({ error: 'Failed to load IPD bills' }, { status: 500 })
  }
}

// POST /api/ipd-bills — Generate draft IPD bill for an admission
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId, userId } = auth

    const body = await req.json()
    const { admissionId } = body

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }

    // Check if bill already exists for this admission
    const existingBill = await db.ipdBill.findUnique({ where: { admissionId } })
    if (existingBill) {
      return NextResponse.json({ error: 'Bill already exists for this admission', bill: existingBill }, { status: 409 })
    }

    // Fetch admission with bed/ward/doctor info
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: {
        bed: { select: { dailyRate: true, bedNumber: true } },
        ward: { select: { name: true } },
        attendingDoctor: { select: { id: true, name: true } },
      },
    })

    if (!admission || admission.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Calculate room rent
    const now = new Date()
    const admissionDate = new Date(admission.admissionDate)
    const diffMs = now.getTime() - admissionDate.getTime()
    const daysAdmitted = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    const roomRentAmount = (admission.bed.dailyRate || 0) * daysAdmitted

    // Generate bill number
    const billNo = await generateBillNo(hospitalId)

    // Create draft bill
    const bill = await db.ipdBill.create({
      data: {
        billNo,
        admissionId,
        hospitalId,
        roomRentAmount,
        serviceAmount: 0,
        labAmount: 0,
        medicineAmount: 0,
        otAmount: 0,
        otherAmount: 0,
        subtotal: roomRentAmount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: roomRentAmount,
        advanceAdjusted: admission.advanceAmount || 0,
        netPayable: roomRentAmount - (admission.advanceAmount || 0),
        status: 'Draft',
        generatedAt: now,
        generatedBy: userId,
      },
      include: {
        admission: {
          select: {
            patientName: true,
            admissionNo: true,
          },
        },
      },
    })

    // Update admission with room rent days
    await db.ipdAdmission.update({
      where: { id: admissionId },
      data: { roomRentDays: daysAdmitted },
    })

    return NextResponse.json({ bill }, { status: 201 })
  } catch (error) {
    console.error('IPD bills POST error:', error)
    return NextResponse.json({ error: 'Failed to generate IPD bill' }, { status: 500 })
  }
}
