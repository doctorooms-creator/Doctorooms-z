import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

// GET /api/stock-movements/item/[itemId] — Get all stock movements for an item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    let user = await requireRole(req, 'hospital')
    if (!user) user = await requireRole(req, 'admin')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { itemId } = await params

    const movements = await db.stockMovement.findMany({
      where: { itemId },
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
    console.error('Stock movements by item GET error:', error)
    return NextResponse.json({ error: 'Failed to load stock movements' }, { status: 500 })
  }
}
