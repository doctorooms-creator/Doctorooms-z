import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: session.user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all'
    const doctorFilter = searchParams.get('doctorId') || 'all'
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      doctor: { hospitalId: hospital.id },
    }
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    if (doctorFilter !== 'all') {
      where.doctorId = doctorFilter
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { appointmentNo: { contains: search } },
      ]
    }

    const [appointments, doctors] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            include: { user: { select: { name: true, profileImg: true } } },
          },
          user: { select: { name: true, profileImg: true } },
        },
      }),
      db.doctor.findMany({
        where: { hospitalId: hospital.id },
        select: { id: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const statusCounts = await db.booking.groupBy({
      by: ['status'],
      where: { doctor: { hospitalId: hospital.id } },
      _count: { status: true },
    })
    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status])
    )

    return NextResponse.json({
      appointments: appointments.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg,
        doctorId: b.doctorId,
        date: b.bookingDate,
        status: b.status,
        charge: b.appointmentCharge,
        disease: b.disease,
        bookingType: b.bookingType,
        createdAt: b.createdAt,
      })),
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
      })),
      statusCounts: statusCountMap,
    })
  } catch (error) {
    console.error('Hospital appointments list error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}
