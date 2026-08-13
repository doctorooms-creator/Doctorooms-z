import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { istDateRange } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const { start: dayStart, end: dayEnd } = istDateRange(dateStr)

    // Build booking filter based on mode
    let bookingFilter: Record<string, unknown>
    if (isHospitalMode) {
      const dhLinks = await db.doctorHospital.findMany({
        where: { hospitalId: receptionist.hospitalId, status: 'Active' },
        select: { doctorId: true },
      })
      const doctorIds = dhLinks.map(d => d.doctorId)
      bookingFilter = {
        doctorId: { in: doctorIds },
        hospitalId: receptionist.hospitalId,
      }
    } else {
      bookingFilter = { doctorId: receptionist.doctorId! }
    }

    const [bookings, doctor, hospital] = await Promise.all([
      db.booking.findMany({
        where: {
          ...bookingFilter,
          bookingDate: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { name: true, profileImg: true } },
          doctor: { include: { user: { select: { name: true } } } },
        },
      }),
      isHospitalMode
        ? null
        : db.doctor.findUnique({
            where: { id: receptionist.doctorId! },
            include: { user: { select: { name: true } } },
          }),
      isHospitalMode
        ? db.hospital.findUnique({
            where: { userId: receptionist.hospitalId! },
            select: { hospitalName: true, address: true, city: true },
          })
        : null,
    ])

    // Compute stats
    const total = bookings.length
    const pending = bookings.filter(b => b.status === 'Pending').length
    const approved = bookings.filter(b => b.status === 'Approve').length
    const visited = bookings.filter(b => b.status === 'Visited').length
    const finished = bookings.filter(b => b.status === 'Finish').length
    const canceled = bookings.filter(b => b.status === 'Canceled' || b.status === 'Rejected').length
    const extended = bookings.filter(b => b.status === 'Extend').length
    const revenue = bookings
      .filter(b => ['Visited', 'Finish', 'Approve'].includes(b.status))
      .reduce((sum, b) => sum + b.appointmentCharge, 0)

    return NextResponse.json({
      isHospitalMode,
      doctor: doctor ? { name: doctor.user.name, dailyLimit: doctor.dailyLimit } : null,
      hospital: hospital ? { name: hospital.hospitalName, address: hospital.address, city: hospital.city } : null,
      date: dateStr,
      stats: { total, pending, approved, visited, finished, canceled, extended, revenue },
      bookings: bookings.map(b => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg,
        doctorName: b.doctor?.user?.name || null,
        disease: b.disease,
        tokenNumber: b.tokenNumber || null,
        bookingDate: b.bookingDate.toISOString(),
        status: b.status,
        appointmentCharge: b.appointmentCharge,
        bookingMode: b.bookingMode,
        bookingType: b.bookingType,
        timeSlot: b.timeSlot,
      })),
    })
  } catch (error) {
    console.error('Receptionist report error:', error)
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
  }
}
