import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { stat } from 'fs/promises'

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

    // Fetch document and verify ownership
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

    // Resolve the file path from the stored fileUrl (e.g., /uploads/documents/{filename})
    const diskPath = join(process.cwd(), doc.fileUrl)

    if (!existsSync(diskPath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      )
    }

    const fileStat = await stat(diskPath)
    const fileStream = createReadStream(diskPath)

    // Determine content type
    const contentType = doc.mimeType || 'application/octet-stream'

    return new NextResponse(fileStream as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    )
  }
}
