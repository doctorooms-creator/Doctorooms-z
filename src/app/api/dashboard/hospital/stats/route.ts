import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'hospital')

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const hospitalId = hospital.id

    // Run all independent queries in parallel
    const [totalDoctors, totalAppointments, patientVisits, departmentCount, doctorLinks, recentBookings, departments] =
      await Promise.all([
        // Count doctors via DoctorHospital junction table
        db.doctorHospital.count({
          where: { hospitalId, status: 'Active' },
        }),
        // Count appointments via Booking.hospitalId
        db.booking.count({
          where: { hospitalId },
        }),
        // Count visited/finished appointments
        db.booking.count({
          where: {
            hospitalId,
            status: { in: ['Visited', 'Finish'] },
          },
        }),
        // Department count
        db.department.count({
          where: { hospitalId, status: 'Active' },
        }),
        // Doctor links with doctor + department info (for doctors list + grouping)
        db.doctorHospital.findMany({
          where: { hospitalId },
          include: {
            doctor: {
              include: {
                user: { select: { id: true, name: true, profileImg: true, status: true } },
                _count: { select: { bookings: true } },
              },
            },
            department: { select: { id: true, name: true, icon: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // Recent appointments (booked at this hospital)
        db.booking.findMany({
          where: { hospitalId },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: { user: { select: { name: true, profileImg: true } } },
            },
            user: { select: { name: true } },
          },
        }),
        // Departments for grouping
        db.department.findMany({
          where: { hospitalId },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true },
        }),
      ])

    // Get ratings for all linked doctor user IDs
    const doctorUserIds = doctorLinks
      .map((link) => link.doctor.userId)
      .filter(Boolean)
    const uniqueDoctorUserIds = [...new Set(doctorUserIds)]

    const ratingAgg = await db.doctorRating.groupBy({
      by: ['doctorId'],
      where: { doctorId: { in: uniqueDoctorUserIds } },
      _avg: { star: true },
    })
    const ratingMap = new Map(ratingAgg.map((r) => [r.doctorId, r._avg.star || 0]))

    // Build doctors list (deduplicate by doctor ID, take latest link)
    const seenDoctorIds = new Set<string>()
    const doctors = []
    for (const link of doctorLinks) {
      if (seenDoctorIds.has(link.doctorId)) continue
      seenDoctorIds.add(link.doctorId)

      const doc = link.doctor
      doctors.push({
        id: doc.id,
        name: doc.user.name,
        profileImg: doc.user.profileImg,
        specialization: doc.specialization,
        departmentName: link.department.name,
        status: doc.user.status,
        totalAppointments: doc._count.bookings,
        avgRating: Math.round((ratingMap.get(doc.userId) || 0) * 10) / 10,
      })
      if (doctors.length >= 6) break
    }

    // Group doctors by department
    const doctorsByDepartment: Record<string, { name: string; count: number }> = {}
    for (const dept of departments) {
      const count = doctorLinks.filter(
        (link) => link.departmentId === dept.id && link.status === 'Active'
      ).length
      if (count > 0) {
        doctorsByDepartment[dept.id] = { name: dept.name, count }
      }
    }

    return NextResponse.json({
      hospital: { id: hospital.id, hospitalName: hospital.hospitalName },
      totalDoctors,
      totalAppointments,
      patientVisits,
      departmentCount,
      doctors,
      doctorsByDepartment,
      recentAppointments: recentBookings.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg,
        date: b.bookingDate,
        status: b.status,
        charge: b.appointmentCharge,
      })),
    })
  } catch (error) {
    console.error('Hospital stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
