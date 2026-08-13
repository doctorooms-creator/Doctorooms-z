import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

// ============ GET: Doctors for a hospital (optionally filtered by department) ============
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find receptionist profile
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist profile not found' }, { status: 404 })
    }

    const hospitalId = receptionist.hospitalId

    // Parse query params
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get('departmentId') || ''

    // Build where clause for DoctorHospital
    const dhWhere: Record<string, unknown> = {
      hospitalId,
      status: 'Active',
      isAvailable: true,
    }

    if (departmentId) {
      dhWhere.departmentId = departmentId
    }

    // Fetch doctor-hospital links with doctor and department info
    const doctorLinks = await db.doctorHospital.findMany({
      where: dhWhere,
      include: {
        doctor: {
          select: {
            id: true,
            user: { select: { name: true, profileImg: true } },
            specialization: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
      orderBy: { doctor: { user: { name: 'asc' } } },
    })

    const formattedDoctors = doctorLinks.map((dh) => ({
      doctorId: dh.doctorId,
      name: dh.doctor.user.name,
      profileImg: dh.doctor.user.profileImg,
      specialization: dh.doctor.specialization,
      designation: dh.designation,
      departmentId: dh.departmentId,
      departmentName: dh.department.name,
      departmentShortCode: dh.department.shortCode,
    }))

    return NextResponse.json({
      doctors: formattedDoctors,
    })
  } catch (error) {
    console.error('IPD doctors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
