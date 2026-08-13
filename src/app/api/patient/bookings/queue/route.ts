import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { istDateRange } from '@/lib/date-utils'

// ============ GET: Patient's queue position for a booking ============
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      )
    }

    // Fetch booking with doctor info
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: {
          include: { user: { select: { name: true, profileImg: true } } },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership: the booking's userId must match the logged-in user
    if (booking.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If booking doesn't have a token number, return basic info without queue
    if (!booking.tokenNumber || booking.tokenOrder <= 0) {
      return NextResponse.json({
        booking: {
          id: booking.id,
          tokenNumber: booking.tokenNumber || null,
          tokenOrder: booking.tokenOrder || 0,
          status: booking.status,
          timeSlot: booking.timeSlot,
          disease: booking.disease,
          bookingDate: booking.bookingDate.toISOString(),
          bookingMode: booking.bookingMode,
        },
        queueInfo: null,
        doctor: {
          name: booking.doctor.user.name,
          specialization: booking.doctor.specialization,
          profileImg: booking.doctor.user.profileImg,
        },
        department: null,
        hospital: null,
      })
    }

    // Get the IST date string for the booking date
    const bookingDateIST = new Date(
      new Date(booking.bookingDate).getTime() + 5.5 * 60 * 60 * 1000
    )
    const y = bookingDateIST.getUTCFullYear()
    const m = String(bookingDateIST.getUTCMonth() + 1).padStart(2, '0')
    const d = String(bookingDateIST.getUTCDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    const { start, end } = istDateRange(dateStr)

    // Count patients ahead: same doctor, same day, status in ['Approve', 'Visited'],
    // earlier tokenOrder (or same tokenOrder but created earlier)
    const patientsAhead = await db.booking.count({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: start, lte: end },
        status: { in: ['Approve', 'Visited'] },
        id: { not: booking.id },
        OR: [
          { tokenOrder: { lt: booking.tokenOrder } },
          {
            tokenOrder: booking.tokenOrder,
            createdAt: { lt: booking.createdAt },
          },
        ],
      },
    })

    const myPosition = patientsAhead + 1
    const estimatedWaitMinutes = patientsAhead * 15

    // Currently serving: latest booking with status 'Visited' for same doctor today
    const currentlyServingBooking = await db.booking.findFirst({
      where: {
        doctorId: booking.doctorId,
        bookingDate: { gte: start, lte: end },
        status: 'Visited',
      },
      orderBy: { createdAt: 'desc' },
      select: { tokenNumber: true },
    })

    // Fetch department & hospital info if this is a hospital booking
    let department: {
      name: string
      shortCode: string
      floorNo: string
      opdRoom: string
    } | null = null
    let hospital: {
      hospitalName: string
      address: string
      city: string
    } | null = null

    if (booking.hospitalId) {
      // Find the doctor-hospital link with department
      const dhLink = await db.doctorHospital.findFirst({
        where: {
          doctorId: booking.doctorId,
          hospitalId: booking.hospitalId,
          status: 'Active',
        },
        include: {
          department: {
            select: {
              name: true,
              shortCode: true,
              floorNo: true,
              opdRoom: true,
            },
          },
          hospital: {
            select: {
              hospitalName: true,
              address: true,
              city: true,
            },
          },
        },
      })

      if (dhLink) {
        department = dhLink.department
          ? {
              name: dhLink.department.name,
              shortCode: dhLink.department.shortCode,
              floorNo: dhLink.department.floorNo,
              opdRoom: dhLink.department.opdRoom,
            }
          : null
        hospital = dhLink.hospital
          ? {
              hospitalName: dhLink.hospital.hospitalName,
              address: dhLink.hospital.address,
              city: dhLink.hospital.city,
            }
          : null
      }
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        tokenNumber: booking.tokenNumber,
        tokenOrder: booking.tokenOrder,
        status: booking.status,
        timeSlot: booking.timeSlot,
        disease: booking.disease,
        bookingDate: booking.bookingDate.toISOString(),
        bookingMode: booking.bookingMode,
      },
      queueInfo: {
        totalAhead: patientsAhead,
        myPosition,
        estimatedWaitMinutes,
        currentlyServingToken: currentlyServingBooking?.tokenNumber || null,
        currentlyServingPatientName: null, // Privacy: never expose other patient names
      },
      doctor: {
        name: booking.doctor.user.name,
        specialization: booking.doctor.specialization,
        profileImg: booking.doctor.user.profileImg,
      },
      department,
      hospital,
    })
  } catch (error) {
    console.error('Patient queue GET error:', error)
    return NextResponse.json({ error: 'Failed to load queue info' }, { status: 500 })
  }
}
