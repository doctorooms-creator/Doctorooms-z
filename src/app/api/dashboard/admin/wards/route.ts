import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_WARD_TYPES = ['ICU', 'General', 'Private', 'SemiPrivate', 'PostOp', 'Emergency', 'Maternity']

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId') || ''

    const where: Record<string, unknown> = {}
    if (hospitalId) {
      where.hospitalId = hospitalId
    }

    const wards = await db.ward.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: {
          select: { id: true, hospitalName: true },
        },
        beds: {
          select: { id: true, status: true },
        },
        _count: {
          select: {
            nurses: true,
            admissions: {
              where: { status: 'Admitted' },
            },
          },
        },
      },
    })

    const result = wards.map((w) => {
      const totalBeds = w.beds.length || w.totalBeds
      const occupiedBeds = w.beds.filter((b) => b.status === 'Occupied').length
      const availableBeds = w.beds.filter((b) => b.status === 'Available').length
      const reservedBeds = w.beds.filter((b) => b.status === 'Reserved').length
      const maintenanceBeds = w.beds.filter((b) => b.status === 'Maintenance').length
      return {
        id: w.id,
        hospitalId: w.hospitalId,
        hospitalName: w.hospital.hospitalName,
        name: w.name,
        nameHi: w.nameHi,
        wardType: w.wardType,
        floorNo: w.floorNo,
        totalBeds,
        nurseRatio: w.nurseRatio,
        status: w.status,
        bedCounts: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: availableBeds,
          reserved: reservedBeds,
          maintenance: maintenanceBeds,
        },
        nurseCount: w._count.nurses,
        activeAdmissionCount: w._count.admissions,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }
    })

    return NextResponse.json({ wards: result, total: result.length })
  } catch (error) {
    console.error('Admin wards list error:', error)
    return NextResponse.json({ error: 'Failed to load wards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { hospitalId, name, nameHi, wardType, floorNo, totalBeds, nurseRatio } = body

    if (!hospitalId || !name) {
      return NextResponse.json({ error: 'hospitalId and name are required' }, { status: 400 })
    }

    if (wardType && !VALID_WARD_TYPES.includes(wardType)) {
      return NextResponse.json({ error: 'Invalid wardType' }, { status: 400 })
    }

    // Verify hospital exists
    const hospital = await db.hospital.findUnique({ where: { id: hospitalId } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const ward = await db.ward.create({
      data: {
        hospitalId,
        name,
        nameHi: nameHi || '',
        wardType: wardType || 'General',
        floorNo: floorNo || '',
        totalBeds: totalBeds || 0,
        nurseRatio: nurseRatio || 6,
        status: 'Active',
      },
    })

    return NextResponse.json({ ward }, { status: 201 })
  } catch (error) {
    console.error('Admin create ward error:', error)
    return NextResponse.json({ error: 'Failed to create ward' }, { status: 500 })
  }
}
