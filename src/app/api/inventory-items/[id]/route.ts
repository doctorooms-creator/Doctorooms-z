import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { emitNotification, roleRoom } from '@/lib/emit-notification'

/** Check if user has hospital/admin role (for write operations) */
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

// GET /api/inventory-items/[id] — Get single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getReadAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const item = await db.inventoryItem.findFirst({
      where: { id, hospitalId },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({
      item: {
        ...item,
        lowStock: item.currentStock <= item.minStockLevel,
      },
    })
  } catch (error) {
    console.error('Inventory item GET error:', error)
    return NextResponse.json({ error: 'Failed to load inventory item' }, { status: 500 })
  }
}

// PUT /api/inventory-items/[id] — Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getWriteAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const existing = await db.inventoryItem.findFirst({
      where: { id, hospitalId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

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
      status,
    } = body

    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(genericName !== undefined && { genericName: genericName.trim() }),
        ...(manufacturer !== undefined && { manufacturer: manufacturer.trim() }),
        ...(batchNo !== undefined && { batchNo: batchNo.trim() }),
        ...(expiryDate !== undefined && {
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        }),
        ...(unit !== undefined && { unit: unit.trim() }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(minStockLevel !== undefined && { minStockLevel }),
        ...(maxStockLevel !== undefined && { maxStockLevel }),
        ...(reorderQty !== undefined && { reorderQty }),
        ...(hsnCode !== undefined && { hsnCode: hsnCode.trim() }),
        ...(gstPercent !== undefined && { gstPercent }),
        ...(storeLocation !== undefined && { storeLocation: storeLocation.trim() }),
        ...(status !== undefined && { status }),
      },
    })

    // Check for low stock alert
    if (item.currentStock < item.minStockLevel) {
      emitNotification('low-stock-alert', [roleRoom('hospital'), roleRoom('pharmacist')], {
        id: item.id,
        title: 'Low Stock Alert',
        message: `${item.name} stock is ${item.currentStock} (min: ${item.minStockLevel})`,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Inventory item PUT error:', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

// DELETE /api/inventory-items/[id] — Soft delete (set status=Inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getWriteAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const existing = await db.inventoryItem.findFirst({
      where: { id, hospitalId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const item = await db.inventoryItem.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Inventory item DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
