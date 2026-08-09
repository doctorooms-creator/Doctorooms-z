import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(request, 'admin')

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['Active', 'Block', 'Pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from blocking themselves
    if (user.id === authUser.id && status === 'Block') {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Update user status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
