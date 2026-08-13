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

// GET /api/bill-payments/daily-summary — Today's payment summary
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

    const payments = await db.billPayment.findMany({
      where: {
        hospitalId,
        paymentDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
    })

    let totalCash = 0
    let totalUPI = 0
    let totalCard = 0
    let totalNetBanking = 0
    let totalCheque = 0
    let grandTotal = 0

    for (const p of payments) {
      grandTotal += p.amount
      switch (p.paymentMethod) {
        case 'Cash':
          totalCash += p.amount
          break
        case 'UPI':
          totalUPI += p.amount
          break
        case 'Card':
          totalCard += p.amount
          break
        case 'NetBanking':
          totalNetBanking += p.amount
          break
        case 'Cheque':
          totalCheque += p.amount
          break
        default:
          totalCash += p.amount
          break
      }
    }

    return NextResponse.json({
      date: startOfDay,
      totalCash,
      totalUPI,
      totalCard,
      totalNetBanking,
      totalCheque,
      grandTotal,
      count: payments.length,
    })
  } catch (error) {
    console.error('Bill payments daily summary error:', error)
    return NextResponse.json({ error: 'Failed to load daily summary' }, { status: 500 })
  }
}
