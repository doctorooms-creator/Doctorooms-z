import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/api-auth'

const VALID_TYPES = ['ipd-bill', 'opd-bill', 'advance', 'payment']

const HOSPITAL_SELECT = {
  id: true,
  hospitalName: true,
  contactNo: true,
  email: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
} as const

// GET /api/billing/receipt/[type]/[id] — Get receipt data by type and id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { type, id } = await params

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid receipt type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    let data: Record<string, unknown> = {}
    let hospital: Record<string, unknown> | null = null

    if (type === 'ipd-bill') {
      const bill = await db.ipdBill.findUnique({
        where: { id },
        include: {
          lineItems: {
            include: {
              chargeItem: {
                select: { name: true, category: { select: { name: true } } },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          admission: {
            select: {
              id: true,
              patientName: true,
              patientAge: true,
              patientGender: true,
              admissionNo: true,
              mobileNo: true,
              department: { select: { name: true } },
              ward: { select: { name: true } },
              bed: { select: { bedNumber: true } },
              attendingDoctor: { select: { name: true, speciality: true } },
            },
          },
          hospital: { select: HOSPITAL_SELECT },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          advances: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!bill) {
        return NextResponse.json({ error: 'IPD bill not found' }, { status: 404 })
      }

      data = bill as unknown as Record<string, unknown>
      hospital = bill.hospital as unknown as Record<string, unknown>
    } else if (type === 'opd-bill') {
      const bill = await db.opdBill.findUnique({
        where: { id },
        include: {
          booking: {
            select: {
              id: true,
              patientName: true,
              doctor: { select: { name: true, speciality: true } },
              appointmentDate: true,
              slotTime: true,
            },
          },
          hospital: { select: HOSPITAL_SELECT },
        },
      })

      if (!bill) {
        return NextResponse.json({ error: 'OPD bill not found' }, { status: 404 })
      }

      data = bill as unknown as Record<string, unknown>
      hospital = bill.hospital as unknown as Record<string, unknown>
    } else if (type === 'advance') {
      const advance = await db.patientAdvance.findUnique({
        where: { id },
        include: {
          admission: {
            select: {
              id: true,
              patientName: true,
              admissionNo: true,
              department: { select: { name: true } },
              ward: { select: { name: true } },
              bed: { select: { bedNumber: true } },
              hospital: { select: HOSPITAL_SELECT },
            },
          },
        },
      })

      if (!advance) {
        return NextResponse.json({ error: 'Advance record not found' }, { status: 404 })
      }

      data = advance as unknown as Record<string, unknown>
      hospital = advance.admission?.hospital
        ? (advance.admission.hospital as unknown as Record<string, unknown>)
        : null
    } else if (type === 'payment') {
      const payment = await db.billPayment.findUnique({
        where: { id },
        include: {
          bill: {
            include: {
              admission: {
                select: {
                  id: true,
                  patientName: true,
                  patientAge: true,
                  patientGender: true,
                  admissionNo: true,
                  department: { select: { name: true } },
                  ward: { select: { name: true } },
                  bed: { select: { bedNumber: true } },
                },
              },
              hospital: { select: HOSPITAL_SELECT },
            },
          },
        },
      })

      if (!payment) {
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
      }

      data = payment as unknown as Record<string, unknown>
      hospital = payment.bill?.hospital
        ? (payment.bill.hospital as unknown as Record<string, unknown>)
        : null
    }

    return NextResponse.json({ type, data, hospital })
  } catch (error) {
    console.error('Billing receipt GET error:', error)
    return NextResponse.json({ error: 'Failed to load receipt data' }, { status: 500 })
  }
}
