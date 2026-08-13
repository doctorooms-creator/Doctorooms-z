import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      const nurse = await requireRole(req, 'nurse')
      if (!nurse) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      let effectiveUser = nurse
    } else {
      let effectiveUser = user
    }

    const { id } = await params
    const body = await req.json()
    const { reason } = body

    const diet = await db.dietOrder.findUnique({ where: { id } })
    if (!diet) {
      return NextResponse.json({ error: 'Diet order not found' }, { status: 404 })
    }
    if (diet.status !== 'Active') {
      return NextResponse.json({ error: 'Diet order is not active' }, { status: 400 })
    }

    const updated = await db.dietOrder.update({
      where: { id },
      data: {
        status: 'Stopped',
        stoppedBy: effectiveUser.id,
        stoppedAt: new Date(),
        stoppedReason: reason || '',
      },
    })

    return NextResponse.json({ diet: { id: updated.id, status: updated.status } })
  } catch (error) {
    console.error('Diet order stop PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
