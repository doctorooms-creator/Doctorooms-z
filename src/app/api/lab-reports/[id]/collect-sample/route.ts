import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireAuth } from '@/lib/api-auth'
import { emitNotification, roleRoom } from '@/lib/emit-notification'
import { validateBody, collectSampleSchema } from '@/lib/validations'

// PUT /api/lab-reports/[id]/collect-sample
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['lab_technician', 'nurse'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.labReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'Ordered') {
      return NextResponse.json({ error: 'Report is not in Ordered status' }, { status: 400 })
    }

    const body = await request.json()
    const v = validateBody(collectSampleSchema, body)
    if (!v.success) return v.error
    const { collectedBy, notes } = v.data

    const updated = await db.labReport.update({
      where: { id },
      data: {
        status: 'SampleCollected',
        sampleCollectedAt: new Date(),
        sampleCollectedBy: user.id,
      },
    })

    emitNotification('sample-ordered', [roleRoom('lab_technician')], {
      id: updated.id,
      title: 'Sample Collected',
      message: 'Sample collected for lab report',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ labReport: updated })
  } catch (error) {
    console.error('Collect sample error:', error)
    return NextResponse.json({ error: 'Failed to collect sample' }, { status: 500 })
  }
}
