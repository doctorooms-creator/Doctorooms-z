import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: session.user.id },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { userId: pharmacist.doctorId }
    if (search) {
      where.name = { contains: search }
    }

    const medicines = await db.doctorMedicine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ medicines })
  } catch (error) {
    console.error('Pharmacist medicines GET error:', error)
    return NextResponse.json({ error: 'Failed to load medicines' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: session.user.id },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, morning, afternoon, evening, dose, tab, description, status } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Medicine name is required' },
        { status: 400 }
      )
    }

    const medicine = await db.doctorMedicine.create({
      data: {
        name: name.trim(),
        morning: morning || '',
        afternoon: afternoon || '',
        evening: evening || '',
        dose: dose || '',
        tab: tab || 1,
        description: description || '',
        status: status || 'Active',
        userId: pharmacist.doctorId,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ medicine }, { status: 201 })
  } catch (error) {
    console.error('Pharmacist medicine POST error:', error)
    return NextResponse.json({ error: 'Failed to add medicine' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: session.user.id },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, name, morning, afternoon, evening, dose, tab, description, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    // Verify the medicine belongs to this pharmacist's doctor
    const existing = await db.doctorMedicine.findFirst({
      where: { id, userId: pharmacist.doctorId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    const medicine = await db.doctorMedicine.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        morning: morning !== undefined ? morning : undefined,
        afternoon: afternoon !== undefined ? afternoon : undefined,
        evening: evening !== undefined ? evening : undefined,
        dose: dose !== undefined ? dose : undefined,
        tab: tab !== undefined ? tab : undefined,
        description: description !== undefined ? description : undefined,
        status: status !== undefined ? status : undefined,
      },
    })

    return NextResponse.json({ medicine })
  } catch (error) {
    console.error('Pharmacist medicine PUT error:', error)
    return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: session.user.id },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    // Verify the medicine belongs to this pharmacist's doctor
    const existing = await db.doctorMedicine.findFirst({
      where: { id, userId: pharmacist.doctorId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }

    await db.doctorMedicine.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Pharmacist medicine DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 })
  }
}
