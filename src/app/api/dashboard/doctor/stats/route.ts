import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { todayISTRange } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { start: todayStart, end: todayEnd } = todayISTRange()

    const [
      todayAppointments,
      totalPatients,
      pendingPrescriptions,
      recentReviews,
      todayAppointmentsList,
    ] = await Promise.all([
      db.booking.count({
        where: {
          doctorId: doctor.id,
          bookingDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['Pending', 'Approve', 'Visited'] },
        },
      }),
      db.booking.groupBy({
        by: ['userId'],
        where: { doctorId: doctor.id, userId: { not: null } },
      }).then((r) => r.length),
      db.booking.count({
        where: {
          doctorId: doctor.id,
          status: { in: ['Visited', 'Finish'] },
          prescriptions: { none: {} },
        },
      }),
      db.doctorRating.findMany({
        where: { doctorId: user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { name: true, profileImg: true } },
        },
      }),
      db.booking.findMany({
        where: {
          doctorId: doctor.id,
          bookingDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['Pending', 'Approve', 'Visited'] },
        },
        orderBy: { bookingDate: 'asc' },
        include: {
          user: { select: { name: true, profileImg: true } },
        },
      }),
    ])

    const avgRating = await db.doctorRating.aggregate({
      where: { doctorId: user.id },
      _avg: { star: true },
    })

    return NextResponse.json({
      todayAppointments,
      totalPatients,
      pendingPrescriptions,
      averageRating: (avgRating._avg.star || 0).toFixed(1),
      todayList: todayAppointmentsList.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg || '',
        disease: b.disease,
        date: b.bookingDate,
        status: b.status,
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        patientName: r.isAnonymous ? 'Anonymous' : (r.patient?.name || 'Patient'),
        patientImg: r.isAnonymous ? '' : (r.patient?.profileImg || ''),
        star: r.star,
        review: r.review,
        date: r.createdAt,
      })),
    })
  } catch (error) {
    console.error('Doctor stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
