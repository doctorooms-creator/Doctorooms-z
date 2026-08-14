import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({ where: { userId: user.id } })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    const { id } = await params

    const sample = await db.sampleCollection.findUnique({ where: { id } })
    if (!sample) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
    }
    if (sample.status !== 'Ordered') {
      return NextResponse.json({ error: 'Sample is not in Ordered status' }, { status: 400 })
    }

    const updated = await db.sampleCollection.update({
      where: { id },
      data: {
        status: 'Collected',
        collectedAt: new Date(),
      },
    })

    return NextResponse.json({ sample: { id: updated.id, status: updated.status } })
  } catch (error) {
    console.error('Sample collect PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
