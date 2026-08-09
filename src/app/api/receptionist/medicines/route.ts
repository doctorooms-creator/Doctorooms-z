import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { userId: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const where = {
      userId: doctor.userId,
      ...(search
        ? { name: { contains: search } }
        : {}),
    }

    const medicines = await db.doctorMedicine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ medicines })
  } catch (error) {
    console.error('Receptionist medicines list error:', error)
    return NextResponse.json({ error: 'Failed to load medicines' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { userId: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, morning, afternoon, evening, dose, tab, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Medicine name is required' }, { status: 400 })
    }

    const medicine = await db.doctorMedicine.create({
      data: {
        userId: doctor.userId,
        createdById: user.id,
        name: name.trim(),
        morning: morning || '',
        afternoon: afternoon || '',
        evening: evening || '',
        dose: dose || '',
        tab: typeof tab === 'number' ? tab : 1,
        description: description || '',
        status: 'Active',
      },
    })

    return NextResponse.json(medicine, { status: 201 })
  } catch (error) {
    console.error('Receptionist medicine create error:', error)
    return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 })
  }
}
