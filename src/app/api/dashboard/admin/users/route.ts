import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const ITEMS_PER_PAGE = 10

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'admin')

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'All'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)

    const where: Record<string, unknown> = {}
    if (role !== 'All') {
      where.role = role
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [users, total, roleGroups, statusGroups] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          profileImg: true,
          mobileNo: true,
          createdAt: true,
        },
      }),
      db.user.count({ where }),
      db.user.groupBy({ by: ['role'], _count: { role: true } }),
      db.user.groupBy({ by: ['status'], _count: { status: true } }),
    ])

    const roleCounts: Record<string, number> = {}
    for (const g of roleGroups) {
      roleCounts[g.role] = g._count.role
    }
    for (const g of statusGroups) {
      roleCounts[g.status] = g._count.status
    }

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      roleCounts,
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
