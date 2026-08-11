import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export const BUCKET = 'medical-docs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const doc = await db.medicalDocument.findUnique({
      where: { id },
    })

    if (!doc || doc.patientId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!doc.fileUrl || !doc.fileName) {
      return NextResponse.json(
        { error: 'No file attached to this document' },
        { status: 404 }
      )
    }

    // For Supabase Storage URLs, redirect the client to the public URL
    // Supabase Storage handles serving the file with proper content-type
    if (doc.fileUrl.startsWith('http')) {
      return NextResponse.json({
        url: doc.fileUrl,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
      })
    }

    // Fallback for any local paths (should not happen after migration)
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    )
  }
}
