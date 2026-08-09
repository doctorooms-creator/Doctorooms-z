import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { name: { contains: search } } },
      ]
    }

    const posts = await db.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        type: p.type,
        status: p.status,
        authorName: p.author.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        permalink: p.permalink,
      })),
      total: posts.length,
      published: posts.filter((p) => p.status === 'Published').length,
      drafts: posts.filter((p) => p.status === 'Draft').length,
    })
  } catch (error) {
    console.error('Admin blog list error:', error)
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, content, type, status } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const permalink = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    const post = await db.post.create({
      data: {
        title: title.trim(),
        content: content || '',
        permalink,
        type: type || 'Blog',
        status: status || 'Draft',
        authorId: user.id,
      },
    })

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error('Create blog post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
