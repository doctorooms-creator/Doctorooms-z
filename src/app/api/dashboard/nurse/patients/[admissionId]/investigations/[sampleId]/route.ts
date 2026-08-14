import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string; sampleId: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { admissionId, sampleId } = await params
    const body = await req.json()
    const { status, remarks } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      Collected: ['SentToLab'],
      SentToLab: ['Reported'],
      Reported: ['Filed'],
    }

    // Get current sample
    const existing = await db.sampleCollection.findUnique({
      where: { id: sampleId },
    })

    if (!existing || existing.admissionId !== admissionId) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
    }

    // Check if the transition is valid
    const allowed = validTransitions[existing.status]
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid transition from '${existing.status}' to '${status}'` },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = { status }
    if (status === 'SentToLab') {
      updateData.sentToLabAt = new Date()
    }
    if (remarks !== undefined) {
      updateData.remarks = remarks
    }

    const updated = await db.sampleCollection.update({
      where: { id: sampleId },
      data: updateData,
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        nurse: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    return NextResponse.json({
      sample: {
        id: updated.id,
        testName: updated.testName,
        sampleType: updated.sampleType,
        status: updated.status,
        collectedAt: updated.collectedAt?.toISOString() || null,
        sentToLabAt: updated.sentToLabAt?.toISOString() || null,
        remarks: updated.remarks,
        createdAt: updated.createdAt.toISOString(),
        doctorName: updated.doctor?.user?.name || '',
        nurseName: updated.nurse?.user?.name || '',
      },
    })
  } catch (error) {
    console.error('Update sample status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
