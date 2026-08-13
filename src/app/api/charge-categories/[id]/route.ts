import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

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

// PUT /api/charge-categories/[id] — Update charge category
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

    // Verify category belongs to this hospital
    const existing = await db.chargeCategory.findFirst({
      where: { id, hospitalId: hospital.id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Charge category not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, isTaxable, taxPercent, sortOrder } = body

    const category = await db.chargeCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(isTaxable !== undefined && { isTaxable: Boolean(isTaxable) }),
        ...(taxPercent !== undefined && { taxPercent: Number(taxPercent) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Charge category PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update charge category' },
      { status: 500 }
    )
  }
}

// DELETE /api/charge-categories/[id] — Soft delete (set status='Inactive')
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

    // Verify category belongs to this hospital
    const existing = await db.chargeCategory.findFirst({
      where: { id, hospitalId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Charge category not found' },
        { status: 404 }
      )
    }

    await db.chargeCategory.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ message: 'Charge category deactivated successfully' })
  } catch (error) {
    console.error('Charge category DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate charge category' },
      { status: 500 }
    )
  }
}
