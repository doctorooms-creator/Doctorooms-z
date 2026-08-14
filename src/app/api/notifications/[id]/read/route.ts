import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/api-auth'

// PUT /api/notifications/[id]/read — Mark a single notification as read
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
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
    if (notification.userId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await db.notification.update({
      where: { id },
      data: { status: 'READ' },
    })

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
