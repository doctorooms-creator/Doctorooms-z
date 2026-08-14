import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  // IPD outstanding: bills where netPayable > sum(payments)
  const ipdBills = await db.ipdBill.findMany({
    where: { ...hospitalFilter, status: { in: ['Draft', 'Finalized'] } },
    include: {
      admission: {
        select: { patientName: true, admissionNo: true, departmentId: true },
        include: { department: { select: { name: true } } },
      },
      payments: { select: { amount: true } },
    },
  })

  const outstanding: {
    billNo: string
    patientName: string
    admissionNo: string
    department: string
    totalAmount: number
    paid: number
    outstanding: number
    daysOld: number
    type: string
  }[] = []

  const now = Date.now()
  for (const bill of ipdBills) {
    const paid = bill.payments.reduce((s, p) => s + p.amount, 0)
    const remaining = bill.netPayable - paid
    if (remaining > 0) {
      const createdAt = bill.generatedAt || bill.createdAt
      const daysOld = Math.floor((now - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      outstanding.push({
        billNo: bill.billNo,
        patientName: bill.admission?.patientName || 'Walk-in',
        admissionNo: bill.admission?.admissionNo || '',
        department: bill.admission?.department?.name || '',
        totalAmount: bill.netPayable,
        paid: Math.round(paid * 100) / 100,
        outstanding: Math.round(remaining * 100) / 100,
        daysOld,
        type: 'IPD',
      })
    }
  }

  // OPD: find unpaid bills
  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, status: 'Unpaid' },
    include: {
      booking: {
        select: { patientName: true, appointmentNo: true },
      },
    },
  })

  opdBills.forEach(b => {
    const daysOld = Math.floor((now - b.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    outstanding.push({
      billNo: b.receiptNo || b.id,
      patientName: b.patientName || b.booking?.patientName || 'Walk-in',
      admissionNo: b.booking?.appointmentNo || '',
      department: 'OPD',
      totalAmount: b.totalAmount,
      paid: 0,
      outstanding: Math.round(b.totalAmount * 100) / 100,
      daysOld,
      type: 'OPD',
    })
  })

  outstanding.sort((a, b) => b.outstanding - a.outstanding)
  const totalOutstanding = outstanding.reduce((s, o) => s + o.outstanding, 0)

  return NextResponse.json({
    outstanding,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    count: outstanding.length,
  })
}
