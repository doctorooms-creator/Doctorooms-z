import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_WARD_TYPES = ['ICU', 'General', 'Private', 'SemiPrivate', 'PostOp', 'Emergency', 'Maternity']
const VALID_STATUSES = ['Active', 'Inactive', 'Maintenance']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const ward = await db.ward.findUnique({
      where: { id },
      include: {
        hospital: {
          select: { id: true, hospitalName: true },
        },
        beds: {
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

    if (!ward) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    const totalBeds = ward.beds.length || ward.totalBeds
    const occupiedBeds = ward.beds.filter((b) => b.status === 'Occupied').length
    const availableBeds = ward.beds.filter((b) => b.status === 'Available').length

    return NextResponse.json({
      ward: {
        id: ward.id,
        hospitalId: ward.hospitalId,
        hospitalName: ward.hospital.hospitalName,
        name: ward.name,
        nameHi: ward.nameHi,
        wardType: ward.wardType,
        floorNo: ward.floorNo,
        totalBeds,
        nurseRatio: ward.nurseRatio,
        status: ward.status,
        bedCounts: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: availableBeds,
        },
        nurseCount: ward._count.nurses,
        activeAdmissionCount: ward._count.admissions,
        beds: ward.beds.map((b) => ({
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
        createdAt: ward.createdAt,
        updatedAt: ward.updatedAt,
      },
    })
  } catch (error) {
    console.error('Admin ward detail error:', error)
    return NextResponse.json({ error: 'Failed to load ward' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, nameHi, wardType, floorNo, totalBeds, nurseRatio, status } = body

    const existing = await db.ward.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    if (wardType && !VALID_WARD_TYPES.includes(wardType)) {
      return NextResponse.json({ error: 'Invalid wardType' }, { status: 400 })
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const ward = await db.ward.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameHi !== undefined && { nameHi }),
        ...(wardType !== undefined && { wardType }),
        ...(floorNo !== undefined && { floorNo }),
        ...(totalBeds !== undefined && { totalBeds }),
        ...(nurseRatio !== undefined && { nurseRatio }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ ward })
  } catch (error) {
    console.error('Admin update ward error:', error)
    return NextResponse.json({ error: 'Failed to update ward' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const existing = await db.ward.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            admissions: {
              where: { status: 'Admitted' },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }

    if (existing._count.admissions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ward with active admissions' },
        { status: 400 }
      )
    }

    await db.ward.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete ward error:', error)
    return NextResponse.json({ error: 'Failed to delete ward' }, { status: 500 })
  }
}
