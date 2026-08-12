import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const statusFilter = searchParams.get('status') || 'Active'

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const where: Prisma.LabelMasterWhereInput = {
      doctorId: doctor.id,
    }

    if (statusFilter !== 'All') {
      where.status = statusFilter
    }

    if (search) {
      where.OR = [
        { label: { contains: search } },
        { labelEn: { contains: search } },
      ]
    }

    const labels = await db.labelMaster.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ labels })
  } catch (error) {
    console.error('Labels GET error:', error)
    return NextResponse.json({ error: 'Failed to load labels' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { label, labelEn, unit, showUnit, status } = body

    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const created = await db.labelMaster.create({
      data: {
        label: label.trim(),
        labelEn: typeof labelEn === 'string' ? labelEn.trim() : '',
        unit: typeof unit === 'string' ? unit.trim() : '',
        showUnit: typeof showUnit === 'boolean' ? showUnit : true,
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        doctorId: doctor.id,
        createdById: user.id,
      },
    })

    return NextResponse.json({ label: created }, { status: 201 })
  } catch (error) {
    console.error('Create label error:', error)
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}
