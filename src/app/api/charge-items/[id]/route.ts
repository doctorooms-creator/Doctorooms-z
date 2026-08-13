import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

// PUT /api/charge-items/[id] — Update charge item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { id } = await params

    // Verify charge item belongs to this hospital
    const existing = await db.chargeItem.findFirst({
      where: { id, hospitalId: hospital.id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Charge item not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { categoryId, name, shortCode, unitType, rate, isTaxable, taxPercent } = body

    // If categoryId is being changed, verify it belongs to this hospital
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await db.chargeCategory.findFirst({
        where: { id: categoryId, hospitalId: hospital.id },
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Charge category not found' },
          { status: 404 }
        )
      }
    }

    const chargeItem = await db.chargeItem.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId: String(categoryId) }),
        ...(name !== undefined && { name: String(name).trim() }),
        ...(shortCode !== undefined && { shortCode: String(shortCode).trim() }),
        ...(unitType !== undefined && { unitType: String(unitType).trim() }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(isTaxable !== undefined && { isTaxable: Boolean(isTaxable) }),
        ...(taxPercent !== undefined && { taxPercent: Number(taxPercent) }),
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ chargeItem })
  } catch (error) {
    console.error('Charge item PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update charge item' },
      { status: 500 }
    )
  }
}

// DELETE /api/charge-items/[id] — Soft delete (set status='Inactive')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { id } = await params

    // Verify charge item belongs to this hospital
    const existing = await db.chargeItem.findFirst({
      where: { id, hospitalId: hospital.id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Charge item not found' },
        { status: 404 }
      )
    }

    await db.chargeItem.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ message: 'Charge item deactivated successfully' })
  } catch (error) {
    console.error('Charge item DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate charge item' },
      { status: 500 }
    )
  }
}
