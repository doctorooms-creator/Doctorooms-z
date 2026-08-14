import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { emitNotification, hospitalRoom, roleRoom } from '@/lib/emit-notification'
import { validateBody, verifySchema } from '@/lib/validations'

// PUT /api/lab-reports/[id]/verify
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'lab_technician')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.labReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'ResultEntered') {
      return NextResponse.json({ error: 'Report must be in ResultEntered status' }, { status: 400 })
    }

    const body = await request.json()
    const v = validateBody(verifySchema, body)
    if (!v.success) return v.error
    const { notes } = v.data

    // Get lab technician profile
    const tech = await db.labTechnician.findUnique({ where: { userId: user.id } })
    if (!tech) {
      return NextResponse.json({ error: 'Lab technician profile not found' }, { status: 404 })
    }

    const updated = await db.labReport.update({
      where: { id },
      data: {
        status: 'Verified',
        verifiedAt: new Date(),
        verifiedById: tech.id,
      },
    })

    emitNotification('lab-result-ready', [roleRoom('doctor'), hospitalRoom(report.hospitalId)], {
      id: updated.id,
      title: 'Lab Report Verified',
      message: `Lab report verified for ${report.patientName}`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ labReport: updated })
  } catch (error) {
    console.error('Verify report error:', error)
    return NextResponse.json({ error: 'Failed to verify report' }, { status: 500 })
  }
}
