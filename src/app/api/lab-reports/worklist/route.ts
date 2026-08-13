import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireAuth } from '@/lib/api-auth'

// GET /api/lab-reports/worklist — Worklist for lab tech
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['lab_technician', 'hospital'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let hospitalId: string | undefined
    if (user.role === 'lab_technician') {
      const tech = await db.labTechnician.findUnique({ where: { userId: user.id } })
      if (tech) hospitalId = tech.hospitalId
    } else if (user.role === 'hospital') {
      const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
      if (hospital) hospitalId = hospital.id
    }

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'Ordered,SampleCollected'
    const urgencyFilter = searchParams.get('urgency') || undefined

    const statusList = statusFilter.split(',').filter(Boolean)

    const worklist = await db.labReport.findMany({
      where: {
        hospitalId,
        status: { in: statusList },
        ...(urgencyFilter && { urgency: urgencyFilter }),
      },
      orderBy: [
        { urgency: 'desc' }, // Urgent first
        { createdAt: 'asc' },
      ],
      include: {
        testMaster: { select: { name: true, shortCode: true, category: true } },
      },
      take: 200,
    })

    return NextResponse.json({ worklist })
  } catch (error) {
    console.error('Lab worklist error:', error)
    return NextResponse.json({ error: 'Failed to load worklist' }, { status: 500 })
  }
}
