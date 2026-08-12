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

    // Parse dose JSON arrays and return doseArray alongside raw dose
    const parsed = medicines.map((m) => {
      let doseArray: string[] = []
      try {
        const parsed = JSON.parse(m.dose)
        if (Array.isArray(parsed)) {
          doseArray = parsed
        }
      } catch {
        // legacy single-string dose: wrap it into an array
        if (m.dose && m.dose !== '[]') {
          doseArray = [m.dose]
        }
      }
      return {
        ...m,
        doseArray,
      }
    })

    return NextResponse.json({ medicines: parsed })
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
    const { name, doseArray, morning, afternoon, evening, tab, description } = body

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

    // doseArray is a string[] from the frontend — store as JSON string
    const safeDoseArray = Array.isArray(doseArray) ? doseArray.map(String) : []
    const doseStr = JSON.stringify(safeDoseArray)

    const medicine = await db.doctorMedicine.create({
      data: {
        name: name.trim(),
        morning: typeof morning === 'number' ? Math.max(0, Math.round(morning)) : 0,
        afternoon: typeof afternoon === 'number' ? Math.max(0, Math.round(afternoon)) : 0,
        evening: typeof evening === 'number' ? Math.max(0, Math.round(evening)) : 0,
        dose: doseStr,
        tab: typeof tab === 'number' ? Math.max(1, Math.round(tab)) : 1,
        description: typeof description === 'string' ? description.trim() : '',
        userId: doctor.id,
        createdById: user.id,
        status: 'Active',
      },
    })

    // Return parsed version
    let parsedDoseArray: string[] = []
    try {
      const p = JSON.parse(medicine.dose)
      if (Array.isArray(p)) parsedDoseArray = p
    } catch { /* ignore */ }

    return NextResponse.json({ medicine: { ...medicine, doseArray: parsedDoseArray } }, { status: 201 })
  } catch (error) {
    console.error('Create medicine error:', error)
    return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 })
  }
}
