import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ permalink: string }> }
) {
  const { permalink } = await params

  try {
    const post = await db.post.findUnique({
      where: { permalink, status: 'Published' },
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
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get related posts (same type, excluding current)
    const relatedPosts = await db.post.findMany({
      where: {
        status: 'Published',
        type: post.type,
        id: { not: post.id },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
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
    })

    return NextResponse.json({ post, relatedPosts })
  } catch (error) {
    console.error('Blog detail API error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}
