import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 11, 31))
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  // Revenue
  const ipdPayments = await db.billPayment.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: yearStart, lte: yearEnd } },
  })
  const opdBills = await db.opdBill.findMany({
    where: { ...hospitalFilter, paymentDate: { gte: yearStart, lte: yearEnd } },
  })
  const advances = await db.patientAdvance.findMany({
    where: { ...hospitalFilter, createdAt: { gte: yearStart, lte: yearEnd } },
  })

  const totalIpdRevenue = ipdPayments.reduce((s, p) => s + p.amount, 0)
  const totalOpdRevenue = opdBills.reduce((s, b) => s + b.totalAmount, 0)
  const totalAdvances = advances.reduce((s, a) => s + a.amount, 0)

  // Costs: IPD bill breakdown
  const ipdBills = await db.ipdBill.findMany({
    where: { ...hospitalFilter, createdAt: { gte: yearStart, lte: yearEnd } },
  })
  const totalRoomRent = ipdBills.reduce((s, b) => s + b.roomRentAmount, 0)
  const totalServices = ipdBills.reduce((s, b) => s + b.serviceAmount, 0)
  const totalLab = ipdBills.reduce((s, b) => s + b.labAmount, 0)
  const totalMedicine = ipdBills.reduce((s, b) => s + b.medicineAmount, 0)
  const totalOt = ipdBills.reduce((s, b) => s + b.otAmount, 0)
  const totalOther = ipdBills.reduce((s, b) => s + b.otherAmount, 0)
  const totalTax = ipdBills.reduce((s, b) => s + b.taxAmount, 0) + opdBills.reduce((s, b) => s + b.taxAmount, 0)
  const totalDiscounts = ipdBills.reduce((s, b) => s + b.discountAmount, 0) + opdBills.reduce((s, b) => s + b.discountAmount, 0)

  // Inventory purchases (expense)
  const purchaseOrders = await db.purchaseOrder.findMany({
    where: { ...hospitalFilter, status: { in: ['Received', 'PartiallyReceived', 'Completed'] }, createdAt: { gte: yearStart, lte: yearEnd } },
  })
  const totalPurchases = purchaseOrders.reduce((s, po) => s + po.totalAmount, 0)

  const totalRevenue = totalIpdRevenue + totalOpdRevenue
  const totalExpenses = totalPurchases
  const netProfit = totalRevenue - totalExpenses

  // Monthly breakdown
  const monthly: { month: string; revenue: number; expenses: number; profit: number }[] = []
  for (let m = 0; m < 12; m++) {
    const mStart = startOfMonth(new Date(year, m, 1))
    const mEnd = endOfMonth(new Date(year, m, 1))
    const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const mIpd = ipdPayments.filter(p => p.paymentDate >= mStart && p.paymentDate <= mEnd).reduce((s, p) => s + p.amount, 0)
    const mOpd = opdBills.filter(b => b.paymentDate >= mStart && b.paymentDate <= mEnd).reduce((s, b) => s + b.totalAmount, 0)
    const mPO = purchaseOrders.filter(po => po.createdAt >= mStart && po.createdAt <= mEnd).reduce((s, po) => s + po.totalAmount, 0)

    monthly.push({
      month: mNames[m],
      revenue: Math.round((mIpd + mOpd) * 100) / 100,
      expenses: Math.round(mPO * 100) / 100,
      profit: Math.round((mIpd + mOpd - mPO) * 100) / 100,
    })
  }

  return NextResponse.json({
    year,
    revenue: {
      ipd: Math.round(totalIpdRevenue * 100) / 100,
      opd: Math.round(totalOpdRevenue * 100) / 100,
      advances: Math.round(totalAdvances * 100) / 100,
      total: Math.round(totalRevenue * 100) / 100,
    },
    expenses: {
      roomRent: Math.round(totalRoomRent * 100) / 100,
      services: Math.round(totalServices * 100) / 100,
      lab: Math.round(totalLab * 100) / 100,
      medicine: Math.round(totalMedicine * 100) / 100,
      ot: Math.round(totalOt * 100) / 100,
      other: Math.round(totalOther * 100) / 100,
      purchases: Math.round(totalPurchases * 100) / 100,
      total: Math.round(totalExpenses * 100) / 100,
    },
    tax: Math.round(totalTax * 100) / 100,
    discounts: Math.round(totalDiscounts * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0,
    monthly,
  })
}
