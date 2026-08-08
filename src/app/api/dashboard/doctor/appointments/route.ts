import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { doctorId: doctor.id }
    if (status && status !== 'All') {
      where.status = status
    }

    const [appointments, counts] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { bookingDate: 'desc' },
        include: {
          user: { select: { name: true, profileImg: true } },
          prescriptions: { select: { id: true } },
        },
      }),
      db.booking.groupBy({
        by: ['status'],
        where: { doctorId: doctor.id },
        _count: { status: true },
      }),
    ])

    const statusCounts = counts.reduce(
      (acc, c) => {
        acc[c.status] = c._count.status
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      appointments: appointments.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg || '',
        disease: b.disease,
        date: b.bookingDate,
        status: b.status,
        charge: b.appointmentCharge,
        hasPrescription: b.prescriptions.length > 0,
      })),
      counts: statusCounts,
    })
  } catch (error) {
    console.error('Doctor appointments error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}
