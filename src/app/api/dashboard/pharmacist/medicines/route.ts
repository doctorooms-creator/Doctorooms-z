import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

/**
 * Helper to resolve medicine scope for a pharmacist.
 * Clinic mode: medicines belong to pharmacist.doctorId
 * Hospital mode: medicines belong to any doctor in the hospital
 */
async function getMedicineScope(pharmacist: { doctorId: string | null; hospitalId: string | null }) {
  const isHospitalMode = !!pharmacist.hospitalId && !pharmacist.doctorId

  if (isHospitalMode) {
    const dhLinks = await db.doctorHospital.findMany({
      where: { hospitalId: pharmacist.hospitalId, status: 'Active' },
      select: { doctorId: true },
    })
    const doctorIds = dhLinks.map(d => d.doctorId)
    return { isHospitalMode, where: { userId: { in: doctorIds } } }
  }

  return { isHospitalMode: false, where: { userId: pharmacist.doctorId! } }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'pharmacist')

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const { where } = await getMedicineScope(pharmacist)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'pharmacist')

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
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

    // In hospital mode, medicines are scoped to the first hospital doctor or the pharmacist user
    const scope = await getMedicineScope(pharmacist)
    const medicineUserId = scope.isHospitalMode ? user.id : pharmacist.doctorId!

    const medicine = await db.doctorMedicine.create({
      data: {
        name: name.trim(),
        morning: morning || '',
        afternoon: afternoon || '',
        evening: evening || '',
        dose: dose || '',
        tab: tab ?? 1,
        description: description || '',
        status: status || 'Active',
        userId: medicineUserId,
        createdById: user.id,
      },
    })

    return NextResponse.json({ medicine }, { status: 201 })
  } catch (error) {
    console.error('Pharmacist medicine POST error:', error)
    return NextResponse.json({ error: 'Failed to add medicine' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(request, 'pharmacist')

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, name, morning, afternoon, evening, dose, tab, description, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    // Verify the medicine belongs to this pharmacist's scope
    const { where } = await getMedicineScope(pharmacist)
    const existing = await db.doctorMedicine.findFirst({
      where: { id, ...where },
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole(request, 'pharmacist')

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })
    }

    // Verify the medicine belongs to this pharmacist's scope
    const { where } = await getMedicineScope(pharmacist)
    const existing = await db.doctorMedicine.findFirst({
      where: { id, ...where },
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
