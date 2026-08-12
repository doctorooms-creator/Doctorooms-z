import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { todayISTRange } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const { start: todayStart, end: todayEnd } = todayISTRange()

    // ── Hospital Mode: receptionist has hospitalId but no doctorId ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    if (isHospitalMode) {
      // Get all doctor IDs linked to this hospital
      const hospitalDoctors = await db.doctorHospital.findMany({
        where: { hospitalId: receptionist.hospitalId, status: 'Active' },
        select: { doctorId: true },
      })
      const doctorIds = hospitalDoctors.map((d) => d.doctorId)

      const [todayAppointments, todayVisited, pendingApprovals, todayAppointmentsList] = await Promise.all([
        db.booking.count({
          where: {
            doctorId: { in: doctorIds },
            hospitalId: receptionist.hospitalId,
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
        }),
        db.booking.count({
          where: {
            doctorId: { in: doctorIds },
            hospitalId: receptionist.hospitalId,
            status: 'Visited',
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
        }),
        db.booking.count({
          where: {
            doctorId: { in: doctorIds },
            hospitalId: receptionist.hospitalId,
            status: 'Pending',
          },
        }),
        db.booking.findMany({
          where: {
            doctorId: { in: doctorIds },
            hospitalId: receptionist.hospitalId,
            bookingDate: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            doctor: {
              include: { user: { select: { name: true, profileImg: true } } },
            },
            user: { select: { name: true, profileImg: true } },
          },
        }),
      ])

      // Get hospital info
      const hospital = await db.hospital.findUnique({
        where: { id: receptionist.hospitalId! },
      })

      // Get department counts for today
      const deptCounts = await db.booking.groupBy({
        by: ['departmentId'],
        where: {
          hospitalId: receptionist.hospitalId,
          bookingDate: { gte: todayStart, lte: todayEnd },
        },
        _count: true,
      })

      return NextResponse.json({
        todayAppointments,
        todayVisited,
        pendingApprovals,
        isHospitalMode: true,
        hospital: hospital
          ? {
              hospitalName: hospital.hospitalName,
              address: hospital.address,
              city: hospital.city,
              state: hospital.state,
              contactNo: hospital.contactNo,
            }
          : null,
        doctor: null,
        departments: deptCounts.map((d) => ({ departmentId: d.departmentId, count: d._count })),
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
    }

    // ── Clinic Mode: receptionist has a specific doctorId ──
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
          where: { id: receptionist.doctorId! },
          include: {
            user: { select: { name: true, profileImg: true } },
          },
        }),
      ])

    return NextResponse.json({
      todayAppointments,
      todayVisited,
      pendingApprovals,
      isHospitalMode: false,
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
      hospital: doctor
        ? {
            hospitalName: doctor.hospitalAddress ? 'Clinic / Hospital' : '',
            address: doctor.hospitalAddress,
            city: doctor.city,
            state: doctor.state,
            contactNo: doctor.contactNo,
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
