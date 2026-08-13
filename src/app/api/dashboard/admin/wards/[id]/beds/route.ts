import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_BED_TYPES = ['General', 'SemiPrivate', 'Private', 'ICU_Ventilator', 'ICU_NonVentilator']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: wardId } = await params

    // Verify ward exists
    const ward = await db.ward.findUnique({ where: { id: wardId } })
    if (!ward) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    const beds = await db.bed.findMany({
      where: { wardId },
      orderBy: { bedNumber: 'asc' },
      include: {
        admission: {
          select: {
            id: true,
            patientName: true,
            admissionNo: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({
      beds: beds.map((b) => ({
        id: b.id,
        wardId: b.wardId,
        bedNumber: b.bedNumber,
        bedType: b.bedType,
        dailyRate: b.dailyRate,
        status: b.status,
        admission: b.admission
          ? {
              id: b.admission.id,
              patientName: b.admission.patientName,
              admissionNo: b.admission.admissionNo,
              status: b.admission.status,
            }
          : null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      total: beds.length,
    })
  } catch (error) {
    console.error('Admin beds list error:', error)
    return NextResponse.json({ error: 'Failed to load beds' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: wardId } = await params
    const body = await request.json()
    const { bedNumber, bedType, dailyRate } = body

    if (!bedNumber) {
      return NextResponse.json({ error: 'bedNumber is required' }, { status: 400 })
    }

    if (bedType && !VALID_BED_TYPES.includes(bedType)) {
      return NextResponse.json({ error: 'Invalid bedType' }, { status: 400 })
    }

    // Verify ward exists
    const ward = await db.ward.findUnique({ where: { id: wardId } })
    if (!ward) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    // Check for duplicate bed number in same ward
    const existingBed = await db.bed.findFirst({
      where: { wardId, bedNumber },
    })
    if (existingBed) {
      return NextResponse.json(
        { error: 'Bed with this number already exists in this ward' },
        { status: 400 }
      )
    }

    const bed = await db.bed.create({
      data: {
        wardId,
        bedNumber,
        bedType: bedType || 'General',
        dailyRate: dailyRate || 0,
        status: 'Available',
      },
    })

    return NextResponse.json({ bed }, { status: 201 })
  } catch (error) {
    console.error('Admin create bed error:', error)
    return NextResponse.json({ error: 'Failed to create bed' }, { status: 500 })
  }
}
