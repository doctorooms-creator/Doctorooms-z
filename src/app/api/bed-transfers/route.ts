import { requireRole, requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'hospital')
    if (!user) {
      const receptionist = await requireRole(req, 'receptionist')
      if (!receptionist) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      let effectiveUser = receptionist
    } else {
      let effectiveUser = user
    }

    const body = await req.json()
    const { admissionId, toBedId, transferReason } = body

    if (!admissionId || !toBedId) {
      return NextResponse.json({ error: 'admissionId and toBedId are required' }, { status: 400 })
    }

    // Get admission with current bed
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: { bed: { select: { id: true, wardId: true, bedNumber: true, status: true } } },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }
    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not currently admitted' }, { status: 400 })
    }

    // Check target bed is available
    const targetBed = await db.bed.findUnique({
      where: { id: toBedId },
      include: { ward: { select: { id: true, name: true, hospitalId: true } } },
    })
    if (!targetBed) {
      return NextResponse.json({ error: 'Target bed not found' }, { status: 404 })
    }
    if (targetBed.status !== 'Available') {
      return NextResponse.json({ error: 'Target bed is not available' }, { status: 400 })
    }

    // Transfer in transaction
    await db.$transaction(async (tx) => {
      // Free old bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'Available' },
      })

      // Occupy new bed
      await tx.bed.update({
        where: { id: toBedId },
        data: { status: 'Occupied' },
      })

      // Update admission bed and ward
      await tx.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          bedId: toBedId,
          wardId: targetBed.wardId,
        },
      })

      // Create bed transfer record
      await tx.bedTransfer.create({
        data: {
          admissionId,
          fromBedId: admission.bedId,
          toBedId,
          fromWardId: admission.bed.wardId,
          toWardId: targetBed.wardId,
          transferReason: transferReason || '',
          transferredBy: effectiveUser.id,
        },
      })
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Bed transfer POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const admissionId = searchParams.get('admissionId')

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }

    const transfers = await db.bedTransfer.findMany({
      where: { admissionId },
      orderBy: { transferDate: 'desc' },
      include: {
        fromBed: { select: { bedNumber: true, bedType: true, ward: { select: { name: true } } } },
        toBed: { select: { bedNumber: true, bedType: true, ward: { select: { name: true } } } },
      },
    })

    return NextResponse.json({
      transfers: transfers.map((t) => ({
        id: t.id,
        admissionId: t.admissionId,
        fromBedId: t.fromBedId,
        fromBedNumber: t.fromBed.bedNumber,
        fromBedType: t.fromBed.bedType,
        fromWardName: t.fromBed.ward.name,
        toBedId: t.toBedId,
        toBedNumber: t.toBed.bedNumber,
        toBedType: t.toBed.bedType,
        toWardName: t.toBed.ward.name,
        transferDate: t.transferDate.toISOString(),
        transferReason: t.transferReason,
        transferredBy: t.transferredBy,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Bed transfers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
