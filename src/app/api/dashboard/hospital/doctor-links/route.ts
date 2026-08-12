import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId') || ''
    const search = searchParams.get('search') || ''

    const where: Prisma.DoctorHospitalWhereInput = {
      hospitalId: hospital.id,
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (search) {
      where.doctor = {
        user: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        },
      }
    }

    const links = await db.doctorHospital.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImg: true,
                email: true,
                status: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    })

    // Get ratings for linked doctors
    const doctorUserIds = links.map((l) => l.doctor.userId)
    const ratingAgg = await db.doctorRating.groupBy({
      by: ['doctorId'],
      where: { doctorId: { in: doctorUserIds } },
      _avg: { star: true },
      _count: { star: true },
    })
    const ratingMap = new Map(
      ratingAgg.map((r) => [
        r.doctorId,
        { avg: r._avg.star || 0, count: r._count.star },
      ])
    )

    return NextResponse.json({
      doctorLinks: links.map((link) => {
        const rating = ratingMap.get(link.doctor.userId) || {
          avg: 0,
          count: 0,
        }
        return {
          id: link.id,
          doctorId: link.doctorId,
          departmentId: link.departmentId,
          designation: link.designation,
          fees: link.fees,
          opdTimings: link.opdTimings,
          isAvailable: link.isAvailable,
          status: link.status,
          createdAt: link.createdAt,
          doctor: {
            id: link.doctor.id,
            name: link.doctor.user.name,
            email: link.doctor.user.email,
            profileImg: link.doctor.user.profileImg,
            specialization: link.doctor.specialization,
            userStatus: link.doctor.user.status,
            avgRating: Math.round(rating.avg * 10) / 10,
            totalRatings: rating.count,
          },
          department: link.department,
        }
      }),
    })
  } catch (error) {
    console.error('Doctor links GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load doctor links' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const body = await request.json()
    const { doctorId, departmentId, designation, fees, opdTimings } = body

    if (!doctorId || !departmentId) {
      return NextResponse.json(
        { error: 'doctorId and departmentId are required' },
        { status: 400 }
      )
    }

    // Validate doctor exists
    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      )
    }

    // Validate department belongs to this hospital
    const department = await db.department.findFirst({
      where: { id: departmentId, hospitalId: hospital.id },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found or does not belong to this hospital' },
        { status: 404 }
      )
    }

    // Check for existing link
    const existingLink = await db.doctorHospital.findUnique({
      where: {
        doctorId_hospitalId_departmentId: {
          doctorId,
          hospitalId: hospital.id,
          departmentId,
        },
      },
    })

    if (existingLink) {
      return NextResponse.json(
        { error: 'This doctor is already linked to this department' },
        { status: 409 }
      )
    }

    const link = await db.doctorHospital.create({
      data: {
        doctorId,
        hospitalId: hospital.id,
        departmentId,
        designation: designation?.trim() || '',
        fees: fees !== undefined ? Number(fees) : 0,
        opdTimings: opdTimings?.trim() || '',
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, profileImg: true },
            },
          },
        },
        department: {
          select: { id: true, name: true, icon: true },
        },
      },
    })

    return NextResponse.json({ doctorLink: link }, { status: 201 })
  } catch (error) {
    console.error('Doctor links POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add doctor to department' },
      { status: 500 }
    )
  }
}
