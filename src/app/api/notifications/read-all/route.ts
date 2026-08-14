import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/api-auth'

// PUT /api/notifications/read-all — Mark all notifications as read for current user
export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.notification.updateMany({
      where: {
        userId: authUser.id,
        status: 'UNREAD',
      },
      data: { status: 'READ' },
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
