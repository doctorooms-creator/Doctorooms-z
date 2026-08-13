import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { getCurrentShift } from '@/lib/ipd-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({
      where: { userId: user.id },
      include: { hospital: true, ward: true },
    })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    const shift = getCurrentShift()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // My patient count for current shift
    const myPatientCount = await db.nursePatientAssignment.count({
      where: {
        nurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
        shiftType: shift,
        status: 'Active',
      },
    })

    // Get my assigned admission IDs for this shift
    const assignments = await db.nursePatientAssignment.findMany({
      where: {
        nurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
        shiftType: shift,
        status: 'Active',
      },
      select: { admissionId: true },
    })
    const admissionIds = assignments.map((a) => a.admissionId)

    // Pending medicines due in next 2 hours
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    let pendingMedicines = 0
    let overdueMedicines = 0

    if (admissionIds.length > 0) {
      // Get all active orders for my patients
      const activeOrders = await db.doctorOrder.findMany({
        where: {
          admissionId: { in: admissionIds },
          status: 'Active',
        },
        select: {
          id: true,
          scheduledTime: true,
          admissionId: true,
          administrations: {
            where: {
              scheduledTime: { gte: todayStart, lte: todayEnd },
            },
            select: { id: true, status: true },
          },
        },
      })

      for (const order of activeOrders) {
        // Parse scheduled time "HH:MM" into today's DateTime
        const [h, m] = order.scheduledTime.split(':').map(Number)
        const scheduledDt = new Date()
        scheduledDt.setHours(h, m, 0, 0)

        // Check if already administered for this scheduled time today
        const administered = order.administrations.find(
          (a) => a.status === 'Given'
        )
        if (administered) continue

        if (scheduledDt <= now) {
          overdueMedicines++
        } else if (scheduledDt <= twoHoursLater) {
          pendingMedicines++
        }
      }
    }

    // Pending sample collections
    let pendingSamples = 0
    if (admissionIds.length > 0) {
      pendingSamples = await db.sampleCollection.count({
        where: {
          admissionId: { in: admissionIds },
          nurseId: nurse.id,
          status: { in: ['Ordered', 'Collected'] },
        },
      })
    }

    // Today's alert count for this nurse
    const todayAlerts = await db.notification.count({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart, lte: todayEnd },
        status: 'UNREAD',
      },
    })

    return NextResponse.json({
      myPatientCount,
      pendingMedicines,
      overdueMedicines,
      pendingSamples,
      todayAlerts,
      wardName: nurse.ward?.name || 'Floating',
      shift,
      nurseName: user.name,
      hospitalName: nurse.hospital?.name || '',
    })
  } catch (error) {
    console.error('Nurse dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
