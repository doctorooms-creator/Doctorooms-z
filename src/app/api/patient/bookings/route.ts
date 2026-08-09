import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { doctorId, bookingDate, timeSlot, bookingMode, disease, description, gender, age, bloodGroup, weight, relationWithMe, state, city } = body

    if (!doctorId || !bookingDate || !bookingMode || !disease || !gender) {
      return NextResponse.json(
        { error: 'doctorId, bookingDate, bookingMode, disease, and gender are required' },
        { status: 400 }
      )
    }

    // Validate bookingMode
    if (!['InPerson', 'VideoCall'].includes(bookingMode)) {
      return NextResponse.json(
        { error: 'bookingMode must be InPerson or VideoCall' },
        { status: 400 }
      )
    }

    // Validate doctor exists
    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
      include: { user: { select: { name: true } } },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const dateObj = new Date(bookingDate)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid booking date' }, { status: 400 })
    }

    // Extract date-only portion for comparisons
    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    const nextDay = new Date(dateOnly)
    nextDay.setDate(nextDay.getDate() + 1)

    // Check if date is a holiday for this doctor
    const holiday = await db.doctorHoliday.findFirst({
      where: {
        userId: doctor.userId,
        date: {
          gte: dateOnly,
          lt: nextDay,
        },
      },
    })

    if (holiday) {
      return NextResponse.json(
        { error: `Dr. ${doctor.user.name} is on holiday on this date. Reason: ${holiday.remark || 'Not specified'}` },
        { status: 400 }
      )
    }

    // Check OPD limit
    const activeBookingsCount = await db.booking.count({
      where: {
        doctorId,
        bookingDate: { gte: dateOnly, lt: nextDay },
        status: { in: ['Approve', 'Visited', 'Finish'] },
      },
    })

    if (activeBookingsCount >= doctor.dailyLimit) {
      return NextResponse.json(
        { error: `Dr. ${doctor.user.name}'s OPD limit (${doctor.dailyLimit}) has been reached for this date` },
        { status: 400 }
      )
    }

    // Check time slot conflict if provided
    if (timeSlot) {
      const slotConflict = await db.booking.findFirst({
        where: {
          doctorId,
          bookingDate: { gte: dateOnly, lt: nextDay },
          timeSlot,
          status: { in: ['Approve', 'Visited', 'Finish'] },
        },
      })

      if (slotConflict) {
        return NextResponse.json(
          { error: `Time slot ${timeSlot} is already booked for this date` },
          { status: 409 }
        )
      }
    }

    // Generate appointmentNo
    const appointmentNo = `APT-${Date.now()}`

    // Create booking
    const booking = await db.booking.create({
      data: {
        appointmentNo,
        doctorId,
        userId: user.id,
        bookingDate: dateObj,
        timeSlot: timeSlot || '',
        bookingMode,
        bookingType: 'By Self',
        disease,
        description: description || '',
        gender,
        age: age ?? undefined,
        bloodGroup: bloodGroup || '',
        weight: weight ?? 0,
        relationWithMe: relationWithMe || '',
        state: state || '',
        city: city || '',
        status: 'Pending',
        appointmentCharge: doctor.fees || 0,
        patientName: user.name,
      },
    })

    // Create notification for patient
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Booking Request Sent',
        message: `Booking request sent to Dr. ${doctor.user.name}. Waiting for reception to confirm.`,
      },
    })

    // Notify doctor
    if (doctor?.userId) {
      await db.notification.create({
        data: {
          userId: doctor.userId,
          title: 'New Appointment Booked',
          message: `${user.name} has booked an appointment for ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'a future date'}.`,
          status: 'UNREAD',
        },
      })
    }

    // Notify receptionist if exists
    const receptionist = await db.receptionist.findFirst({
      where: { doctorId: booking.doctorId },
    })
    if (receptionist) {
      await db.notification.create({
        data: {
          userId: receptionist.userId,
          title: 'New Appointment Booked',
          message: `${user.name} has booked an appointment with your doctor for ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'a future date'}.`,
          status: 'UNREAD',
        },
      })
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Patient create booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
