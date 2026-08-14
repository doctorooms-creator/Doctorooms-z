import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/** Read auth: hospital/admin/pharmacist */
async function getReadAuth(request: NextRequest) {
  let user = await requireRole(request, 'hospital')
  if (!user) user = await requireRole(request, 'admin')
  if (!user) user = await requireRole(request, 'pharmacist')
  if (!user) return null

  const hospital = await db.hospital.findUnique({
    where: { userId: user.id },
  })
  if (!hospital) return null
  return { user, hospitalId: hospital.id }
}

// GET /api/stock-movements/summary — Inventory summary stats
export async function GET(request: NextRequest) {
  try {
    const auth = await getReadAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    // Get all active items for the hospital
    const items = await db.inventoryItem.findMany({
      where: { hospitalId, status: 'Active' },
    })

    const totalItems = items.length
    const totalValue = items.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0)
    const lowStockCount = items.filter((item) => item.currentStock <= item.minStockLevel).length
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiredCount = items.filter(
      (item) => item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow
    ).length

    // Category breakdown
    const categoryMap = new Map<string, { count: number; value: number }>()
    items.forEach((item) => {
      const cat = item.category || 'Uncategorized'
      const existing = categoryMap.get(cat) || { count: 0, value: 0 }
      existing.count += 1
      existing.value += item.currentStock * item.unitPrice
      categoryMap.set(cat, existing)
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }))

    return NextResponse.json({
      totalItems,
      totalValue,
      lowStockCount,
      expiredCount,
      categoryBreakdown,
    })
  } catch (error) {
    console.error('Stock movements summary GET error:', error)
    return NextResponse.json({ error: 'Failed to load stock summary' }, { status: 500 })
  }
}
