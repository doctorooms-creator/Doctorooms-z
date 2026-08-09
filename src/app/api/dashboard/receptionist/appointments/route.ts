import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

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

    const where: Record<string, unknown> = { doctorId: receptionist.doctorId }
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { appointmentNo: { contains: search } },
      ]
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
        where: { id: receptionist.doctorId },
        include: { user: { select: { name: true } } },
      }),
    ])

    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status])
    )

    return NextResponse.json({
      appointments: appointments.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: b.user?.profileImg,
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: b.doctor?.user?.profileImg,
        date: b.bookingDate,
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
    const { patientName, disease, date, time, description } = body

    if (!patientName || !date) {
      return NextResponse.json(
        { error: 'Patient name and date are required' },
        { status: 400 }
      )
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
    })

    const bookingDate = time
      ? new Date(`${date}T${time}`)
      : new Date(date)

    // Generate appointment number
    const appointmentCount = await db.booking.count()
    const appointmentNo = `APT${String(appointmentCount + 1).padStart(6, '0')}`

    const appointment = await db.booking.create({
      data: {
        appointmentNo,
        doctorId: receptionist.doctorId,
        patientName,
        disease: disease || '',
        description: description || '',
        bookingDate,
        status: 'Approve',
        bookingType: 'By Receptionist',
        appointmentCharge: doctor?.fees || 0,
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

    const appointment = await db.booking.findFirst({
      where: { id, doctorId: receptionist.doctorId },
    })

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
