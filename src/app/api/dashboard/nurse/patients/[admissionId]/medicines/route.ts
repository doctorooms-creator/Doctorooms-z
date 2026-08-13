import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { admissionId } = await params

    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const orders = await db.doctorOrder.findMany({
      where: {
        admissionId,
        status: 'Active',
      },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        administrations: {
          where: {
            scheduledTime: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { scheduledTime: 'desc' },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    })

    // Determine status per order
    const ordersWithStatus = orders.map((order) => {
      const [h, m] = order.scheduledTime.split(':').map(Number)
      const scheduledDt = new Date()
      scheduledDt.setHours(h, m, 0, 0)

      // Check today's administration for this scheduled time
      const todayAdmin = order.administrations.find(
        (a) => a.status === 'Given' || a.status === 'Missed' || a.status === 'Refused' || a.status === 'Skipped' || a.status === 'NotAvailable'
      )

      let status: 'Given' | 'Pending' | 'Overdue' | 'Missed' | 'Refused' | 'Skipped' | 'NotAvailable' = 'Pending'
      if (todayAdmin) {
        status = todayAdmin.status as typeof status
      } else if (scheduledDt < now) {
        // Overdue if more than 30 minutes past scheduled time
        const diffMin = (now.getTime() - scheduledDt.getTime()) / (1000 * 60)
        if (diffMin > 30) {
          status = 'Overdue'
        }
      }

      return {
        id: order.id,
        drugName: order.drugName,
        route: order.route,
        dose: order.dose,
        frequency: order.frequency,
        scheduledTime: order.scheduledTime,
        startDate: order.startDate.toISOString(),
        endDate: order.endDate?.toISOString() || null,
        instructions: order.instructions,
        isPrn: order.isPrn,
        isStat: order.isStat,
        doctorName: order.doctor?.user?.name || '',
        status,
        latestAdmin: todayAdmin
          ? {
              id: todayAdmin.id,
              status: todayAdmin.status,
              administeredTime: todayAdmin.administeredTime?.toISOString() || null,
              remarks: todayAdmin.remarks,
            }
          : null,
      }
    })

    // Group by scheduled time
    const grouped = ordersWithStatus.reduce(
      (acc, order) => {
        const key = order.scheduledTime
        if (!acc[key]) acc[key] = []
        acc[key].push(order)
        return acc
      },
      {} as Record<string, typeof ordersWithStatus>
    )

    return NextResponse.json({
      orders: ordersWithStatus,
      grouped,
    })
  } catch (error) {
    console.error('Get medicines error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
