import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { istDateRange, nowIST, currentTimeIST } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const queryDepartmentId = searchParams.get('departmentId') || ''
    const queryDoctorId = searchParams.get('doctorId') || ''

    // ── Hospital Mode ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    if (isHospitalMode) {
      const hospitalDoctors = await db.doctorHospital.findMany({
        where: { hospitalId: receptionist.hospitalId, status: 'Active' },
        select: { doctorId: true },
      })
      const hospitalDoctorIds = hospitalDoctors.map((d) => d.doctorId)

      // Build base where with all hospital doctor IDs
      const where: Prisma.BookingWhereInput = {
        doctorId: { in: hospitalDoctorIds },
        hospitalId: receptionist.hospitalId,
      }

      if (statusFilter !== 'all') {
        where.status = statusFilter
      }
      if (search) {
        where.OR = [
          { patientName: { contains: search } },
          { appointmentNo: { contains: search } },
        ]
      }
      if (from || to) {
        where.bookingDate = {}
        if (from) {
          const range = istDateRange(from)
          where.bookingDate.gte = range.start
        }
        if (to) {
          const range = istDateRange(to)
          where.bookingDate.lte = range.end
        }
      }
      // Hospital-mode specific filters
      if (queryDepartmentId) {
        where.departmentId = queryDepartmentId
      }
      if (queryDoctorId) {
        where.doctorId = queryDoctorId
      }

      const [appointments, statusCounts] = await Promise.all([
        db.booking.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: { user: { select: { name: true, profileImg: true } } },
            },
            user: { select: { name: true, profileImg: true } },
          },
        }),
        db.booking.groupBy({
          by: ['status'],
          where: {
            doctorId: { in: hospitalDoctorIds },
            hospitalId: receptionist.hospitalId,
          },
          _count: { status: true },
        }),
      ])

      const statusCountMap = Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count.status])
      )

      // Get hospital departments list
      const departments = await db.department.findMany({
        where: { hospitalId: receptionist.hospitalId, status: 'Active' },
        select: { id: true, name: true, shortCode: true },
        orderBy: { sortOrder: 'asc' },
      })

      return NextResponse.json({
        isHospitalMode: true,
        appointments: appointments.map((b) => ({
          id: b.id,
          appointmentNo: b.appointmentNo,
          patientName: b.patientName || b.user?.name || 'Walk-in',
          patientImg: b.user?.profileImg,
          patientUserId: b.userId || null,
          doctorId: b.doctor?.id || '',
          doctorName: b.doctor?.user?.name || 'Unknown',
          doctorImg: b.doctor?.user?.profileImg,
          doctorSpecialization: b.doctor?.specialization || null,
          departmentId: b.departmentId || null,
          date: b.bookingDate,
          timeSlot: b.timeSlot || '',
          status: b.status,
          charge: b.appointmentCharge,
          disease: b.disease,
          bookingType: b.bookingType,
          createdAt: b.createdAt,
        })),
        statusCounts: statusCountMap,
        doctor: null,
        departments,
      })
    }

    // ── Clinic Mode (unchanged) ──
    const where: Prisma.BookingWhereInput = { doctorId: receptionist.doctorId }
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { appointmentNo: { contains: search } },
      ]
    }
    if (from || to) {
      where.bookingDate = {}
      if (from) {
        const range = istDateRange(from)
        where.bookingDate.gte = range.start
      }
      if (to) {
        const range = istDateRange(to)
        where.bookingDate.lte = range.end
      }
    }

    const [appointments, statusCounts, doctor] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            include: { user: { select: { name: true, profileImg: true } } },
          },
          user: { select: { name: true, profileImg: true } },
        },
      }),
      db.booking.groupBy({
        by: ['status'],
        where: { doctorId: receptionist.doctorId },
        _count: { status: true },
      }),
      db.doctor.findUnique({
        where: { id: receptionist.doctorId! },
        include: { user: { select: { name: true } } },
      }),
    ])

    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status])
    )

    return NextResponse.json({
      isHospitalMode: false,
      appointments: appointments.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg,
        patientUserId: b.userId || null,
        doctorId: b.doctor?.id || '',
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg,
        doctorSpecialization: b.doctor?.specialization || null,
        date: b.bookingDate,
        timeSlot: b.timeSlot || '',
        status: b.status,
        charge: b.appointmentCharge,
        disease: b.disease,
        bookingType: b.bookingType,
        createdAt: b.createdAt,
      })),
      statusCounts: statusCountMap,
      doctor: doctor
        ? { id: doctor.id, name: doctor.user.name, fees: doctor.fees }
        : null,
    })
  } catch (error) {
    console.error('Receptionist appointments list error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      patientName,
      disease,
      date,
      time,
      description,
      gender,
      dateOfBirth,
      age,
      bloodGroup,
      weight,
      height,
      physicallyChallenged,
      relationWithMe,
      mobile,
    } = body

    if (!patientName || !date) {
      return NextResponse.json(
        { error: 'Patient name and date are required' },
        { status: 400 }
      )
    }

    // ── Hospital Mode ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    if (isHospitalMode) {
      const { departmentId, doctorId } = body
      if (!departmentId || !doctorId) {
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
        where: { doctorId, hospitalId: receptionist.hospitalId, status: 'Active' },
        include: { doctor: true },
      })
      if (!docLink) {
        return NextResponse.json({ error: 'Doctor is not linked to this hospital' }, { status: 400 })
      }

      const bookingDate = time
        ? new Date(`${date}T${time}`)
        : nowIST()

      const appointmentCount = await db.booking.count()
      const appointmentNo = `APT${String(appointmentCount + 1).padStart(6, '0')}`

      let userId: string | null = null
      if (mobile) {
        const existingPatient = await db.user.findFirst({
          where: { mobileNo: mobile, role: 'patient' },
          select: { id: true },
        })
        if (existingPatient) {
          userId = existingPatient.id
        }
      }

      const appointment = await db.booking.create({
        data: {
          appointmentNo,
          doctorId,
          userId,
          patientName,
          disease: disease || '',
          description: description || '',
          bookingDate,
          status: 'Approve',
          bookingType: 'By Receptionist',
          appointmentCharge: docLink.doctor.fees || 0,
          hospitalId: receptionist.hospitalId,
          departmentId,
          receptionistId: user.id,
          gender: gender || '',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          age: age ? parseInt(String(age), 10) || null : null,
          bloodGroup: bloodGroup || '',
          weight: weight ? parseFloat(String(weight)) || 0 : 0,
          height: height ? parseFloat(String(height)) || 0 : 0,
          physicallyChallenged: physicallyChallenged || 'No',
          relationWithMe: relationWithMe || '',
          timeSlot: time || currentTimeIST(),
        },
      })

      return NextResponse.json({ success: true, appointment }, { status: 201 })
    }

    // ── Clinic Mode (unchanged) ──
    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
    })

    // When no time slot selected, use current IST time for queue ordering
    const bookingDate = time
      ? new Date(`${date}T${time}`)
      : nowIST()

    // Generate appointment number
    const appointmentCount = await db.booking.count()
    const appointmentNo = `APT${String(appointmentCount + 1).padStart(6, '0')}`

    // Look up existing patient by mobile
    let userId: string | null = null
    if (mobile) {
      const existingPatient = await db.user.findFirst({
        where: { mobileNo: mobile, role: 'patient' },
        select: { id: true },
      })
      if (existingPatient) {
        userId = existingPatient.id
      }
    }

    const appointment = await db.booking.create({
      data: {
        appointmentNo,
        doctorId: receptionist.doctorId,
        userId,
        patientName,
        disease: disease || '',
        description: description || '',
        bookingDate,
        status: 'Approve',
        bookingType: 'By Receptionist',
        appointmentCharge: doctor?.fees || 0,
        gender: gender || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: age ? parseInt(String(age), 10) || null : null,
        bloodGroup: bloodGroup || '',
        weight: weight ? parseFloat(String(weight)) || 0 : 0,
        height: height ? parseFloat(String(height)) || 0 : 0,
        physicallyChallenged: physicallyChallenged || 'No',
        relationWithMe: relationWithMe || '',
        timeSlot: time || currentTimeIST(),
      },
    })

    return NextResponse.json({ success: true, appointment }, { status: 201 })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Appointment ID and status are required' },
        { status: 400 }
      )
    }

    if (!['Approve', 'Canceled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // ── Hospital Mode: allow managing any appointment in this hospital ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    let appointment
    if (isHospitalMode) {
      appointment = await db.booking.findFirst({
        where: { id, hospitalId: receptionist.hospitalId },
      })
    } else {
      appointment = await db.booking.findFirst({
        where: { id, doctorId: receptionist.doctorId },
      })
    }

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await db.booking.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
