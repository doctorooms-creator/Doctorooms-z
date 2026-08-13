import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { name: true, email: true, gender: true, mobileNo: true, profileImg: true, role: true, status: true } },
        hospital: { select: { id: true, hospitalName: true, city: true, state: true } },
        ward: { select: { id: true, name: true, wardType: true, floorNo: true } },
      },
    })

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: nurse.id,
      employeeId: nurse.employeeId,
      qualification: nurse.qualification,
      designation: nurse.designation,
      shift: nurse.shift,
      phoneNo: nurse.phoneNo,
      address: nurse.address,
      createdAt: nurse.createdAt,
      ...nurse.user,
      hospital: nurse.hospital,
      ward: nurse.ward,
    })
  } catch (error) {
    console.error('Nurse profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { phoneNo, address } = body

    const nurse = await db.staffNurse.update({
      where: { userId: user.id },
      data: {
        ...(phoneNo !== undefined && { phoneNo }),
        ...(address !== undefined && { address }),
      },
    })

    return NextResponse.json({ success: true, nurseId: nurse.id })
  } catch (error) {
    console.error('Nurse profile PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
