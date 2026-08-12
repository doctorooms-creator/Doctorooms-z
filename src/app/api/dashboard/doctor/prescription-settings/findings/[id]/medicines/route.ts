import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Verify the finding belongs to this doctor
    const finding = await db.findingsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!finding || finding.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    const linkedMedicines = await db.findingsMedicine.findMany({
      where: { findingId: id },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            dose: true,
            morning: true,
            afternoon: true,
            evening: true,
            tab: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Parse dose JSON arrays for medicines
    const parsed = linkedMedicines.map((fm) => {
      let doseArray: string[] = []
      try {
        const p = JSON.parse(fm.medicine.dose)
        if (Array.isArray(p)) doseArray = p
      } catch {
        if (fm.medicine.dose && fm.medicine.dose !== '[]') {
          doseArray = [fm.medicine.dose]
        }
      }
      return {
        ...fm,
        medicine: { ...fm.medicine, doseArray },
      }
    })

    return NextResponse.json({ medicines: parsed })
  } catch (error) {
    console.error('Get finding medicines error:', error)
    return NextResponse.json({ error: 'Failed to load linked medicines' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Verify the finding belongs to this doctor
    const finding = await db.findingsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!finding || finding.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    const body = await req.json()
    const { medicineId, dose, morning, afternoon, evening, tab, description } = body

    if (!medicineId) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    // Verify medicine belongs to this doctor
    const medExists = await db.doctorMedicine.findFirst({
      where: { id: medicineId, userId: doctor.id },
    })
    if (!medExists) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 400 })
    }

    // Check if already linked
    const existing = await db.findingsMedicine.findUnique({
      where: { findingId_medicineId: { findingId: id, medicineId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Medicine already linked to this finding' }, { status: 409 })
    }

    const linked = await db.findingsMedicine.create({
      data: {
        findingId: id,
        medicineId,
        dose: typeof dose === 'string' ? dose.trim() : '',
        morning: typeof morning === 'number' ? Math.max(0, Math.round(morning)) : 0,
        afternoon: typeof afternoon === 'number' ? Math.max(0, Math.round(afternoon)) : 0,
        evening: typeof evening === 'number' ? Math.max(0, Math.round(evening)) : 0,
        tab: typeof tab === 'number' ? Math.max(0, Math.round(tab)) : 0,
        description: typeof description === 'string' ? description.trim() : '',
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            dose: true,
            morning: true,
            afternoon: true,
            evening: true,
            tab: true,
            description: true,
          },
        },
      },
    })

    // Parse dose for the response
    let doseArray: string[] = []
    try {
      const p = JSON.parse(linked.medicine.dose)
      if (Array.isArray(p)) doseArray = p
    } catch {
      if (linked.medicine.dose && linked.medicine.dose !== '[]') {
        doseArray = [linked.medicine.dose]
      }
    }

    return NextResponse.json({ linkedMedicine: { ...linked, medicine: { ...linked.medicine, doseArray } } }, { status: 201 })
  } catch (error) {
    console.error('Link medicine error:', error)
    return NextResponse.json({ error: 'Failed to link medicine' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Verify the finding belongs to this doctor
    const finding = await db.findingsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!finding || finding.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    const body = await req.json()
    const { medicineId, dose, morning, afternoon, evening, tab, description } = body

    if (!medicineId) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    const existing = await db.findingsMedicine.findUnique({
      where: { findingId_medicineId: { findingId: id, medicineId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Linked medicine not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (dose !== undefined) updateData.dose = typeof dose === 'string' ? dose.trim() : ''
    if (morning !== undefined) updateData.morning = Math.max(0, Math.round(morning))
    if (afternoon !== undefined) updateData.afternoon = Math.max(0, Math.round(afternoon))
    if (evening !== undefined) updateData.evening = Math.max(0, Math.round(evening))
    if (tab !== undefined) updateData.tab = Math.max(0, Math.round(tab))
    if (description !== undefined) updateData.description = typeof description === 'string' ? description.trim() : ''

    const updated = await db.findingsMedicine.update({
      where: { findingId_medicineId: { findingId: id, medicineId } },
      data: updateData,
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            dose: true,
            morning: true,
            afternoon: true,
            evening: true,
            tab: true,
            description: true,
          },
        },
      },
    })

    // Parse dose for the response
    let doseArray: string[] = []
    try {
      const p = JSON.parse(updated.medicine.dose)
      if (Array.isArray(p)) doseArray = p
    } catch {
      if (updated.medicine.dose && updated.medicine.dose !== '[]') {
        doseArray = [updated.medicine.dose]
      }
    }

    return NextResponse.json({ linkedMedicine: { ...updated, medicine: { ...updated.medicine, doseArray } } })
  } catch (error) {
    console.error('Update linked medicine error:', error)
    return NextResponse.json({ error: 'Failed to update linked medicine' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Verify the finding belongs to this doctor
    const finding = await db.findingsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!finding || finding.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
    }

    // Get medicineId from query or body
    const { searchParams } = new URL(req.url)
    const medicineId = searchParams.get('medicineId') || ''

    if (!medicineId) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    await db.findingsMedicine.delete({
      where: { findingId_medicineId: { findingId: id, medicineId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unlink medicine error:', error)
    return NextResponse.json({ error: 'Failed to unlink medicine' }, { status: 500 })
  }
}
