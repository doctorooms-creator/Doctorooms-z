import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await db.post.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, profileImg: true } },
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Doctor posts error:', error)
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, content, type, status, permalink } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const post = await db.post.create({
      data: {
        title,
        permalink: permalink || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
        content: content || '',
        type: type || 'Blog',
        status: status || 'Draft',
        authorId: session.user.id,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, title, content, type, status } = body

    if (!id || !title) {
      return NextResponse.json({ error: 'Post ID and title are required' }, { status: 400 })
    }

    const post = await db.post.update({
      where: { id, authorId: session.user.id },
      data: {
        title,
        content: content || '',
        type: type || 'Blog',
        status: status || 'Draft',
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    await db.post.deleteMany({
      where: { id, authorId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
