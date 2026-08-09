import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'pharmacist')

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    const [totalPrescriptions, todayPrescriptions, recentPrescriptions, doctor] =
      await Promise.all([
        db.prescription.count({
          where: { doctorId: pharmacist.doctorId },
        }),
        db.prescription.count({
          where: {
            doctorId: pharmacist.doctorId,
            createdAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        db.prescription.findMany({
          where: { doctorId: pharmacist.doctorId },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            medicines: { select: { id: true } },
          },
        }),
        db.doctor.findUnique({
          where: { id: pharmacist.doctorId },
          include: { user: { select: { name: true, profileImg: true } } },
        }),
      ])

    // Pending fulfillments: prescriptions from today that haven't been "fulfilled"
    // Since there's no fulfillment field, we count today's prescriptions as pending
    const pendingFulfillments = todayPrescriptions

    return NextResponse.json({
      totalPrescriptions,
      todayPrescriptions,
      pendingFulfillments,
      doctor: doctor
        ? {
            id: doctor.id,
            name: doctor.user.name,
            profileImg: doctor.user.profileImg,
            specialization: doctor.specialization,
          }
        : null,
      recentPrescriptions: recentPrescriptions.map((rx) => ({
        id: rx.id,
        patientName: rx.patientName,
        disease: rx.disease,
        createdAt: rx.createdAt,
        medicineCount: rx.medicines.length,
      })),
    })
  } catch (error) {
    console.error('Pharmacist stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
