import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Verify notification belongs to user
    if (notification.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.notification.update({
      where: { id },
      data: { status: 'READ' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
