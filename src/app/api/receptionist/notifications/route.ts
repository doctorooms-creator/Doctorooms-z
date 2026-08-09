import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        status: true,
        createdAt: true,
      },
    })

    const unreadCount = await db.notification.count({
      where: { userId: user.id, status: 'UNREAD' },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Receptionist notifications error:', error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, markAll } = body

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: user.id, status: 'UNREAD' },
        data: { status: 'READ' },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (notificationId) {
      const updated = await db.notification.updateMany({
        where: { id: notificationId, userId: user.id },
        data: { status: 'READ' },
      })
      return NextResponse.json({ success: true, updated: updated.count })
    }

    return NextResponse.json({ error: 'Provide notificationId or markAll' }, { status: 400 })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
