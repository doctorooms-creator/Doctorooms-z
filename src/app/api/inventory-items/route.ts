import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/**
 * Helper: resolve hospital auth for inventory routes.
 * Accepts hospital, admin, or pharmacist roles.
 */
async function getInventoryAuth(request: NextRequest) {
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

/** Check if user has hospital/admin role (for create/update/delete) */
async function getWriteAuth(request: NextRequest) {
  let user = await requireRole(request, 'hospital')
  if (!user) user = await requireRole(request, 'admin')
  if (!user) return null

  const hospital = await db.hospital.findUnique({
    where: { userId: user.id },
  })
  if (!hospital) return null
  return { user, hospitalId: hospital.id }
}

// POST /api/inventory-items — Create inventory item
export async function POST(request: NextRequest) {
  try {
    const auth = await getWriteAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const body = await request.json()
    const {
      name,
      category,
      genericName,
      manufacturer,
      batchNo,
      expiryDate,
      unit,
      unitPrice,
      sellingPrice,
      minStockLevel,
      maxStockLevel,
      reorderQty,
      hsnCode,
      gstPercent,
      storeLocation,
    } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        hospitalId,
        name: name.trim(),
        category: category?.trim() || '',
        genericName: genericName?.trim() || '',
        manufacturer: manufacturer?.trim() || '',
        batchNo: batchNo?.trim() || '',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        unit: unit?.trim() || '',
        unitPrice: typeof unitPrice === 'number' ? unitPrice : 0,
        sellingPrice: typeof sellingPrice === 'number' ? sellingPrice : 0,
        currentStock: 0,
        minStockLevel: typeof minStockLevel === 'number' ? minStockLevel : 10,
        maxStockLevel: typeof maxStockLevel === 'number' ? maxStockLevel : 1000,
        reorderQty: typeof reorderQty === 'number' ? reorderQty : 100,
        hsnCode: hsnCode?.trim() || '',
        gstPercent: typeof gstPercent === 'number' ? gstPercent : 0,
        storeLocation: storeLocation?.trim() || '',
        status: 'Active',
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Inventory items POST error:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}

// GET /api/inventory-items — List inventory items
export async function GET(request: NextRequest) {
  try {
    const auth = await getInventoryAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: Record<string, unknown> = { hospitalId }
    if (category) where.category = category
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { batchNo: { contains: search } },
        { manufacturer: { contains: search } },
      ]
    }

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    let result = items.map((item) => ({
      ...item,
      lowStock: item.currentStock <= item.minStockLevel,
    }))

    if (lowStock) {
      result = result.filter((item) => item.lowStock)
    }

    return NextResponse.json({ items: result })
  } catch (error) {
    console.error('Inventory items GET error:', error)
    return NextResponse.json({ error: 'Failed to load inventory items' }, { status: 500 })
  }
}
