import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const schedule = await db.otSchedule.findUnique({
      where: { id },
      include: {
        ot: { select: { id: true, name: true, otType: true, floorNo: true, status: true } },
        surgeon: { include: { user: { select: { name: true } } } },
        admission: {
          select: {
            id: true, admissionNo: true, patientName: true, bedId: true, wardId: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('OT schedule GET detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, actualStartTime, actualEndTime, cancellationReason } = body

    const validStatuses = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'Postponed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.otSchedule.findUnique({
      where: { id },
      include: { ot: { select: { id: true, status: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (actualStartTime !== undefined) updateData.actualStartTime = actualStartTime
    if (actualEndTime !== undefined) updateData.actualEndTime = actualEndTime
    if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason

    const updated = await db.otSchedule.update({
      where: { id },
      data: updateData,
    })

    // Update OT availability when schedule completes or cancels
    if (status === 'Completed' || status === 'Cancelled' || status === 'Postponed') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const activeSchedules = await db.otSchedule.count({
        where: {
          otId: existing.otId,
          status: { in: ['Scheduled', 'InProgress'] },
          scheduledDate: { gte: today, lt: tomorrow },
          id: { not: id },
        },
      })

      if (activeSchedules === 0) {
        await db.operationTheater.update({
          where: { id: existing.otId },
          data: { status: 'Available' },
        })
      }
    }

    // When starting, mark OT as Occupied
    if (status === 'InProgress') {
      await db.operationTheater.update({
        where: { id: existing.otId },
        data: { status: 'Occupied' },
      })
    }

    return NextResponse.json({ schedule: { id: updated.id, status: updated.status } })
  } catch (error) {
    console.error('OT schedule PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
