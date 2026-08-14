import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/api-auth'

// GET /api/bill-payments/[id] — Get single payment with bill details and patient info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const payment = await db.billPayment.findUnique({
      where: { id },
      include: {
        bill: {
          include: {
            admission: {
              select: {
                id: true,
                patientName: true,
                admissionNo: true,
                mobileNo: true,
                department: { select: { name: true } },
                ward: { select: { name: true } },
                bed: { select: { bedNumber: true } },
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        receiptNo: payment.receiptNo,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentRef: payment.paymentRef,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        receivedBy: payment.receivedBy,
        hospitalId: payment.hospitalId,
        createdAt: payment.createdAt,
        bill: payment.bill
          ? {
              id: payment.bill.id,
              billNo: payment.bill.billNo,
              status: payment.bill.status,
              totalAmount: payment.bill.totalAmount,
              netPayable: payment.bill.netPayable,
              admission: payment.bill.admission
                ? {
                    id: payment.bill.admission.id,
                    patientName: payment.bill.admission.patientName,
                    admissionNo: payment.bill.admission.admissionNo,
                    mobileNo: payment.bill.admission.mobileNo,
                    departmentName: payment.bill.admission.department?.name || '',
                    wardName: payment.bill.admission.ward?.name || '',
                    bedNumber: payment.bill.admission.bed?.bedNumber || '',
                  }
                : null,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Bill payment GET by ID error:', error)
    return NextResponse.json({ error: 'Failed to load payment' }, { status: 500 })
  }
}
