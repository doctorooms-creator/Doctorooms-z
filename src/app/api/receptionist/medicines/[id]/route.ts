import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

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

    const medicine = await db.doctorMedicine.findUnique({ where: { id } })

    if (!medicine || medicine.userId !== doctor.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(medicine)
  } catch (error) {
    console.error('Receptionist medicine get error:', error)
    return NextResponse.json({ error: 'Failed to load medicine' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

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

    const existing = await db.doctorMedicine.findUnique({ where: { id } })

    if (!existing || existing.userId !== doctor.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, morning, afternoon, evening, dose, tab, description } = body

    const updateData: Record<string, string | number> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (morning !== undefined) updateData.morning = morning
    if (afternoon !== undefined) updateData.afternoon = afternoon
    if (evening !== undefined) updateData.evening = evening
    if (dose !== undefined) updateData.dose = dose
    if (tab !== undefined) updateData.tab = tab
    if (description !== undefined) updateData.description = description

    const updated = await db.doctorMedicine.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Receptionist medicine update error:', error)
    return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

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

    const existing = await db.doctorMedicine.findUnique({ where: { id } })

    if (!existing || existing.userId !== doctor.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.doctorMedicine.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Receptionist medicine delete error:', error)
    return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 })
  }
}
