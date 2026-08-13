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

// POST /api/stock-movements — Record stock movement
export async function POST(request: NextRequest) {
  try {
    const auth = await getReadAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, hospitalId } = auth

    const body = await request.json()
    const { itemId, movementType, quantity, referenceNo, fromLocation, toLocation, notes } = body

    if (!itemId || !movementType || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'itemId, movementType, and positive quantity are required' },
        { status: 400 }
      )
    }

    const validTypes = ['Purchase', 'Sale', 'Issue', 'Return', 'Transfer', 'Adjustment', 'Expired', 'Damaged']
    if (!validTypes.includes(movementType)) {
      return NextResponse.json(
        { error: `Invalid movementType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify item belongs to hospital
    const item = await db.inventoryItem.findFirst({
      where: { id: itemId, hospitalId },
    })
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Calculate stock change
    const stockIncreaseTypes = ['Purchase', 'Return']
    const stockChange = stockIncreaseTypes.includes(movementType) ? quantity : -quantity

    // Check if stock would go negative
    const newStock = item.currentStock + stockChange
    if (newStock < 0) {
      return NextResponse.json(
        { error: `Insufficient stock. Current: ${item.currentStock}, Attempted deduction: ${quantity}` },
        { status: 400 }
      )
    }

    // Create stock movement record
    const movement = await db.stockMovement.create({
      data: {
        hospitalId,
        itemId,
        movementType,
        quantity,
        referenceNo: referenceNo?.trim() || '',
        fromLocation: fromLocation?.trim() || '',
        toLocation: toLocation?.trim() || '',
        notes: notes?.trim() || '',
        movedBy: user.id,
      },
    })

    // Update item stock
    await db.inventoryItem.update({
      where: { id: itemId },
      data: { currentStock: newStock },
    })

    // Fetch updated item
    const updatedItem = await db.inventoryItem.findUnique({ where: { id: itemId } })

    return NextResponse.json(
      {
        movement,
        updatedStock: updatedItem?.currentStock ?? newStock,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Stock movements POST error:', error)
    return NextResponse.json({ error: 'Failed to record stock movement' }, { status: 500 })
  }
}

// GET /api/stock-movements — List stock movements
export async function GET(request: NextRequest) {
  try {
    const auth = await getReadAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId') || undefined
    const movementType = searchParams.get('movementType') || undefined
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined

    const where: Record<string, unknown> = { hospitalId }
    if (itemId) where.itemId = itemId
    if (movementType) where.movementType = movementType
    if (fromDate || toDate) {
      const dateFilter: Record<string, unknown> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      where.createdAt = dateFilter
    }

    const movements = await db.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: { name: true, batchNo: true, unit: true },
        },
      },
    })

    // Fetch user names for movedBy
    const userIds = [...new Set(movements.map((m) => m.movedBy))]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u.name]))

    return NextResponse.json({
      movements: movements.map((m) => ({
        id: m.id,
        hospitalId: m.hospitalId,
        itemId: m.itemId,
        itemName: m.item.name,
        itemBatchNo: m.item.batchNo,
        itemUnit: m.item.unit,
        movementType: m.movementType,
        quantity: m.quantity,
        referenceNo: m.referenceNo,
        fromLocation: m.fromLocation,
        toLocation: m.toLocation,
        notes: m.notes,
        movedBy: m.movedBy,
        movedByName: userMap.get(m.movedBy) || 'Unknown',
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Stock movements GET error:', error)
    return NextResponse.json({ error: 'Failed to load stock movements' }, { status: 500 })
  }
}
