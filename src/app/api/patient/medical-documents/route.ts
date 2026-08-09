import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')

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

    const body = await req.json()
    const { title, category, fileUrl, fileName, fileSize, mimeType, description } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 })
    }

    const document = await db.medicalDocument.create({
      data: {
        patientId: user.id,
        title,
        category: category || 'Other',
        fileUrl: fileUrl || '',
        fileName: fileName || '',
        fileSize: fileSize || 0,
        mimeType: mimeType || '',
        description: description || '',
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Medical document upload error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
