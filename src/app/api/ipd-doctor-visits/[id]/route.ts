import { requireRole, requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      examinationFindings,
      currentDiagnosis,
      newOrders,
      stoppedOrders,
      advise,
    } = body

    const visit = await db.doctorVisit.findUnique({ where: { id } })
    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    if (visit.doctorId !== doctor.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Cannot update another doctor\'s visit' }, { status: 403 })
    }

    const updated = await db.doctorVisit.update({
      where: { id },
      data: {
        ...(examinationFindings !== undefined && { examinationFindings }),
        ...(currentDiagnosis !== undefined && { currentDiagnosis }),
        ...(newOrders !== undefined && {
          newOrders: typeof newOrders === 'string' ? newOrders : JSON.stringify(newOrders),
        }),
        ...(stoppedOrders !== undefined && {
          stoppedOrders: typeof stoppedOrders === 'string' ? stoppedOrders : JSON.stringify(stoppedOrders),
        }),
        ...(advise !== undefined && { advise }),
      },
    })

    return NextResponse.json({ visit: { id: updated.id } })
  } catch (error) {
    console.error('IPD doctor visit PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
