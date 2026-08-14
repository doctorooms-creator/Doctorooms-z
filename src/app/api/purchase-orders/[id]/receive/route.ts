import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/** Check if user has hospital/admin/pharmacist role */
async function getAuth(request: NextRequest) {
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

// PUT /api/purchase-orders/[id]/receive — Receive items from PO
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, hospitalId } = auth
    const { id } = await params

    const existing = await db.purchaseOrder.findFirst({
      where: { id, hospitalId },
      include: { items: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (existing.status === 'Received' || existing.status === 'Cancelled') {
      return NextResponse.json(
        { error: `Cannot receive items for a PO with status: ${existing.status}` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item to receive is required' }, { status: 400 })
    }

    // Process each received item
    const movements = []
    for (const received of items) {
      const poItem = existing.items.find((i) => i.id === received.poItemId)
      if (!poItem) continue

      const receivedQty = typeof received.receivedQty === 'number' ? received.receivedQty : 0
      if (receivedQty <= 0) continue

      // Don't allow receiving more than ordered
      const actualReceived = Math.min(receivedQty, poItem.quantity - poItem.receivedQty)
      if (actualReceived <= 0) continue

      // Update received quantity
      await db.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQty: poItem.receivedQty + actualReceived },
      })

      // Create stock movement
      const movement = await db.stockMovement.create({
        data: {
          hospitalId,
          itemId: poItem.inventoryItemId,
          movementType: 'Purchase',
          quantity: actualReceived,
          referenceNo: existing.poNumber,
          fromLocation: 'Supplier',
          toLocation: existing.notes || '',
          notes: `Received against PO ${existing.poNumber}`,
          movedBy: user.id,
        },
      })
      movements.push(movement)

      // Update inventory stock
      const invItem = await db.inventoryItem.findUnique({
        where: { id: poItem.inventoryItemId },
      })
      if (invItem) {
        await db.inventoryItem.update({
          where: { id: poItem.inventoryItemId },
          data: { currentStock: invItem.currentStock + actualReceived },
        })
      }
    }

    // Check if all items are fully received
    const updatedPO = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    })

    const allReceived = updatedPO?.items.every((item) => item.receivedQty >= item.quantity)
    const newStatus = allReceived ? 'Received' : 'Partially Received'

    await db.purchaseOrder.update({
      where: { id },
      data: { status: newStatus },
    })

    return NextResponse.json({
      status: newStatus,
      movementsCreated: movements.length,
    })
  } catch (error) {
    console.error('Purchase order receive PUT error:', error)
    return NextResponse.json({ error: 'Failed to receive purchase order items' }, { status: 500 })
  }
}
