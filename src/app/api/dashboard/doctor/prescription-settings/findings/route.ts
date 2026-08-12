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

    const where: Prisma.FindingsMasterWhereInput = {
      doctorId: doctor.id,
    }

    if (statusFilter !== 'All') {
      where.status = statusFilter
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
      ]
    }

    const findings = await db.findingsMaster.findMany({
      where,
      include: {
        medicines: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse dose JSON arrays for medicines
    const parsed = findings.map((f) => ({
      ...f,
      medicines: f.medicines.map((fm) => {
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
      }),
    }))

    return NextResponse.json({ findings: parsed })
  } catch (error) {
    console.error('Findings GET error:', error)
    return NextResponse.json({ error: 'Failed to load findings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, nameEn, status } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Finding name is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const finding = await db.findingsMaster.create({
      data: {
        name: name.trim(),
        nameEn: typeof nameEn === 'string' ? nameEn.trim() : '',
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        doctorId: doctor.id,
        createdById: user.id,
      },
    })

    return NextResponse.json({ finding }, { status: 201 })
  } catch (error) {
    console.error('Create finding error:', error)
    return NextResponse.json({ error: 'Failed to create finding' }, { status: 500 })
  }
}
