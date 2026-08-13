import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const VALID_QUALIFICATIONS = ['GNM', 'BSc Nursing', 'ANM']
const VALID_DESIGNATIONS = ['Staff Nurse', 'Sister', 'Nursing Incharge']
const VALID_SHIFTS = ['Morning', 'Evening', 'Night', 'Rotating']

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId') || ''
    const wardId = searchParams.get('wardId') || ''

    const where: Record<string, unknown> = {}
    if (hospitalId) {
      where.hospitalId = hospitalId
    }
    if (wardId) {
      where.wardId = wardId
    }

    const nurses = await db.staffNurse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        _count: {
          select: {
            patientAssignments: true,
          },
        },
      },
    })

    const result = nurses.map((n) => ({
      id: n.id,
      userId: n.userId,
      hospitalId: n.hospitalId,
      hospitalName: n.hospital.hospitalName,
      wardId: n.wardId,
      wardName: n.ward?.name || 'Unassigned',
      employeeId: n.employeeId,
      qualification: n.qualification,
      designation: n.designation,
      shift: n.shift,
      phoneNo: n.phoneNo,
      address: n.address,
      assignmentCount: n._count.patientAssignments,
      user: {
        id: n.user.id,
        name: n.user.name,
        email: n.user.email,
        gender: n.user.gender,
        status: n.user.status,
        mobileNo: n.user.mobileNo,
      },
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }))

    return NextResponse.json({ nurses: result, total: result.length })
  } catch (error) {
    console.error('Admin nurses list error:', error)
    return NextResponse.json({ error: 'Failed to load nurses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      hospitalId,
      wardId,
      employeeId,
      name,
      email,
      password,
      gender,
      phoneNo,
      qualification,
      designation,
      shift,
      address,
    } = body

    if (!hospitalId || !name || !email || !employeeId) {
      return NextResponse.json(
        { error: 'hospitalId, name, email, and employeeId are required' },
        { status: 400 }
      )
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

    // Verify hospital exists
    const hospital = await db.hospital.findUnique({ where: { id: hospitalId } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    // Verify ward exists if provided
    if (wardId) {
      const ward = await db.ward.findFirst({ where: { id: wardId, hospitalId } })
      if (!ward) {
        return NextResponse.json({ error: 'Ward not found in this hospital' }, { status: 404 })
      }
    }

    // Check duplicate email
    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Check duplicate employee ID
    const existingEmployee = await db.staffNurse.findFirst({ where: { employeeId } })
    if (existingEmployee) {
      return NextResponse.json({ error: 'Employee ID already exists' }, { status: 400 })
    }

    const nursePassword = password || 'nurse123'

    // Create User + StaffNurse in transaction
    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: nursePassword,
          gender: gender || 'Female',
          role: 'nurse',
          status: 'Active',
          mobileNo: phoneNo || '',
        },
      })

      const newNurse = await tx.staffNurse.create({
        data: {
          userId: newUser.id,
          hospitalId,
          wardId: wardId || null,
          employeeId,
          qualification: qualification || 'GNM',
          designation: designation || 'Staff Nurse',
          shift: shift || 'Morning',
          phoneNo: phoneNo || '',
          address: address || '',
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

      return newNurse
    })

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin create nurse error:', error)
    return NextResponse.json({ error: 'Failed to create nurse' }, { status: 500 })
  }
}
