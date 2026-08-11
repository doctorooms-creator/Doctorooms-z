import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'documents')

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { patientId: user.id }
    if (category && category !== 'All') {
      where.category = category
    }

    const [documents, categoryCounts] = await Promise.all([
      db.medicalDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      db.medicalDocument.groupBy({
        by: ['category'],
        where: { patientId: user.id },
        _count: { category: true },
      }),
    ])

    const counts = categoryCounts.reduce(
      (acc, c) => {
        acc[c.category] = c._count.category
        return acc
      },
      {} as Record<string, number>
    )

    const total = Object.values(counts).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      documents,
      counts: { All: total, ...counts },
    })
  } catch (error) {
    console.error('Medical documents list error:', error)
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const category = (formData.get('category') as string | null) || 'Other'
    const description = (formData.get('description') as string | null) || ''

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    let fileUrl = ''
    let fileName = ''
    let fileSize = 0
    let mimeType = ''

    // Handle real file upload
    if (file && file.size > 0) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.' },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum allowed size is 5MB.' },
          { status: 400 }
        )
      }

      // Generate safe filename: {userId}_{timestamp}_{originalName}
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const diskFilename = `${user.id}_${timestamp}_${safeName}`

      // Ensure upload directory exists
      await mkdir(UPLOAD_DIR, { recursive: true })

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer())
      const filePath = join(UPLOAD_DIR, diskFilename)
      await writeFile(filePath, buffer)

      // Store the disk-relative path in fileUrl for the download route to use
      fileUrl = `/uploads/documents/${diskFilename}`
      fileName = file.name
      fileSize = file.size
      mimeType = file.type
    }

    const document = await db.medicalDocument.create({
      data: {
        patientId: user.id,
        title: title.trim(),
        category,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        description,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Medical document upload error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
