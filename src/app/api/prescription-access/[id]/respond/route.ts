import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

/**
 * POST /api/prescription-access/[id]/respond
 * Patient accepts or rejects a prescription access request.
 * Body: { action: 'approve' | 'reject' }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body as { action?: string }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Fetch the request and verify it belongs to this patient
    const accessRequest = await db.prescriptionAccessRequest.findUnique({
      where: { id },
      include: {
        requestingDoctor: {
          include: { user: { select: { name: true, id: true } } },
        },
        originalDoctor: {
          include: { user: { select: { name: true } } },
        },
        prescription: {
          select: { disease: true, patientName: true },
        },
      },
    })

    if (!accessRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (accessRequest.patientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (accessRequest.status !== 'Pending') {
      return NextResponse.json(
        { error: `Request is already ${accessRequest.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected'

    await db.prescriptionAccessRequest.update({
      where: { id },
      data: { status: newStatus },
    })

    // Notify the requesting doctor
    await db.notification.create({
      data: {
        userId: accessRequest.requestingDoctor.user.id,
        title: `Prescription Access ${newStatus}`,
        message:
          action === 'approve'
            ? `Patient ${accessRequest.prescription.patientName} has approved your request to view their prescription (by Dr. ${accessRequest.originalDoctor.user.name}). You can now view it in your "Shared Prescriptions" tab.`
            : `Patient ${accessRequest.prescription.patientName} has rejected your request to view their prescription (by Dr. ${accessRequest.originalDoctor.user.name}).`,
        status: 'UNREAD',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Request ${newStatus.toLowerCase()} successfully`,
      newStatus,
    })
  } catch (error) {
    console.error('Prescription access respond error:', error)
    return NextResponse.json({ error: 'Failed to respond to request' }, { status: 500 })
  }
}

/**
 * DELETE /api/prescription-access/[id]/respond
 * Patient revokes previously approved access.
 */
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

    const accessRequest = await db.prescriptionAccessRequest.findUnique({
      where: { id },
      include: {
        requestingDoctor: {
          include: { user: { select: { name: true, id: true } } },
        },
        prescription: {
          select: { patientName: true },
        },
      },
    })

    if (!accessRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (accessRequest.patientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (accessRequest.status !== 'Approved') {
      return NextResponse.json(
        { error: 'Only approved access can be revoked' },
        { status: 400 }
      )
    }

    await db.prescriptionAccessRequest.update({
      where: { id },
      data: { status: 'Revoked' },
    })

    // Notify the requesting doctor
    await db.notification.create({
      data: {
        userId: accessRequest.requestingDoctor.user.id,
        title: 'Prescription Access Revoked',
        message: `Patient ${accessRequest.prescription.patientName} has revoked your access to their prescription.`,
        status: 'UNREAD',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully',
    })
  } catch (error) {
    console.error('Prescription access revoke error:', error)
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }
}
