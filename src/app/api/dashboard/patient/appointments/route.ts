import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status && status !== 'All') {
      where.status = status
    }

    const appointments = await db.booking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, profileImg: true } },
          },
        },
        prescriptions: {
          take: 1,
          select: { id: true },
        },
      },
    })

    const statusCounts = await db.booking.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: { status: true },
    })

    const counts = statusCounts.reduce(
      (acc, s) => {
        acc[s.status] = s._count.status
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      appointments: appointments.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg || '',
        doctorSpecialization: b.doctor?.specialization || '',
        date: b.bookingDate,
        disease: b.disease,
        description: b.description,
        status: b.status,
        charge: b.appointmentCharge,
        hasPrescription: b.prescriptions.length > 0,
        createdAt: b.createdAt,
      })),
      counts,
    })
  } catch (error) {
    console.error('Patient appointments error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}
