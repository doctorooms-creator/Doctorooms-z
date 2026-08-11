import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'
import { todayISTRange, todayISTStr, currentTimeIST } from '@/lib/date-utils'

// ============ GET: Today's queue for the receptionist's doctor ============
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user || !RECEPTION_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find receptionist's linked doctor
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked to this receptionist' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { id: true, dailyLimit: true, userId: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Today's date range in IST
    const { start: startOfDay, end: endOfDay } = todayISTRange()
    const todayStr = todayISTStr()

    // Fetch all Approve/Visited/Finish bookings for today
    const bookings = await db.booking.findMany({
      where: {
        doctorId: doctor.id,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Approve', 'Visited'] },
      },
      include: {
        user: { select: { name: true, profileImg: true, mobileNo: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Count completed today
    const opdCompletedToday = await db.booking.count({
      where: {
        doctorId: doctor.id,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: 'Finish',
      },
    })

    // Build queue with positions
    const queue = bookings.map((booking, index) => ({
      id: booking.id,
      appointmentNo: booking.appointmentNo,
      patientName: booking.patientName || booking.user?.name || 'Walk-in',
      patientImg: booking.user?.profileImg || null,
      disease: booking.disease,
      timeSlot: booking.timeSlot || null,
      bookingMode: booking.bookingMode,
      bookingType: booking.bookingType,
      createdAt: booking.createdAt.toISOString(),
      status: booking.status,
      queuePosition: index + 1,
    }))

    return NextResponse.json({
      date: todayStr,
      totalInQueue: queue.length,
      queue,
      opdLimit: doctor.dailyLimit,
      opdCompletedToday,
    })
  } catch (error) {
    console.error('Walk-in queue GET error:', error)
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }
}

// ============ POST: Create a walk-in booking (directly Approve) ============
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user || !RECEPTION_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find receptionist's linked doctor
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked to this receptionist' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { id: true, userId: true, dailyLimit: true, fees: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Parse body
    const body = await req.json()
    const { patientName, mobileNo, gender, age, disease, timeSlot, bookingMode } = body

    // Validate required fields
    if (!patientName?.trim()) {
      return NextResponse.json({ error: 'Patient name is required' }, { status: 400 })
    }
    if (!disease?.trim()) {
      return NextResponse.json({ error: 'Disease/Reason is required' }, { status: 400 })
    }

    // Today's date range in IST
    const { start: startOfDay, end: endOfDay } = todayISTRange()
    const todayStr = todayISTStr()

    // 1. Validate OPD limit
    const activeBookingsCount = await db.booking.count({
      where: {
        doctorId: doctor.id,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Approve', 'Visited', 'Finish'] },
      },
    })

    if (activeBookingsCount >= doctor.dailyLimit) {
      return NextResponse.json({ error: 'OPD limit reached for today' }, { status: 400 })
    }

    // 2. Validate slot conflict (if timeSlot provided)
    if (timeSlot) {
      const slotConflict = await db.booking.findFirst({
        where: {
          doctorId: doctor.id,
          bookingDate: { gte: startOfDay, lte: endOfDay },
          timeSlot,
          status: { in: ['Approve', 'Visited', 'Finish'] },
        },
      })

      if (slotConflict) {
        return NextResponse.json({ error: `Time slot ${timeSlot} is already booked` }, { status: 400 })
      }
    }

    // 3. Check holiday
    const holiday = await db.doctorHoliday.findFirst({
      where: {
        userId: doctor.userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    })

    if (holiday) {
      return NextResponse.json({
        error: `Doctor is on holiday today. Reason: ${holiday.remark || 'Not specified'}`,
      }, { status: 400 })
    }

    // 4. Generate appointment number
    const appointmentNo = `DOC-${doctor.id.slice(0, 4).toUpperCase()}-${Date.now()}`

    // 5. Look up patient by mobile number
    let patientUserId: string | null = null
    if (mobileNo?.trim()) {
      const existingPatient = await db.user.findFirst({
        where: { mobileNo: mobileNo.trim(), role: 'patient' },
        select: { id: true },
      })
      if (existingPatient) {
        patientUserId = existingPatient.id
      }
    }

    // 6. Create booking with Approve status
    const booking = await db.booking.create({
      data: {
        appointmentNo,
        doctorId: doctor.id,
        userId: patientUserId,
        patientName: patientName.trim(),
        disease: disease.trim(),
        gender: gender || '',
        age: age ? parseInt(age, 10) : null,
        status: 'Approve',
        bookingType: 'By Receptionist',
        bookingMode: bookingMode || 'InPerson',
        timeSlot: timeSlot || currentTimeIST(),
        appointmentCharge: doctor.fees,
        bookingDate: new Date(),
      },
    })

    // 7. Calculate queue position
    const patientsAhead = await db.booking.count({
      where: {
        doctorId: doctor.id,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Approve', 'Visited'] },
        createdAt: { lte: booking.createdAt },
        id: { not: booking.id },
      },
    })
    const queuePosition = patientsAhead + 1

    // 8. Notify patient if found by mobile
    if (patientUserId) {
      await db.notification.create({
        data: {
          userId: patientUserId,
          title: 'Walk-in Registration Confirmed',
          message: `Walk-in registration confirmed. Your queue position is #${queuePosition}. Appointment: ${appointmentNo}.`,
        },
      })
    }

    // 9. Notify doctor
    await db.notification.create({
      data: {
        userId: doctor.userId,
        title: 'New Walk-in Patient',
        message: `Walk-in patient ${patientName.trim()} registered. Queue #${queuePosition}. ${disease.trim() ? `Reason: ${disease.trim()}` : ''}`,
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        appointmentNo: booking.appointmentNo,
        patientName: booking.patientName,
        disease: booking.disease,
        timeSlot: booking.timeSlot,
        bookingMode: booking.bookingMode,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
      },
      queuePosition,
      opdCount: activeBookingsCount + 1,
      opdLimit: doctor.dailyLimit,
    })
  } catch (error) {
    console.error('Walk-in registration POST error:', error)
    return NextResponse.json({ error: 'Failed to register walk-in patient' }, { status: 500 })
  }
}
