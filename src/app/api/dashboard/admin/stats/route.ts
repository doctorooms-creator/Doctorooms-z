import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      roleGroups,
      recentBookings,
    ] = await Promise.all([
      db.user.count(),
      db.doctor.count(),
      db.booking.count(),
      db.booking.count({ where: { status: 'Pending' } }),
      db.user.groupBy({ by: ['role'], _count: { role: true } }),
      db.booking.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { include: { user: { select: { name: true, profileImg: true } } } },
          user: { select: { name: true, profileImg: true } },
        },
      }),
    ])

    const totalRevenue = await db.booking.aggregate({
      _sum: { appointmentCharge: true },
    })

    const roleDistribution = roleGroups.reduce(
      (acc, g) => {
        acc[g.role] = g._count.role
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      revenue: totalRevenue._sum.appointmentCharge || 0,
      roleDistribution,
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
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    )
  }
}
