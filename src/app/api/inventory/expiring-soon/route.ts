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

// GET /api/inventory/expiring-soon — Items expiring within 30 days
export async function GET(request: NextRequest) {
  try {
    const auth = await getReadAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const items = await db.inventoryItem.findMany({
      where: {
        hospitalId,
        status: 'Active',
        expiryDate: {
          not: null,
          lte: thirtyDaysFromNow,
        },
      },
      orderBy: { expiryDate: 'asc' },
    })

    return NextResponse.json({
      items: items.map((item) => {
        const expiry = new Date(item.expiryDate!)
        const daysLeft = Math.ceil(
          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          ...item,
          daysLeft: Math.max(0, daysLeft),
          isExpired: daysLeft <= 0,
        }
      }),
    })
  } catch (error) {
    console.error('Expiring soon GET error:', error)
    return NextResponse.json({ error: 'Failed to load expiring items' }, { status: 500 })
  }
}
