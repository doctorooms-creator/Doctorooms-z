import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const [
      upcomingCount,
      visitedCount,
      totalDoctors,
      totalDocuments,
      upcomingAppointments,
      recentBookings,
    ] = await Promise.all([
      db.booking.count({
        where: {
          userId,
          status: { in: ['Pending', 'Approve'] },
          bookingDate: { gte: new Date() },
        },
      }),
      db.booking.count({
        where: {
          userId,
          status: { in: ['Visited', 'Finish'] },
        },
      }),
      db.booking.groupBy({
        by: ['doctorId'],
        where: { userId },
      }).then((r) => r.length),
      db.medicalDocument.count({
        where: { patientId: userId },
      }),
      db.booking.findMany({
        where: {
          userId,
          status: { in: ['Pending', 'Approve'] },
          bookingDate: { gte: new Date() },
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
    ])

    return NextResponse.json({
      upcomingAppointments: upcomingCount,
      completedVisits: visitedCount,
      totalDoctors,
      medicalDocuments: totalDocuments,
      upcomingList: upcomingAppointments.map((b) => ({
        id: b.id,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg || '',
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
