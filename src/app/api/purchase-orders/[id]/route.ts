import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

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

// GET /api/purchase-orders/[id] — Get PO with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const order = await db.purchaseOrder.findFirst({
      where: { id, hospitalId },
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

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if fully received
    const allReceived = order.items.every((item) => item.receivedQty >= item.quantity)

    return NextResponse.json({
      order: {
        ...order,
        fullyReceived: allReceived,
      },
    })
  } catch (error) {
    console.error('Purchase order GET error:', error)
    return NextResponse.json({ error: 'Failed to load purchase order' }, { status: 500 })
  }
}

// DELETE /api/purchase-orders/[id] — Cancel PO
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const existing = await db.purchaseOrder.findFirst({
      where: { id, hospitalId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (existing.status === 'Received' || existing.status === 'Cancelled') {
      return NextResponse.json(
        { error: `Cannot cancel a purchase order with status: ${existing.status}` },
        { status: 400 }
      )
    }

    const order = await db.purchaseOrder.update({
      where: { id },
      data: { status: 'Cancelled' },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Purchase order DELETE error:', error)
    return NextResponse.json({ error: 'Failed to cancel purchase order' }, { status: 500 })
  }
}
