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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

    const post = await db.post.findUnique({ where: { id } })

    if (!post || post.authorId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Receptionist post get error:', error)
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

    const body = await req.json()
    const { title, content, blogImg, videoLink, status } = body

    const existing = await db.post.findUnique({ where: { id } })

    if (!existing || existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updateData: Record<string, string> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (blogImg !== undefined) updateData.blogImg = blogImg
    if (status !== undefined) updateData.status = status

    // Regenerate permalink if title changed
    if (title !== undefined && title !== existing.title) {
      updateData.permalink = await generateUniquePermalink(title)
    }

    const updated = await db.post.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Receptionist post update error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

    const post = await db.post.findUnique({ where: { id } })

    if (!post || post.authorId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.post.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Receptionist post delete error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
