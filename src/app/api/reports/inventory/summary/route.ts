import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  const items = await db.inventoryItem.findMany({
    where: { ...hospitalFilter },
  })

  const totalItems = items.length
  const activeItems = items.filter(i => i.status === 'Active').length
  const totalStockValue = items.reduce((s, i) => s + (i.currentStock * i.sellingPrice), 0)
  const totalCostValue = items.reduce((s, i) => s + (i.currentStock * i.unitPrice), 0)
  const potentialProfit = totalStockValue - totalCostValue

  // Low stock alerts
  const lowStockItems = items.filter(i => i.currentStock <= i.minStockLevel)
  const outOfStock = items.filter(i => i.currentStock <= 0)
  const nearExpiry = items.filter(i => i.expiryDate && (i.expiryDate.getTime() - Date.now()) < 90 * 24 * 60 * 60 * 1000 && i.currentStock > 0)

  // Category breakdown
  const catMap: Record<string, { count: number; stock: number; value: number }> = {}
  items.forEach(i => {
    const cat = i.category || 'Uncategorized'
    if (!catMap[cat]) catMap[cat] = { count: 0, stock: 0, value: 0 }
    catMap[cat].count++
    catMap[cat].stock += i.currentStock
    catMap[cat].value += i.currentStock * i.sellingPrice
  })
  const categories = Object.entries(catMap)
    .map(([category, data]) => ({
      category,
      itemCount: data.count,
      totalStock: Math.round(data.stock * 100) / 100,
      stockValue: Math.round(data.value * 100) / 100,
    }))
    .sort((a, b) => b.stockValue - a.stockValue)

  // Open purchase orders
  const openPOs = await db.purchaseOrder.count({
    where: { ...hospitalFilter, status: { in: ['Draft', 'Sent', 'Confirmed', 'PartiallyReceived'] } },
  })

  return NextResponse.json({
    totalItems,
    activeItems,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStock.length,
    nearExpiryCount: nearExpiry.length,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    totalCostValue: Math.round(totalCostValue * 100) / 100,
    potentialProfit: Math.round(potentialProfit * 100) / 100,
    categories,
    openPurchaseOrders: openPOs,
  })
}
