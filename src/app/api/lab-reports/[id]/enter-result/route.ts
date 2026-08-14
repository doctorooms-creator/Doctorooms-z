import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

// PUT /api/lab-reports/[id]/enter-result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'lab_technician')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.labReport.findUnique({
      where: { id },
      include: { parameterValues: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'SampleCollected') {
      return NextResponse.json({ error: 'Report must be in SampleCollected status' }, { status: 400 })
    }

    const body = await request.json()
    const { values } = body

    if (!Array.isArray(values)) {
      return NextResponse.json({ error: 'values array is required' }, { status: 400 })
    }

    // Process each value and auto-calculate isAbnormal
    const updates = await Promise.all(
      values.map(async (v: { parameterId: string; value: string; remarks?: string }) => {
        // Find the parameter value record
        const pv = report.parameterValues.find((p) => p.id === v.parameterId)
        if (!pv) return null

        // Get test parameter for normal ranges
        const testParam = await db.labTestParameter.findUnique({
          where: { id: pv.testParameterId },
        })

        // Determine if abnormal based on gender and value
        let isAbnormal = false
        const numValue = parseFloat(v.value)
        if (!isNaN(numValue) && testParam) {
          let min = 0
          let max = 0
          if (report.patientGender?.toLowerCase() === 'female') {
            min = testParam.normalFemaleMin
            max = testParam.normalFemaleMax
          } else if (report.patientAge < 14) {
            min = testParam.normalChildMin
            max = testParam.normalChildMax
          } else {
            min = testParam.normalMaleMin
            max = testParam.normalMaleMax
          }
          // Abnormal if outside range (only if range is set)
          if (min > 0 || max > 0) {
            isAbnormal = numValue < min || numValue > max
          }
        }

        return db.labParameterValue.update({
          where: { id: v.parameterId },
          data: {
            value: v.value,
            remarks: v.remarks || '',
            isAbnormal,
          },
        })
      })
    )

    // Update report status
    await db.labReport.update({
      where: { id },
      data: {
        status: 'ResultEntered',
        resultEnteredAt: new Date(),
        resultEnteredBy: user.id,
      },
    })

    return NextResponse.json({ success: true, updatedCount: updates.filter(Boolean).length })
  } catch (error) {
    console.error('Enter result error:', error)
    return NextResponse.json({ error: 'Failed to enter results' }, { status: 500 })
  }
}
