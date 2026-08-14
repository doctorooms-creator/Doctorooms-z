import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  const mStart = startOfMonth(new Date(year, month - 1, 1))
  const mEnd = endOfMonth(new Date(year, month - 1, 1))
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  const movements = await db.stockMovement.findMany({
    where: { ...hospitalFilter, createdAt: { gte: mStart, lte: mEnd } },
    include: { item: { select: { name: true, category: true, unit: true } } },
  })

  // Consumption = outward movements
  const consumption: Record<string, { name: string; category: string; unit: string; qty: number; value: number }> = {}
  movements.forEach(m => {
    if (m.movementType !== 'Issue' && m.movementType !== 'Consumed' && m.movementType !== 'Sale' && m.movementType !== 'Transfer Out') return
    if (!consumption[m.itemId]) {
      consumption[m.itemId] = { name: m.item?.name || 'Unknown', category: m.item?.category || '', unit: m.item?.unit || '', qty: 0, value: 0 }
    }
    consumption[m.itemId].qty += m.quantity
  })

  const topConsumed = Object.values(consumption)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 30)

  // Summary by type
  const typeSummary: Record<string, { count: number; quantity: number }> = {}
  movements.forEach(m => {
    if (!typeSummary[m.movementType]) typeSummary[m.movementType] = { count: 0, quantity: 0 }
    typeSummary[m.movementType].count++
    typeSummary[m.movementType].quantity += m.quantity
  })
  const movementTypes = Object.entries(typeSummary).map(([type, data]) => ({ type, ...data }))

  return NextResponse.json({ topConsumed, movementTypes, totalMovements: movements.length })
}
