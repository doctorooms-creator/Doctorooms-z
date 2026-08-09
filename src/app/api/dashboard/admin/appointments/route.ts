import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'admin')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'All'
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (status !== 'All') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { doctor: { user: { name: { contains: search } } } },
      ]
    }

    const [appointments, statusGroups] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true, profileImg: true },
              },
            },
          },
          user: {
            select: { name: true, profileImg: true },
          },
        },
      }),
      db.booking.groupBy({ by: ['status'], _count: { status: true } }),
    ])

    const statusCounts: Record<string, number> = {}
    for (const g of statusGroups) {
      statusCounts[g.status] = g._count.status
    }

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id,
        appointmentNo: a.appointmentNo,
        patientName: a.patientName || a.user?.name || 'Walk-in',
        patientImg: a.user?.profileImg || null,
        doctorName: a.doctor?.user?.name || 'Unknown',
        doctorImg: a.doctor?.user?.profileImg || null,
        doctorSpec: a.doctor?.specialization || '',
        bookingDate: a.bookingDate,
        disease: a.disease,
        status: a.status,
        bookingType: a.bookingType,
        appointmentCharge: a.appointmentCharge,
        description: a.description,
        patientEmail: a.user?.email || '',
        patientPhone: a.user?.mobileNo || '',
        gender: a.gender,
        age: a.age,
      })),
      total: appointments.length,
      statusCounts,
    })
  } catch (error) {
    console.error('Admin appointments list error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}
