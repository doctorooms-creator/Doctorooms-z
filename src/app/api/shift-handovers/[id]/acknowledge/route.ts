import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({ where: { userId: user.id } })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    const { id } = await params

    const handover = await db.shiftHandover.findUnique({ where: { id } })
    if (!handover) {
      return NextResponse.json({ error: 'Handover not found' }, { status: 404 })
    }
    if (handover.toNurseId !== nurse.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only the receiving nurse can acknowledge' }, { status: 403 })
    }
    if (handover.acknowledgedAt) {
      return NextResponse.json({ error: 'Already acknowledged' }, { status: 400 })
    }

    const updated = await db.shiftHandover.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: nurse.id,
      },
    })

    return NextResponse.json({ handover: { id: updated.id, acknowledgedAt: updated.acknowledgedAt?.toISOString() } })
  } catch (error) {
    console.error('Shift handover acknowledge PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
