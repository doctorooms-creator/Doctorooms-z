import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '9', 10)

  try {
    const where: Prisma.PostWhereInput = {
      status: 'Published',
    }

    if (type && type !== 'All') {
      where.type = type
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          permalink: true,
          content: true,
          blogImg: true,
          type: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              profileImg: true,
            },
          },
        },
      }),
      db.post.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ posts, total, totalPages, page })
  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({ posts: [], total: 0, totalPages: 1, page: 1 })
  }
}
