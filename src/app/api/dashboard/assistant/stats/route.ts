import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'assistant')

    const assistant = await db.doctorAssistant.findUnique({
      where: { userId: user.id },
    })

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 })
    }

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    const [todayAppointments, totalPatients, pendingTasks, todayAppointmentsList, doctor] =
      await Promise.all([
        db.booking.count({
          where: {
            doctorId: assistant.doctorId,
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
        }),
        db.user.count({
          where: {
            bookings: {
              some: { doctorId: assistant.doctorId },
            },
            role: 'patient',
          },
        }),
        db.booking.count({
          where: {
            doctorId: assistant.doctorId,
            status: 'Pending',
          },
        }),
        db.booking.findMany({
          where: {
            doctorId: assistant.doctorId,
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: { user: { select: { name: true, profileImg: true } } },
            },
            user: { select: { name: true, profileImg: true } },
          },
        }),
        db.doctor.findUnique({
          where: { id: assistant.doctorId },
          include: { user: { select: { name: true, profileImg: true } } },
        }),
      ])

    return NextResponse.json({
      todayAppointments,
      totalPatients,
      pendingTasks,
      doctor: doctor
        ? {
            id: doctor.id,
            name: doctor.user.name,
            profileImg: doctor.user.profileImg,
            specialization: doctor.specialization,
          }
        : null,
      todayAppointmentsList: todayAppointmentsList.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg,
        doctorName: b.doctor?.user?.name || 'Unknown',
        date: b.bookingDate,
        status: b.status,
        disease: b.disease,
        charge: b.appointmentCharge,
      })),
    })
  } catch (error) {
    console.error('Assistant stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
