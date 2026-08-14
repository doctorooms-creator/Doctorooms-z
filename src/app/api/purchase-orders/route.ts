import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { validateBody, createPurchaseOrderSchema } from '@/lib/validations'

/** Check if user has hospital/admin role */
async function getHospitalAuth(request: NextRequest) {
  let user = await requireRole(request, 'hospital')
  if (!user) user = await requireRole(request, 'admin')
  if (!user) return null

  const hospital = await db.hospital.findUnique({
    where: { userId: user.id },
  })
  if (!hospital) return null
  return { user, hospitalId: hospital.id }
}

// POST /api/purchase-orders — Create purchase order
export async function POST(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, hospitalId } = auth

    const body = await request.json()
    const v = validateBody(createPurchaseOrderSchema, body)
    if (!v.success) return v.error
    const { supplierName, items, notes } = v.data
    const { supplierContact, supplierAddress, expectedDate } = body

    // Generate PO number
    const poCount = await db.purchaseOrder.count({ where: { hospitalId } })
    const poNumber = `PO-${String(poCount + 1).padStart(5, '0')}`

    // Calculate total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitRate,
      0
    )

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        poNumber,
        hospitalId,
        supplierName,
        supplierContact: supplierContact?.trim() || '',
        supplierAddress: supplierAddress?.trim() || '',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalAmount,
        status: 'Draft',
        notes: notes?.trim() || '',
        createdById: user.id,
        items: {
          create: items.map((poItem) => ({
            inventoryItemId: poItem.itemId,
            quantity: poItem.quantity,
            unitPrice: poItem.unitRate,
            total: poItem.quantity * poItem.unitRate,
          })),
        },
      },
      include: {
        items: {
          include: {
            item: {
              select: { name: true, batchNo: true, unit: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ purchaseOrder }, { status: 201 })
  } catch (error) {
    console.error('Purchase orders POST error:', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}

// GET /api/purchase-orders — List purchase orders
export async function GET(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const supplier = searchParams.get('supplier') || undefined
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined

    const where: Record<string, unknown> = { hospitalId }
    if (status) where.status = status
    if (supplier) {
      where.supplierName = { contains: supplier }
    }
    if (fromDate || toDate) {
      const dateFilter: Record<string, unknown> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)
      where.createdAt = dateFilter
    }

    const orders = await db.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        poNumber: order.poNumber,
        hospitalId: order.hospitalId,
        supplierName: order.supplierName,
        supplierContact: order.supplierContact,
        supplierAddress: order.supplierAddress,
        expectedDate: order.expectedDate,
        totalAmount: order.totalAmount,
        status: order.status,
        notes: order.notes,
        createdById: order.createdById,
        itemsCount: order._count.items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Purchase orders GET error:', error)
    return NextResponse.json({ error: 'Failed to load purchase orders' }, { status: 500 })
  }
}
