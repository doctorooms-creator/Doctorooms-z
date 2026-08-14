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

// GET /api/inventory/low-stock — Items where currentStock <= minStockLevel
export async function GET(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const allItems = await db.inventoryItem.findMany({
      where: {
        hospitalId,
        status: 'Active',
      },
      orderBy: { currentStock: 'asc' },
    })

    const items = allItems.filter((item) => item.currentStock <= item.minStockLevel)

    return NextResponse.json({
      items: items.map((item) => {
        const stockPercent = item.minStockLevel > 0
          ? (item.currentStock / item.minStockLevel) * 100
          : 0
        return {
          ...item,
          stockPercent,
          severity: item.currentStock === 0 ? 'Critical' : stockPercent <= 50 ? 'Warning' : 'Low',
        }
      }),
    })
  } catch (error) {
    console.error('Low stock GET error:', error)
    return NextResponse.json({ error: 'Failed to load low stock items' }, { status: 500 })
  }
}
