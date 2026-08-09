import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({
        where: { userId: user.id },
      }),
      db.notification.count({
        where: { userId: user.id, status: 'UNREAD' },
      }),
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Patient notifications list error:', error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}
