import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { deleteFromStorage } from '@/lib/supabase'

const BUCKET = 'medical-docs'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const contentType = req.headers.get('content-type') || ''

    let updateData: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const title = formData.get('title') as string | null
      const category = formData.get('category') as string | null
      const description = formData.get('description') as string | null

      if (title !== null) updateData.title = title
      if (category !== null) updateData.category = category
      if (description !== null) updateData.description = description
    } else {
      const body = await req.json()
      const { title, category, description } = body
      if (title !== undefined) updateData.title = title
      if (category !== undefined) updateData.category = category
      if (description !== undefined) updateData.description = description
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const doc = await db.medicalDocument.findUnique({ where: { id } })
    if (!doc || doc.patientId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await db.medicalDocument.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Document update error:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doc = await db.medicalDocument.findUnique({ where: { id } })
    if (!doc || doc.patientId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete file from Supabase Storage
    if (doc.fileUrl) {
      try {
        await deleteFromStorage(BUCKET, doc.fileUrl)
      } catch {
        // Ignore if file cannot be deleted
      }
    }

    await db.medicalDocument.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
