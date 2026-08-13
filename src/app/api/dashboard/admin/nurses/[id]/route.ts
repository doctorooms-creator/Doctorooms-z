import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_QUALIFICATIONS = ['GNM', 'BSc Nursing', 'ANM']
const VALID_DESIGNATIONS = ['Staff Nurse', 'Sister', 'Nursing Incharge']
const VALID_SHIFTS = ['Morning', 'Evening', 'Night', 'Rotating']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const nurse = await db.staffNurse.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            status: true,
            mobileNo: true,
            createdAt: true,
          },
        },
        hospital: {
          select: { id: true, hospitalName: true },
        },
        ward: {
          select: { id: true, name: true, wardType: true, floorNo: true },
        },
        _count: {
          select: {
            patientAssignments: true,
          },
        },
      },
    })

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 })
    }

    return NextResponse.json({
      nurse: {
        id: nurse.id,
        userId: nurse.userId,
        hospitalId: nurse.hospitalId,
        hospitalName: nurse.hospital.hospitalName,
        wardId: nurse.wardId,
        wardName: nurse.ward?.name || 'Unassigned',
        employeeId: nurse.employeeId,
        qualification: nurse.qualification,
        designation: nurse.designation,
        shift: nurse.shift,
        phoneNo: nurse.phoneNo,
        address: nurse.address,
        assignmentCount: nurse._count.patientAssignments,
        user: nurse.user,
        createdAt: nurse.createdAt,
        updatedAt: nurse.updatedAt,
      },
    })
  } catch (error) {
    console.error('Admin nurse detail error:', error)
    return NextResponse.json({ error: 'Failed to load nurse' }, { status: 500 })
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
    const { wardId, employeeId, qualification, designation, shift, phoneNo, address, name, gender, mobileNo, status } = body

    const existing = await db.staffNurse.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 })
    }

    if (qualification && !VALID_QUALIFICATIONS.includes(qualification)) {
      return NextResponse.json({ error: 'Invalid qualification' }, { status: 400 })
    }
    if (designation && !VALID_DESIGNATIONS.includes(designation)) {
      return NextResponse.json({ error: 'Invalid designation' }, { status: 400 })
    }
    if (shift && !VALID_SHIFTS.includes(shift)) {
      return NextResponse.json({ error: 'Invalid shift' }, { status: 400 })
    }

    // Check duplicate employeeId if changed
    if (employeeId && employeeId !== existing.employeeId) {
      const dup = await db.staffNurse.findFirst({ where: { employeeId } })
      if (dup) {
        return NextResponse.json({ error: 'Employee ID already exists' }, { status: 400 })
      }
    }

    // Verify ward belongs to same hospital if wardId changed
    if (wardId && wardId !== existing.wardId) {
      const ward = await db.ward.findFirst({ where: { id: wardId, hospitalId: existing.hospitalId } })
      if (!ward) {
        return NextResponse.json({ error: 'Ward not found in this hospital' }, { status: 404 })
      }
    }

    const result = await db.$transaction(async (tx) => {
      // Update user fields (not email/password)
      if (name || gender || mobileNo || status) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(name !== undefined && { name }),
            ...(gender !== undefined && { gender }),
            ...(mobileNo !== undefined && { mobileNo }),
            ...(status !== undefined && { status }),
          },
        })
      }

      // Update nurse profile fields
      const updated = await tx.staffNurse.update({
        where: { id },
        data: {
          ...(wardId !== undefined && { wardId: wardId || null }),
          ...(employeeId !== undefined && { employeeId }),
          ...(qualification !== undefined && { qualification }),
          ...(designation !== undefined && { designation }),
          ...(shift !== undefined && { shift }),
          ...(phoneNo !== undefined && { phoneNo }),
          ...(address !== undefined && { address }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              gender: true,
              status: true,
              mobileNo: true,
            },
          },
          hospital: {
            select: { id: true, hospitalName: true },
          },
          ward: {
            select: { id: true, name: true },
          },
        },
      })

      return updated
    })

    return NextResponse.json({
      nurse: {
        id: result.id,
        userId: result.userId,
        hospitalId: result.hospitalId,
        hospitalName: result.hospital.hospitalName,
        wardId: result.wardId,
        wardName: result.ward?.name || 'Unassigned',
        employeeId: result.employeeId,
        qualification: result.qualification,
        designation: result.designation,
        shift: result.shift,
        phoneNo: result.phoneNo,
        address: result.address,
        user: result.user,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    })
  } catch (error) {
    console.error('Admin update nurse error:', error)
    return NextResponse.json({ error: 'Failed to update nurse' }, { status: 500 })
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

    const existing = await db.staffNurse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            patientAssignments: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 })
    }

    if (existing._count.patientAssignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete nurse with active patient assignments' },
        { status: 400 }
      )
    }

    // Delete StaffNurse + User in transaction
    await db.$transaction(async (tx) => {
      await tx.staffNurse.delete({ where: { id } })
      await tx.user.delete({ where: { id: existing.userId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete nurse error:', error)
    return NextResponse.json({ error: 'Failed to delete nurse' }, { status: 500 })
  }
}
