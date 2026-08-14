import { requireRole, requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { admissionId, dietType, mealType, instructions, startDate, endDate } = body

    if (!admissionId || !dietType || !mealType) {
      return NextResponse.json(
        { error: 'admissionId, dietType, and mealType are required' },
        { status: 400 }
      )
    }

    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { hospitalId: true, status: true },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }
    if (admission.status !== 'Admitted') {
      return NextResponse.json({ error: 'Patient is not currently admitted' }, { status: 400 })
    }

    const diet = await db.dietOrder.create({
      data: {
        admissionId,
        hospitalId: admission.hospitalId,
        orderedById: doctor.id,
        dietType,
        mealType,
        instructions: instructions || '',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: 'Active',
      },
    })

    return NextResponse.json({ diet: { id: diet.id } }, { status: 201 })
  } catch (error) {
    console.error('Diet order POST error:', error)
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
    const status = searchParams.get('status')

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { admissionId }
    if (status) where.status = status

    const diets = await db.dietOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      diets: diets.map((d) => ({
        id: d.id,
        admissionId: d.admissionId,
        hospitalId: d.hospitalId,
        orderedById: d.orderedById,
        dietType: d.dietType,
        mealType: d.mealType,
        instructions: d.instructions,
        startDate: d.startDate.toISOString(),
        endDate: d.endDate?.toISOString() || null,
        status: d.status,
        stoppedBy: d.stoppedBy,
        stoppedAt: d.stoppedAt?.toISOString() || null,
        stoppedReason: d.stoppedReason,
        createdAt: d.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Diet orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
