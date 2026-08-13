import { requireRole, requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({
      where: { userId: user.id },
      include: { user: { select: { name: true } } },
    })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      wardId,
      shiftDate,
      shiftType,
      toNurseId,
      patientSummaries,
      wardNotes,
      pendingTasks,
    } = body

    if (!wardId || !shiftDate || !shiftType || !toNurseId) {
      return NextResponse.json(
        { error: 'wardId, shiftDate, shiftType, and toNurseId are required' },
        { status: 400 }
      )
    }

    const shiftDateObj = new Date(shiftDate)

    const handover = await db.shiftHandover.create({
      data: {
        hospitalId: nurse.hospitalId,
        wardId,
        shiftDate: shiftDateObj,
        shiftType,
        fromNurseId: nurse.id,
        toNurseId,
        patientSummaries: typeof patientSummaries === 'string' ? patientSummaries : JSON.stringify(patientSummaries || []),
        wardNotes: wardNotes || '',
        pendingTasks: typeof pendingTasks === 'string' ? pendingTasks : JSON.stringify(pendingTasks || []),
      },
    })

    return NextResponse.json({ handover: { id: handover.id } }, { status: 201 })
  } catch (error) {
    console.error('Shift handover POST error:', error)
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
    const wardId = searchParams.get('wardId')
    const shiftDate = searchParams.get('shiftDate')

    const where: Record<string, unknown> = {}
    if (wardId) where.wardId = wardId
    if (shiftDate) {
      const start = new Date(shiftDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      where.shiftDate = { gte: start, lt: end }
    }

    const handovers = await db.shiftHandover.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        fromNurse: { include: { user: { select: { name: true } } } },
        toNurse: { include: { user: { select: { name: true } } } },
        ward: { select: { name: true, wardType: true, floor: true } },
      },
    })

    return NextResponse.json({
      handovers: handovers.map((h) => ({
        id: h.id,
        hospitalId: h.hospitalId,
        wardId: h.wardId,
        wardName: h.ward.name,
        wardType: h.ward.wardType,
        shiftDate: h.shiftDate.toISOString(),
        shiftType: h.shiftType,
        fromNurseId: h.fromNurseId,
        fromNurseName: h.fromNurse.user?.name || '',
        toNurseId: h.toNurseId,
        toNurseName: h.toNurse.user?.name || '',
        patientSummaries: h.patientSummaries,
        wardNotes: h.wardNotes,
        pendingTasks: h.pendingTasks,
        acknowledgedAt: h.acknowledgedAt?.toISOString() || null,
        acknowledgedBy: h.acknowledgedBy,
        createdAt: h.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Shift handovers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
