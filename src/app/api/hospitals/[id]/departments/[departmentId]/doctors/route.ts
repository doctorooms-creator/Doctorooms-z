import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; departmentId: string }> }
) {
  try {
    const { id: hospitalId, departmentId } = await params

    // Verify department belongs to this hospital
    const department = await db.department.findFirst({
      where: { id: departmentId, hospitalId, status: 'Active' },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    const doctorLinks = await db.doctorHospital.findMany({
      where: {
        hospitalId,
        departmentId,
        status: 'Active',
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImg: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (doctorLinks.length === 0) {
      return NextResponse.json({
        department: {
          id: department.id,
          name: department.name,
          nameHi: department.nameHi,
        },
        doctors: [],
      })
    }

    // Get doctor user IDs for rating lookup
    const doctorUserIds = doctorLinks.map((link) => link.doctor.userId)
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

    // Get schedules for all doctors
    const doctorModelIds = doctorLinks.map((link) => link.doctorId)
    const schedules = await db.doctorSchedule.findMany({
      where: { doctorId: { in: doctorModelIds } },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    })
    const scheduleByDoctor = new Map<string, typeof schedules>()
    for (const s of schedules) {
      const existing = scheduleByDoctor.get(s.doctorId) || []
      existing.push(s)
      scheduleByDoctor.set(s.doctorId, existing)
    }

    const doctors = doctorLinks
      .filter((link) => link.doctor.user.status === 'Active' && link.isAvailable)
      .map((link) => {
        const doc = link.doctor
        const rating = ratingMap.get(doc.userId) || { avg: 0, count: 0 }
        return {
          id: doc.id,
          name: doc.user.name,
          profileImg: doc.user.profileImg,
          specialization: doc.specialization,
          designation: link.designation,
          fees: link.fees,
          opdTimings: link.opdTimings,
          isAvailable: link.isAvailable,
          avgRating: Math.round(rating.avg * 10) / 10,
          totalRatings: rating.count,
          schedules: scheduleByDoctor.get(doc.id) || [],
        }
      })

    return NextResponse.json({
      department: {
        id: department.id,
        name: department.name,
        nameHi: department.nameHi,
        description: department.description,
        floorNo: department.floorNo,
        opdRoom: department.opdRoom,
      },
      doctors,
    })
  } catch (error) {
    console.error('Department doctors error:', error)
    return NextResponse.json(
      { error: 'Failed to load doctors' },
      { status: 500 }
    )
  }
}
