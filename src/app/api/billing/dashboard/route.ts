import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/** Resolve hospitalId from hospital/admin/receptionist role */
async function resolveHospitalId(req: NextRequest): Promise<{ hospitalId: string } | null> {
  let user = await requireRole(req, 'hospital')
  if (!user) user = await requireRole(req, 'admin')
  if (!user) user = await requireRole(req, 'receptionist')
  if (!user) return null

  if (user.role === 'hospital' || user.role === 'admin') {
    const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
    if (!hospital) return null
    return { hospitalId: hospital.id }
  }

  const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
  if (!receptionist) return null
  return { hospitalId: receptionist.hospitalId }
}

// GET /api/billing/dashboard — Billing dashboard stats
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveHospitalId(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    // Today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Today's collection (IPD payments + OPD bills paid today)
    const [todayIpdPayments, todayOpdBills] = await Promise.all([
      db.billPayment.aggregate({
        where: {
          hospitalId,
          paymentDate: { gte: startOfDay, lt: endOfDay },
        },
        _sum: { amount: true },
      }),
      db.opdBill.aggregate({
        where: {
          hospitalId,
          paymentDate: { gte: startOfDay, lt: endOfDay },
          status: 'Paid',
        },
        _sum: { totalAmount: true },
      }),
    ])

    const todayCollection =
      (todayIpdPayments._sum.amount || 0) + (todayOpdBills._sum.totalAmount || 0)

    // Monthly collection
    const [monthIpdPayments, monthOpdBills] = await Promise.all([
      db.billPayment.aggregate({
        where: {
          hospitalId,
          paymentDate: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      db.opdBill.aggregate({
        where: {
          hospitalId,
          paymentDate: { gte: monthStart },
          status: 'Paid',
        },
        _sum: { totalAmount: true },
      }),
    ])

    const monthCollection =
      (monthIpdPayments._sum.amount || 0) + (monthOpdBills._sum.totalAmount || 0)

    // Pending bills (Draft + Final with netPayable > 0)
    const pendingBills = await db.ipdBill.count({
      where: {
        hospitalId,
        status: { in: ['Draft', 'Final'] },
        netPayable: { gt: 0 },
      },
    })

    // Pending amount
    const pendingAmount = await db.ipdBill.aggregate({
      where: {
        hospitalId,
        status: { in: ['Draft', 'Final'] },
        netPayable: { gt: 0 },
      },
      _sum: { netPayable: true },
    })

    // Recent payments (last 10)
    const recentPayments = await db.billPayment.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      take: 10,
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
    })

    return NextResponse.json({
      todayCollection,
      monthCollection,
      pendingBills,
      pendingAmount: pendingAmount._sum.netPayable || 0,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        receiptNo: p.receiptNo,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        billNo: p.bill.billNo,
        patientName: p.bill.admission?.patientName || '',
        admissionNo: p.bill.admission?.admissionNo || '',
      })),
    })
  } catch (error) {
    console.error('Billing dashboard GET error:', error)
    return NextResponse.json({ error: 'Failed to load billing dashboard' }, { status: 500 })
  }
}
