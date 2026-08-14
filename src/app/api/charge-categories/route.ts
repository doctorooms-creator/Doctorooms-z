import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/**
 * Helper: allow hospital OR admin role.
 * requireRole already passes admin through, but we use explicit
 * dual-check here for clarity and to always resolve hospitalId.
 */
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

// POST /api/charge-categories — Create charge category
export async function POST(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const body = await request.json()
    const { name, description, isTaxable, taxPercent, sortOrder } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const category = await db.chargeCategory.create({
      data: {
        hospitalId,
        name: name.trim(),
        description: description?.trim() || '',
        isTaxable: isTaxable === true,
        taxPercent: typeof taxPercent === 'number' ? taxPercent : 0,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Charge categories POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create charge category' },
      { status: 500 }
    )
  }
}

// GET /api/charge-categories — List charge categories
export async function GET(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const categories = await db.chargeCategory.findMany({
      where: {
        hospitalId,
        ...(status && { status }),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { chargeItems: true },
        },
      },
    })

    return NextResponse.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        hospitalId: cat.hospitalId,
        name: cat.name,
        description: cat.description,
        isTaxable: cat.isTaxable,
        taxPercent: cat.taxPercent,
        status: cat.status,
        sortOrder: cat.sortOrder,
        chargeItemCount: cat._count.chargeItems,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Charge categories GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load charge categories' },
      { status: 500 }
    )
  }
}
