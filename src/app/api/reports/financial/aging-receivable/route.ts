import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }
  const now = Date.now()
  const DAY = 1000 * 60 * 60 * 24

  // IPD bills
  const ipdBills = await db.ipdBill.findMany({
    where: { ...hospitalFilter, status: { in: ['Draft', 'Finalized'] } },
    include: {
      admission: { select: { patientName: true, admissionNo: true } },
      payments: { select: { amount: true } },
    },
  })

  const agingBuckets = [
    { label: '0-30 days', min: 0, max: 30, amount: 0, count: 0 },
    { label: '31-60 days', min: 31, max: 60, amount: 0, count: 0 },
    { label: '61-90 days', min: 61, max: 90, amount: 0, count: 0 },
    { label: '91-180 days', min: 91, max: 180, amount: 0, count: 0 },
    { label: '180+ days', min: 181, max: 99999, amount: 0, count: 0 },
  ]

  const bills: { billNo: string; patientName: string; reference: string; type: string; total: number; paid: number; outstanding: number; daysOld: number; bucket: string }[] = []

  for (const bill of ipdBills) {
    const paid = bill.payments.reduce((s, p) => s + p.amount, 0)
    const remaining = bill.netPayable - paid
    if (remaining <= 0) continue

    const createdAt = bill.generatedAt || bill.createdAt
    const daysOld = Math.floor((now - createdAt.getTime()) / DAY)

    const bucket = agingBuckets.find(b => daysOld >= b.min && daysOld <= b.max)
    if (bucket) { bucket.amount += remaining; bucket.count++ }

    bills.push({
      billNo: bill.billNo,
      patientName: bill.admission?.patientName || 'Walk-in',
      reference: bill.admission?.admissionNo || '',
      type: 'IPD',
      total: bill.netPayable,
      paid: Math.round(paid * 100) / 100,
      outstanding: Math.round(remaining * 100) / 100,
      daysOld,
      bucket: bucket?.label || 'Unknown',
    })
  }

  // OPD unpaid
  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, status: 'Unpaid' },
    include: { booking: { select: { patientName: true } } },
  })

  opdBills.forEach(b => {
    const daysOld = Math.floor((now - b.createdAt.getTime()) / DAY)
    const bucket = agingBuckets.find(bk => daysOld >= bk.min && daysOld <= bk.max)
    if (bucket) { bucket.amount += b.totalAmount; bucket.count++ }
    bills.push({
      billNo: b.receiptNo || b.id,
      patientName: b.patientName || b.booking?.patientName || 'Walk-in',
      reference: '',
      type: 'OPD',
      total: b.totalAmount,
      paid: 0,
      outstanding: Math.round(b.totalAmount * 100) / 100,
      daysOld,
      bucket: bucket?.label || 'Unknown',
    })
  })

  const totalOutstanding = bills.reduce((s, b) => s + b.outstanding, 0)

  agingBuckets.forEach(b => {
    b.amount = Math.round(b.amount * 100) / 100
    b.percent = totalOutstanding > 0 ? Math.round((b.amount / totalOutstanding) * 1000) / 10 : 0
  })

  bills.sort((a, b) => b.daysOld - a.daysOld)

  return NextResponse.json({ agingBuckets, bills: bills.slice(0, 100), totalOutstanding: Math.round(totalOutstanding * 100) / 100 })
}
