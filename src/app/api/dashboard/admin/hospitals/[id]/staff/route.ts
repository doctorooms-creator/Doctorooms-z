import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { hash } from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, 'admin')
    const { id } = await params

    const hospital = await db.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role') || ''
    const search = searchParams.get('search') || ''

    // 1. Get receptionists for this hospital
    const receptionists = await db.receptionist.findMany({
      where: { hospitalId: id },
      include: {
        user: { select: { name: true, email: true, gender: true, status: true, mobileNo: true, profileImg: true, createdAt: true } },
        department: { select: { name: true } },
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    // 2. Get pharmacists for this hospital
    const pharmacists = await db.doctorPharmacist.findMany({
      where: { hospitalId: id },
      include: {
        user: { select: { name: true, email: true, gender: true, status: true, mobileNo: true, profileImg: true, createdAt: true } },
      },
    })

    // 3. Get assistants whose doctor is linked to this hospital
    const doctorHospitalLinks = await db.doctorHospital.findMany({
      where: { hospitalId: id },
      select: { doctorId: true },
    })
    const linkedDoctorIds = doctorHospitalLinks.map((d) => d.doctorId)

    let assistants: {
      userId: string
      doctorId: string
      user: { name: string; email: string; gender: string; status: string; mobileNo: string; profileImg: string; createdAt: Date }
      doctor: { user: { name: string } }
    }[] = []

    if (linkedDoctorIds.length > 0) {
      assistants = await db.doctorAssistant.findMany({
        where: { doctorId: { in: linkedDoctorIds } },
        include: {
          user: { select: { name: true, email: true, gender: true, status: true, mobileNo: true, profileImg: true, createdAt: true } },
          doctor: { select: { user: { select: { name: true } } } },
        },
      })
    }

    // 4. Get doctors linked to this hospital
    const doctorLinks = await db.doctorHospital.findMany({
      where: { hospitalId: id },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, email: true, gender: true, status: true, mobileNo: true, profileImg: true, createdAt: true } },
          },
        },
      },
    })

    // 5. Build unified staff array
    const staff = [
      ...receptionists.map((r) => ({
        userId: r.userId,
        name: r.user.name,
        email: r.user.email,
        role: 'receptionist' as const,
        gender: r.user.gender,
        status: r.user.status,
        mobileNo: r.user.mobileNo,
        profileImg: r.user.profileImg,
        createdAt: r.user.createdAt,
        departmentName: r.department?.name || null,
        doctorName: r.doctor?.user.name || null,
      })),
      ...pharmacists.map((p) => ({
        userId: p.userId,
        name: p.user.name,
        email: p.user.email,
        role: 'pharmacist' as const,
        gender: p.user.gender,
        status: p.user.status,
        mobileNo: p.user.mobileNo,
        profileImg: p.user.profileImg,
        createdAt: p.user.createdAt,
        hospitalId: p.hospitalId || id,
      })),
      ...assistants.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        role: 'assistant' as const,
        gender: a.user.gender,
        status: a.user.status,
        mobileNo: a.user.mobileNo,
        profileImg: a.user.profileImg,
        createdAt: a.user.createdAt,
        doctorName: a.doctor.user.name,
      })),
      ...doctorLinks.map((d) => ({
        userId: d.doctor.userId,
        name: d.doctor.user.name,
        email: d.doctor.user.email,
        role: 'doctor' as const,
        gender: d.doctor.user.gender,
        status: d.doctor.user.status,
        mobileNo: d.doctor.user.mobileNo,
        profileImg: d.doctor.user.profileImg,
        createdAt: d.doctor.user.createdAt,
        designation: d.designation,
      })),
    ]

    // 6. Apply filters
    let filtered = staff

    if (roleFilter) {
      filtered = filtered.filter((s) => s.role === roleFilter)
    }

    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerSearch) ||
          s.email.toLowerCase().includes(lowerSearch)
      )
    }

    const counts = {
      receptionists: receptionists.length,
      pharmacists: pharmacists.length,
      assistants: assistants.length,
      doctors: doctorLinks.length,
    }

    return NextResponse.json({ staff: filtered, counts })
  } catch (error) {
    console.error('List hospital staff error:', error)
    return NextResponse.json({ error: 'Failed to load staff' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, 'admin')
    const { id } = await params

    const hospital = await db.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const body = await request.json()
    const { role, name, email, password, gender, mobileNo, departmentId, doctorEmail } = body

    // Validate required fields
    if (!role || !name || !email || !password) {
      return NextResponse.json({ error: 'role, name, email, and password are required' }, { status: 400 })
    }

    const validRoles = ['receptionist', 'pharmacist', 'assistant', 'doctor']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 })
    }

    // Check email uniqueness
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create the user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status: 'Active',
        gender: gender || 'Male',
        mobileNo: mobileNo || '',
      },
    })

    // Create role-specific profile record
    switch (role) {
      case 'receptionist': {
        // Validate departmentId belongs to this hospital if provided
        if (departmentId) {
          const dept = await db.department.findFirst({ where: { id: departmentId, hospitalId: id } })
          if (!dept) {
            await db.user.delete({ where: { id: user.id } })
            return NextResponse.json({ error: 'Department not found in this hospital' }, { status: 400 })
          }
        }
        await db.receptionist.create({
          data: {
            userId: user.id,
            hospitalId: id,
            departmentId: departmentId || null,
          },
        })
        break
      }

      case 'pharmacist': {
        await db.doctorPharmacist.create({
          data: {
            userId: user.id,
            hospitalId: id,
          },
        })
        break
      }

      case 'assistant': {
        if (!doctorEmail) {
          await db.user.delete({ where: { id: user.id } })
          return NextResponse.json({ error: 'doctorEmail is required for assistant role' }, { status: 400 })
        }

        // Find the doctor by email
        const doctorUser = await db.user.findUnique({ where: { email: doctorEmail } })
        if (!doctorUser || doctorUser.role !== 'doctor') {
          await db.user.delete({ where: { id: user.id } })
          return NextResponse.json({ error: 'Doctor not found with the given email' }, { status: 404 })
        }

        const doctor = await db.doctor.findUnique({ where: { userId: doctorUser.id } })
        if (!doctor) {
          await db.user.delete({ where: { id: user.id } })
          return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
        }

        await db.doctorAssistant.create({
          data: {
            userId: user.id,
            doctorId: doctor.id,
          },
        })
        break
      }

      case 'doctor': {
        await db.doctor.create({
          data: {
            userId: user.id,
          },
        })
        break
      }
    }

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      gender: user.gender,
      mobileNo: user.mobileNo,
      profileImg: user.profileImg,
      createdAt: user.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Create hospital staff error:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
