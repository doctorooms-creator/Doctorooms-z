import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

// GET /api/lab-reports/[id] — Full report detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.labReport.findUnique({
      where: { id },
      include: {
        testMaster: {
          include: { parameters: { orderBy: { sortOrder: 'asc' } } },
        },
        parameterValues: {
          include: { testParameter: true },
          orderBy: { testParameter: { sortOrder: 'asc' } },
        },
        hospital: { select: { name: true } },
        verifiedBy: { select: { user: { select: { name: true } } } },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Lab report not found' }, { status: 404 })
    }

    return NextResponse.json({ labReport: report })
  } catch (error) {
    console.error('Lab report detail error:', error)
    return NextResponse.json({ error: 'Failed to load lab report' }, { status: 500 })
  }
}
