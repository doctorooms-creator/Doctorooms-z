import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

function avatarUrl(img: string | null | undefined): string {
  if (!img || img === 'default.png') return ''
  return img.startsWith('/') ? img : `/uploads/profile/${img}`
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Prisma.BookingWhereInput = { userId: user.id }
    if (status && status !== 'All') {
      where.status = status
    }
    if (from && to) {
      where.bookingDate = { gte: new Date(from), lte: new Date(to + 'T23:59:59') }
    } else if (from) {
      where.bookingDate = { gte: new Date(from) }
    } else if (to) {
      where.bookingDate = { lte: new Date(to + 'T23:59:59') }
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
      where: { userId: user.id },
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
        doctorImg: avatarUrl(b.doctor?.user?.profileImg),
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
