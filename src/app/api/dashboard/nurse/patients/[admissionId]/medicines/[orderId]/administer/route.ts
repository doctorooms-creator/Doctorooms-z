import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ admissionId: string; orderId: string }> }
) {
  try {
    const user = await requireRole(req, 'nurse')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nurse = await db.staffNurse.findUnique({
      where: { userId: user.id },
    })
    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
    }

    const { admissionId, orderId } = await params
    const body = await req.json()
    const { status, remarks } = body

    const validStatuses = ['Given', 'Missed', 'Refused', 'Skipped', 'NotAvailable']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the order
    const order = await db.doctorOrder.findFirst({
      where: { id: orderId, admissionId, status: 'Active' },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Parse scheduled time for today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [h, m] = order.scheduledTime.split(':').map(Number)
    const scheduledDt = new Date()
    scheduledDt.setHours(h, m, 0, 0)

    // Check if already administered for this scheduled time today
    const existing = await db.medicineAdministration.findFirst({
      where: {
        orderId,
        admissionId,
        scheduledTime: { gte: todayStart, lte: todayEnd },
        status: { in: ['Given', 'Missed', 'Refused', 'Skipped', 'NotAvailable'] },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already administered for this time slot' }, { status: 400 })
    }

    const admin = await db.medicineAdministration.create({
      data: {
        orderId,
        admissionId,
        nurseId: nurse.id,
        scheduledTime: scheduledDt,
        administeredTime: status === 'Given' ? new Date() : null,
        status,
        remarks: remarks || '',
      },
    })

    return NextResponse.json({
      administration: {
        id: admin.id,
        status: admin.status,
        administeredTime: admin.administeredTime?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Administer medicine error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
