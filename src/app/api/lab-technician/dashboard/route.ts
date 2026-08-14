import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

// GET /api/lab-technician/dashboard — Stats for lab tech
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'lab_technician')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tech = await db.labTechnician.findUnique({
      where: { userId: user.id },
      include: { hospital: { select: { name: true } } },
    })

    if (!tech) {
      return NextResponse.json({ error: 'Lab technician profile not found' }, { status: 404 })
    }

    const hospitalId = tech.hospitalId

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [ordered, sampleCollected, resultEntered, verified, todayReports] = await Promise.all([
      db.labReport.count({ where: { hospitalId, status: 'Ordered' } }),
      db.labReport.count({ where: { hospitalId, status: 'SampleCollected' } }),
      db.labReport.count({ where: { hospitalId, status: 'ResultEntered' } }),
      db.labReport.count({ where: { hospitalId, status: 'Verified' } }),
      db.labReport.count({ where: { hospitalId, createdAt: { gte: today } } }),
    ])

    return NextResponse.json({
      stats: {
        ordered,
        sampleCollected,
        resultEntered,
        verified,
        todayReports,
        totalPending: ordered + sampleCollected,
        hospitalName: tech.hospital.name,
        techName: user.name,
        qualification: tech.qualification,
        specialization: tech.specialization,
      },
    })
  } catch (error) {
    console.error('Lab technician dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
