import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateUniquePermalink(title: string): Promise<string> {
  let slug = slugify(title)
  if (!slug) slug = `post-${Date.now()}`
  let exists = await db.post.findUnique({ where: { permalink: slug } })
  if (!exists) return slug
  for (let i = 1; i <= 99; i++) {
    const candidate = `${slug}-${i}`
    exists = await db.post.findUnique({ where: { permalink: candidate } })
    if (!exists) return candidate
  }
  return `${slug}-${Math.floor(Math.random() * 99)}`
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const posts = await db.post.findMany({
      where: { authorId: user.id },
      select: {
        id: true,
        title: true,
        permalink: true,
        status: true,
        blogImg: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Patient posts list error:', error)
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, content, blogImg, videoLink, status } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const permalink = await generateUniquePermalink(title)

    const post = await db.post.create({
      data: {
        title: title || '',
        permalink,
        content: content || '',
        blogImg: blogImg || '',
        videoLink: videoLink || '',
        type: 'Blog',
        status: status || 'Draft',
        authorId: user.id,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Patient post create error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
