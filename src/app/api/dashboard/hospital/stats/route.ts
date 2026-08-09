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

    const [totalDoctors, totalAppointments, patientVisits, doctors, recentAppointments] =
      await Promise.all([
        db.doctor.count({ where: { hospitalId: hospital.id } }),
        db.booking.count({
          where: {
            doctor: { hospitalId: hospital.id },
          },
        }),
        db.booking.count({
          where: {
            doctor: { hospitalId: hospital.id },
            status: { in: ['Visited', 'Finish'] },
          },
        }),
        db.doctor.findMany({
          where: { hospitalId: hospital.id },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, profileImg: true, status: true } },
            _count: { select: { bookings: true } },
          },
        }),
        db.booking.findMany({
          where: { doctor: { hospitalId: hospital.id } },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: { user: { select: { name: true, profileImg: true } } },
            },
            user: { select: { name: true } },
          },
        }),
      ])

    // Get ratings for doctors
    const doctorIds = doctors.map((d) => d.user.id)
    const ratingAgg = await db.doctorRating.groupBy({
      by: ['doctorId'],
      where: { doctorId: { in: doctorIds } },
      _avg: { star: true },
    })
    const ratingMap = new Map(ratingAgg.map((r) => [r.doctorId, r._avg.star || 0]))

    return NextResponse.json({
      totalDoctors,
      totalAppointments,
      patientVisits,
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        profileImg: d.user.profileImg,
        specialization: d.specialization,
        status: d.user.status,
        totalAppointments: d._count.bookings,
        avgRating: Math.round((ratingMap.get(d.user.id) || 0) * 10) / 10,
      })),
      recentAppointments: recentAppointments.map((b) => ({
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
