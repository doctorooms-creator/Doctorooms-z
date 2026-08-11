import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

import { resolveAvatarUrl } from '@/lib/avatar-url'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      upcomingCount,
      visitedCount,
      totalDoctors,
      totalDocuments,
      upcomingAppointments,
      recentBookings,
      lastVisitedBooking,
      prescriptionsCount,
    ] = await Promise.all([
      db.booking.count({
        where: {
          userId,
          status: { in: ['Pending', 'Approve'] },
          bookingDate: { gte: todayStart },
        },
      }),
      db.booking.count({
        where: {
          userId,
          status: { in: ['Visited', 'Finish'] },
        },
      }),
      db.booking
        .groupBy({
          by: ['doctorId'],
          where: { userId, status: { in: ['Visited', 'Finish'] } },
        })
        .then((r) => r.length),
      db.medicalDocument.count({
        where: { patientId: userId },
      }),
      db.booking.findMany({
        where: {
          userId,
          status: { in: ['Pending', 'Approve'] },
          bookingDate: { gte: todayStart },
        },
        take: 3,
        orderBy: { bookingDate: 'asc' },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, profileImg: true } },
            },
          },
        },
      }),
      db.booking.findMany({
        where: { userId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, profileImg: true } },
            },
          },
        },
      }),
      db.booking.findFirst({
        where: {
          userId,
          status: { in: ['Visited', 'Finish'] },
        },
        orderBy: { bookingDate: 'desc' },
        select: { bookingDate: true },
      }),
      db.prescription.count({
        where: {
          booking: {
            userId,
            status: { in: ['Visited', 'Finish'] },
          },
        },
      }),
    ])

    return NextResponse.json({
      upcomingAppointments: upcomingCount,
      completedVisits: visitedCount,
      totalDoctors,
      medicalDocuments: totalDocuments,
      lastVisitDate: lastVisitedBooking?.bookingDate || null,
      prescriptionsReceived: prescriptionsCount,
      upcomingList: upcomingAppointments.map((b) => ({
        id: b.id,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: resolveAvatarUrl(b.doctor?.user?.profileImg),
        doctorSpecialization: b.doctor?.specialization || '',
        date: b.bookingDate,
        disease: b.disease,
        status: b.status,
        appointmentNo: b.appointmentNo,
      })),
      recentActivity: recentBookings.map((b) => ({
        id: b.id,
        type: 'appointment',
        message: `Appointment with ${b.doctor?.user?.name || 'Unknown'} — ${b.status}`,
        date: b.updatedAt,
        status: b.status,
      })),
    })
  } catch (error) {
    console.error('Patient stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
