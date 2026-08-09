import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'assistant')

    const assistant = await db.doctorAssistant.findUnique({
      where: { userId: user.id },
    })

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { doctorId: assistant.doctorId }
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { appointmentNo: { contains: search } },
      ]
    }

    const [appointments, statusCounts, doctor] = await Promise.all([
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
      db.booking.groupBy({
        by: ['status'],
        where: { doctorId: assistant.doctorId },
        _count: { status: true },
      }),
      db.doctor.findUnique({
        where: { id: assistant.doctorId },
        include: { user: { select: { name: true } } },
      }),
    ])

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
        date: b.bookingDate,
        status: b.status,
        charge: b.appointmentCharge,
        disease: b.disease,
        bookingType: b.bookingType,
        description: b.description,
        createdAt: b.createdAt,
      })),
      statusCounts: statusCountMap,
      doctor: doctor
        ? { id: doctor.id, name: doctor.user.name }
        : null,
    })
  } catch (error) {
    console.error('Assistant appointments list error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}
