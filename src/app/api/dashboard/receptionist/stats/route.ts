import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)

    const [todayAppointments, todayVisited, pendingApprovals, todayAppointmentsList, doctor] =
      await Promise.all([
        db.booking.count({
          where: {
            doctorId: receptionist.doctorId,
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
        }),
        db.booking.count({
          where: {
            doctorId: receptionist.doctorId,
            status: 'Visited',
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
        }),
        db.booking.count({
          where: {
            doctorId: receptionist.doctorId,
            status: 'Pending',
          },
        }),
        db.booking.findMany({
          where: {
            doctorId: receptionist.doctorId,
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
          where: { id: receptionist.doctorId },
          include: {
            user: { select: { name: true, profileImg: true } },
            hospital: { select: { hospitalName: true, address: true, city: true, state: true, contactNo: true } },
          },
        }),
      ])

    return NextResponse.json({
      todayAppointments,
      todayVisited,
      pendingApprovals,
      doctor: doctor
        ? {
            id: doctor.id,
            name: doctor.user.name,
            profileImg: doctor.user.profileImg,
            specialization: doctor.specialization,
            contactNo: doctor.contactNo,
            hospitalAddress: doctor.hospitalAddress,
            city: doctor.city,
            state: doctor.state,
          }
        : null,
      hospital: doctor?.hospital
        ? {
            hospitalName: doctor.hospital.hospitalName,
            address: doctor.hospital.address,
            city: doctor.hospital.city,
            state: doctor.hospital.state,
            contactNo: doctor.hospital.contactNo,
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
    console.error('Receptionist stats error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
