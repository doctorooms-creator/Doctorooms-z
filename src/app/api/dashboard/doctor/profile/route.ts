import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true, profileImg: true, mobileNo: true, gender: true } },
      },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        profileImg: doctor.user.profileImg,
        mobileNo: doctor.user.mobileNo,
        gender: doctor.user.gender,
        specialization: doctor.specialization,
        education: doctor.education,
        experience: doctor.experience,
        fees: doctor.fees,
        emergencyCharge: doctor.emergencyCharge,
        address: doctor.address,
        city: doctor.city,
        state: doctor.state,
        description: doctor.description,
        awardAndRecognition: doctor.awardAndRecognition,
        contactNo: doctor.contactNo,
        hospitalAddress: doctor.hospitalAddress,
        doctorType: doctor.doctorType,
        registrationDetail: doctor.registrationDetail,
        isEmergency: doctor.isEmergency,
      },
    })
  } catch (error) {
    console.error('Doctor profile error:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      specialization,
      education,
      experience,
      fees,
      emergencyCharge,
      address,
      city,
      state,
      description,
      awardAndRecognition,
      contactNo,
      hospitalAddress,
      doctorType,
      registrationDetail,
      isEmergency,
      profileImg,
    } = body

    // Update user name
    if (name) {
      await db.user.update({
        where: { id: session.user.id },
        data: { name },
      })
    }
    if (profileImg) {
      await db.user.update({
        where: { id: session.user.id },
        data: { profileImg },
      })
    }

    const updated = await db.doctor.update({
      where: { userId: session.user.id },
      data: {
        ...(specialization !== undefined && { specialization }),
        ...(education !== undefined && { education }),
        ...(experience !== undefined && { experience }),
        ...(fees !== undefined && { fees: Number(fees) || 0 }),
        ...(emergencyCharge !== undefined && { emergencyCharge: Number(emergencyCharge) || 0 }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(description !== undefined && { description }),
        ...(awardAndRecognition !== undefined && { awardAndRecognition }),
        ...(contactNo !== undefined && { contactNo }),
        ...(hospitalAddress !== undefined && { hospitalAddress }),
        ...(doctorType !== undefined && { doctorType }),
        ...(registrationDetail !== undefined && { registrationDetail }),
        ...(isEmergency !== undefined && { isEmergency }),
      },
    })

    return NextResponse.json({ success: true, doctorId: updated.id })
  } catch (error) {
    console.error('Update doctor profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
