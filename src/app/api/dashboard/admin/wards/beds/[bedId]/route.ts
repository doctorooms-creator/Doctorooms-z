import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_BED_TYPES = ['General', 'SemiPrivate', 'Private', 'ICU_Ventilator', 'ICU_NonVentilator']
const VALID_STATUSES = ['Available', 'Occupied', 'Reserved', 'Maintenance']

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bedId: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bedId } = await params
    const body = await request.json()
    const { status, dailyRate, bedType, bedNumber } = body

    const existing = await db.bed.findUnique({ where: { id: bedId } })
    if (!existing) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 })
    }

    if (bedType && !VALID_BED_TYPES.includes(bedType)) {
      return NextResponse.json({ error: 'Invalid bedType' }, { status: 400 })
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check duplicate bed number in same ward (excluding self)
    if (bedNumber && bedNumber !== existing.bedNumber) {
      const duplicate = await db.bed.findFirst({
        where: { wardId: existing.wardId, bedNumber },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Bed with this number already exists in this ward' },
          { status: 400 }
        )
      }
    }

    const bed = await db.bed.update({
      where: { id: bedId },
      data: {
        ...(bedNumber !== undefined && { bedNumber }),
        ...(bedType !== undefined && { bedType }),
        ...(dailyRate !== undefined && { dailyRate }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ bed })
  } catch (error) {
    console.error('Admin update bed error:', error)
    return NextResponse.json({ error: 'Failed to update bed' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bedId: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bedId } = await params

    const existing = await db.bed.findUnique({ where: { id: bedId } })
    if (!existing) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 })
    }

    if (existing.status !== 'Available') {
      return NextResponse.json(
        { error: 'Cannot delete bed that is not in Available status' },
        { status: 400 }
      )
    }

    await db.bed.delete({ where: { id: bedId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete bed error:', error)
    return NextResponse.json({ error: 'Failed to delete bed' }, { status: 500 })
  }
}
