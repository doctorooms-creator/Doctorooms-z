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

    const where: Prisma.DoctorMedicineWhereInput = {
      userId: doctor.id,
      status: statusFilter,
    }

    if (search) {
      where.name = { contains: search }
    }

    const medicines = await db.doctorMedicine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ medicines })
  } catch (error) {
    console.error('Doctor medicines GET error:', error)
    return NextResponse.json({ error: 'Failed to load medicines' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, morning, afternoon, evening, dose, tab, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Medicine name is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const medicine = await db.doctorMedicine.create({
      data: {
        name: name.trim(),
        morning: morning || '',
        afternoon: afternoon || '',
        evening: evening || '',
        dose: dose || '',
        tab: typeof tab === 'number' ? tab : 1,
        description: description || '',
        userId: doctor.id,
        createdById: user.id,
        status: 'Active',
      },
    })

    return NextResponse.json({ medicine }, { status: 201 })
  } catch (error) {
    console.error('Create medicine error:', error)
    return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 })
  }
}
