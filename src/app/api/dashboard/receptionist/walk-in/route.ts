import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'
import { todayISTRange, todayISTStr, currentTimeIST } from '@/lib/date-utils'

// ============ GET: Today's queue for the receptionist's doctor(s) ============
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user || !RECEPTION_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryDoctorId = searchParams.get('doctorId') || ''

    // Find receptionist
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked to this receptionist' }, { status: 404 })
    }

    // ── Hospital Mode ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    if (isHospitalMode) {
      const hospitalDoctors = await db.doctorHospital.findMany({
        where: { hospitalId: receptionist.hospitalId, status: 'Active' },
        select: { doctorId: true },
      })
      const doctorIds = hospitalDoctors.map((d) => d.doctorId)

      const { start: startOfDay, end: endOfDay } = todayISTRange()
      const todayStr = todayISTStr()

      // Build where clause — optionally filter by a specific doctor
      const bookingWhere: Record<string, unknown> = {
        doctorId: { in: doctorIds },
        hospitalId: receptionist.hospitalId,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Approve', 'Visited'] },
      }
      if (queryDoctorId) {
        bookingWhere.doctorId = queryDoctorId
      }

      const [bookings, opdCompletedToday] = await Promise.all([
        db.booking.findMany({
          where: bookingWhere as any,
          include: {
            doctor: {
              include: { user: { select: { name: true, profileImg: true } } },
            },
            user: { select: { name: true, profileImg: true, mobileNo: true } },
          },
          orderBy: { createdAt: 'asc' },
        }),
        db.booking.count({
          where: {
            doctorId: { in: doctorIds },
            hospitalId: receptionist.hospitalId,
            bookingDate: { gte: startOfDay, lte: endOfDay },
            status: 'Finish',
          },
        }),
      ])

      // Build per-doctor queues
      const byDoctor: Record<string, typeof bookings> = {}
      for (const b of bookings) {
        if (!byDoctor[b.doctorId]) byDoctor[b.doctorId] = []
        byDoctor[b.doctorId].push(b)
      }

      const queue = bookings.map((booking) => ({
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
        doctorId: booking.doctorId,
        doctorName: booking.doctor?.user?.name || 'Unknown',
        departmentId: booking.departmentId || null,
        queuePosition: 0, // will be calculated per-doctor below
      }))

      // Assign per-doctor queue positions
      const doctorPositionTracker: Record<string, number> = {}
      for (const item of queue) {
        doctorPositionTracker[item.doctorId] = (doctorPositionTracker[item.doctorId] || 0) + 1
        item.queuePosition = doctorPositionTracker[item.doctorId]
      }

      return NextResponse.json({
        isHospitalMode: true,
        date: todayStr,
        totalInQueue: queue.length,
        queue,
        opdCompletedToday,
      })
    }

    // ── Clinic Mode (unchanged) ──
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
      isHospitalMode: false,
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

    // Find receptionist
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked to this receptionist' }, { status: 404 })
    }

    // Parse body
    const body = await req.json()
    const { patientName, mobileNo, gender, age, disease, timeSlot, bookingMode, departmentId, doctorId: bodyDoctorId } = body

    // Validate required fields
    if (!patientName?.trim()) {
      return NextResponse.json({ error: 'Patient name is required' }, { status: 400 })
    }
    if (!disease?.trim()) {
      return NextResponse.json({ error: 'Disease/Reason is required' }, { status: 400 })
    }

    // ── Hospital Mode ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    if (isHospitalMode) {
      if (!departmentId || !bodyDoctorId) {
        return NextResponse.json(
          { error: 'departmentId and doctorId are required in hospital mode' },
          { status: 400 }
        )
      }

      // Validate department belongs to this hospital
      const dept = await db.department.findFirst({
        where: { id: departmentId, hospitalId: receptionist.hospitalId, status: 'Active' },
      })
      if (!dept) {
        return NextResponse.json({ error: 'Invalid department for this hospital' }, { status: 400 })
      }

      // Validate doctor is linked to this hospital
      const docLink = await db.doctorHospital.findFirst({
        where: { doctorId: bodyDoctorId, hospitalId: receptionist.hospitalId, status: 'Active' },
        include: { doctor: { include: { user: true } } },
      })
      if (!docLink) {
        return NextResponse.json({ error: 'Doctor is not linked to this hospital' }, { status: 400 })
      }

      const doctor = docLink.doctor
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

      // 2. Validate slot conflict
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

      // 6. Create booking
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
          appointmentCharge: docLink.fees || doctor.fees,
          bookingDate: new Date(),
          hospitalId: receptionist.hospitalId,
          departmentId,
          receptionistId: user.id,
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
          hospitalId: booking.hospitalId,
          departmentId: booking.departmentId,
        },
        queuePosition,
        opdCount: activeBookingsCount + 1,
        opdLimit: doctor.dailyLimit,
      })
    }

    // ── Clinic Mode (unchanged) ──
    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { id: true, userId: true, dailyLimit: true, fees: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
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
