import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

function generateRandomPassword() {
  return Math.random().toString(36).slice(-8)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, mobile, gender } = body

    if (!name || !mobile || !gender) {
      return NextResponse.json(
        { error: 'Name, mobile, and gender are required' },
        { status: 400 },
      )
    }

    // Check if a user with this mobile already exists
    const existingUser = await db.user.findUnique({
      where: { email: email || `patient_${mobile}@doctorooms.com` },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A patient with this email already exists' },
        { status: 409 },
      )
    }

    const generatedEmail = email || `patient_${Date.now()}@doctorooms.com`
    const randomPassword = generateRandomPassword()
    const hashedPassword = await bcrypt.hashSync(randomPassword, 10)

    const newUser = await db.user.create({
      data: {
        name,
        email: generatedEmail,
        mobileNo: mobile,
        gender,
        role: 'patient',
        status: 'Active',
        password: hashedPassword,
        profileImg: 'default.png',
      },
    })

    return NextResponse.json(
      {
        success: true,
        patient: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          mobileNo: newUser.mobileNo,
          gender: newUser.gender,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Register patient error:', error)
    return NextResponse.json(
      { error: 'Failed to register patient' },
      { status: 500 },
    )
  }
}
