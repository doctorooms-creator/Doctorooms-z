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

    const prescriptions = await db.prescription.findMany({
      where: {
        booking: {
          userId: user.id,
          status: { in: ['Visited', 'Finish'] },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        medicines: true,
        doctor: {
          include: {
            user: { select: { name: true, profileImg: true } },
          },
        },
        booking: {
          select: {
            id: true,
            appointmentNo: true,
            bookingDate: true,
            disease: true,
          },
        },
      },
    })

    return NextResponse.json({
      prescriptions: prescriptions.map((p) => ({
        id: p.id,
        disease: p.disease,
        description: p.description,
        medicinesCount: p.medicines.length,
        medicines: p.medicines.map((m) => ({
          id: m.id,
          medicine: m.medicine,
          morning: m.morning,
          afternoon: m.afternoon,
          evening: m.evening,
          tab: m.tab,
          dose: m.dose,
          description: m.description,
        })),
        doctorName: p.doctor?.user?.name || 'Unknown',
        doctorImg: resolveAvatarUrl(p.doctor?.user?.profileImg),
        bookingId: p.bookingId,
        appointmentNo: p.booking?.appointmentNo || '',
        bookingDate: p.booking?.bookingDate || null,
        createdAt: p.createdAt,
      })),
    })
  } catch (error) {
    console.error('Patient prescriptions error:', error)
    return NextResponse.json({ error: 'Failed to load prescriptions' }, { status: 500 })
  }
}
