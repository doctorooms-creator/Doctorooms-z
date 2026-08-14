import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { validateBody, createChargeItemSchema } from '@/lib/validations'

/** Resolve hospital auth (hospital or admin role) */
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

// POST /api/charge-items — Create charge item
export async function POST(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const body = await request.json()
    const v = validateBody(createChargeItemSchema, body)
    if (!v.success) return v.error
    const { categoryId, name, shortCode, unitType, rate, isTaxable, taxPercent } = v.data

    // Verify the category belongs to the same hospital
    const category = await db.chargeCategory.findFirst({
      where: { id: categoryId, hospitalId },
    })
    if (!category) {
      return NextResponse.json(
        { error: 'Charge category not found' },
        { status: 404 }
      )
    }

    const chargeItem = await db.chargeItem.create({
      data: {
        categoryId,
        hospitalId,
        name: name.trim(),
        shortCode: shortCode?.trim() || '',
        unitType: unitType?.trim() || 'Per Day',
        rate: typeof rate === 'number' ? rate : 0,
        isTaxable: isTaxable === true,
        taxPercent: typeof taxPercent === 'number' ? taxPercent : 0,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ chargeItem }, { status: 201 })
  } catch (error) {
    console.error('Charge items POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create charge item' },
      { status: 500 }
    )
  }
}

// GET /api/charge-items — List charge items
export async function GET(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const items = await db.chargeItem.findMany({
      where: {
        hospitalId,
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { shortCode: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      chargeItems: items.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        hospitalId: item.hospitalId,
        name: item.name,
        shortCode: item.shortCode,
        unitType: item.unitType,
        rate: item.rate,
        isTaxable: item.isTaxable,
        taxPercent: item.taxPercent,
        status: item.status,
        categoryName: item.category.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Charge items GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load charge items' },
      { status: 500 }
    )
  }
}
