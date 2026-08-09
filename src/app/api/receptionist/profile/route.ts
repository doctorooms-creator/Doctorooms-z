import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      include: {
        doctor: {
          include: { user: { select: { name: true, profileImg: true, email: true, mobileNo: true } } },
        },
      },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: receptionist.id,
      address: receptionist.address,
      createdAt: receptionist.createdAt,
      doctor: {
        id: receptionist.doctor.id,
        name: receptionist.doctor.user.name,
        profileImg: receptionist.doctor.user.profileImg,
        email: receptionist.doctor.user.email,
        mobileNo: receptionist.doctor.user.mobileNo,
        specialization: receptionist.doctor.specialization,
        fees: receptionist.doctor.fees,
        city: receptionist.doctor.city,
        state: receptionist.doctor.state,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo,
        gender: user.gender,
        profileImg: user.profileImg,
        status: user.status,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Receptionist profile GET error:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    const body = await req.json()
    const { name, mobileNo, gender, address } = body

    // Update user fields
    await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(mobileNo !== undefined && { mobileNo }),
        ...(gender && { gender }),
      },
    })

    // Update receptionist fields
    if (address !== undefined) {
      await db.receptionist.update({
        where: { userId: user.id },
        data: { address },
      })
    }

    return NextResponse.json({ success: true, message: 'Profile updated' })
  } catch (error) {
    console.error('Receptionist profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
