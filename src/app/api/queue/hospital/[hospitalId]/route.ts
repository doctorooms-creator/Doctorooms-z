import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, RECEPTION_ROLES } from '@/lib/api-auth'
import { todayISTRange, todayISTStr } from '@/lib/date-utils'

// ============ GET: Hospital-wide queue overview ============
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const user = await requireAuth(req)
    if (!user || ![...RECEPTION_ROLES, 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hospitalId } = await params
    const { searchParams } = new URL(req.url)
    const queryDepartmentId = searchParams.get('departmentId') || ''

    // Validate hospital exists
    const hospital = await db.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, hospitalName: true },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { start: startOfDay, end: endOfDay } = todayISTRange()
    const todayStr = todayISTStr()

    // Get all doctor-hospital links (optionally filtered by department)
    const doctorLinks = await db.doctorHospital.findMany({
      where: {
        hospitalId,
        status: 'Active',
        ...(queryDepartmentId ? { departmentId: queryDepartmentId } : {}),
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, profileImg: true } },
          },
        },
        department: { select: { id: true, name: true, shortCode: true, icon: true, floorNo: true, opdRoom: true } },
      },
      orderBy: [{ department: { sortOrder: 'asc' } }, { doctor: { user: { name: 'asc' } } }],
    })

    // Get all doctor IDs
    const doctorIds = doctorLinks.map((dl) => dl.doctorId)

    // Fetch ALL bookings for all hospital doctors today (Approve, Visited, Finish)
    const allBookings = doctorIds.length > 0
      ? await db.booking.findMany({
          where: {
            doctorId: { in: doctorIds },
            hospitalId,
            bookingDate: { gte: startOfDay, lte: endOfDay },
            status: { in: ['Approve', 'Visited', 'Finish'] },
          },
          include: {
            user: { select: { name: true, profileImg: true } },
            receptionist: { select: { user: { select: { name: true } } } },
          },
        })
      : []

    // Group bookings by doctorId
    const bookingsByDoctor: Record<string, typeof allBookings> = {}
    for (const b of allBookings) {
      if (!bookingsByDoctor[b.doctorId]) bookingsByDoctor[b.doctorId] = []
      bookingsByDoctor[b.doctorId].push(b)
    }

    // Helper: build queue items from bookings
    function buildQueueItems(bookings: typeof allBookings) {
      // Sort: tokenOrder > 0 first (by tokenOrder asc), then by createdAt asc
      const sorted = [...bookings].sort((a, b) => {
        const aOrder = a.tokenOrder > 0 ? a.tokenOrder : Infinity
        const bOrder = b.tokenOrder > 0 ? b.tokenOrder : Infinity
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      return sorted.map((booking) => {
        const receptionistName = booking.receptionist?.user?.name || ''
        const shortReceptionistName = receptionistName
          ? receptionistName
              .split(' ')
              .map((n, i) =>
                i === receptionistName.split(' ').length - 1 ? n.charAt(0) + '.' : n
              )
              .join(' ')
          : ''

        return {
          id: booking.id,
          tokenNumber: booking.tokenNumber || null,
          tokenOrder: booking.tokenOrder || 0,
          patientName: booking.patientName || booking.user?.name || 'Walk-in',
          patientImg: booking.user?.profileImg || null,
          disease: booking.disease || '',
          timeSlot: booking.timeSlot || '',
          status: booking.status,
          bookingType: booking.bookingType || 'By Self',
          createdAt: booking.createdAt.toISOString(),
          receptionistName: shortReceptionistName,
        }
      })
    }

    // Helper: compute stats from queue items
    function computeStats(queue: ReturnType<typeof buildQueueItems>) {
      return {
        total: queue.length,
        waiting: queue.filter((q) => q.status === 'Approve').length,
        inConsultation: queue.filter((q) => q.status === 'Visited').length,
        completed: queue.filter((q) => q.status === 'Finish').length,
      }
    }

    // Helper: find current serving (latest Visited)
    function findCurrentServing(queue: ReturnType<typeof buildQueueItems>) {
      const visited = queue.filter((q) => q.status === 'Visited')
      return visited.length > 0
        ? {
            tokenNumber: visited[visited.length - 1].tokenNumber,
            patientName: visited[visited.length - 1].patientName,
          }
        : null
    }

    // Group by department
    const departmentMap: Record<
      string,
      {
        id: string
        name: string
        shortCode: string
        icon: string
        floorNo: string
        opdRoom: string
        doctors: Array<{
          doctorId: string
          doctorName: string
          specialization: string
          designation: string
          queue: ReturnType<typeof buildQueueItems>
          stats: ReturnType<typeof computeStats>
          currentServing: { tokenNumber: string; patientName: string } | null
        }>
      }
    > = {}

    for (const link of doctorLinks) {
      const deptId = link.department.id
      if (!departmentMap[deptId]) {
        departmentMap[deptId] = {
          id: link.department.id,
          name: link.department.name,
          shortCode: link.department.shortCode,
          icon: link.department.icon,
          floorNo: link.department.floorNo,
          opdRoom: link.department.opdRoom,
          doctors: [],
        }
      }

      const doctorBookings = bookingsByDoctor[link.doctorId] || []
      const queue = buildQueueItems(doctorBookings)

      departmentMap[deptId].doctors.push({
        doctorId: link.doctor.id,
        doctorName: link.doctor.user.name,
        specialization: link.doctor.specialization,
        designation: link.designation,
        queue,
        stats: computeStats(queue),
        currentServing: findCurrentServing(queue),
      })
    }

    return NextResponse.json({
      hospital: { id: hospital.id, hospitalName: hospital.hospitalName },
      departments: Object.values(departmentMap),
      date: todayStr,
    })
  } catch (error) {
    console.error('Hospital queue GET error:', error)
    return NextResponse.json({ error: 'Failed to load hospital queue' }, { status: 500 })
  }
}
