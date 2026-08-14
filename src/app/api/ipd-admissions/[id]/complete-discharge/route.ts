import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { emitNotification, roleRoom } from '@/lib/emit-notification'
import { validateBody, completeDischargeSchema } from '@/lib/validations'

// POST /api/ipd-admissions/[id]/complete-discharge — Complete discharge with final diagnosis
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = await requireRole(req, 'receptionist')
    if (!user) user = await requireRole(req, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const body = await req.json()
    const v = validateBody(completeDischargeSchema, body)
    if (!v.success) return v.error
    const { finalDiagnosis, dischargeSummary } = v.data

    // Fetch admission
    const admission = await db.ipdAdmission.findUnique({
      where: { id },
      include: {
        bill: { select: { id: true, netPayable: true, status: true } },
      },
    })

    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    if (admission.status !== 'Admitted' && admission.status !== 'Discharged' && admission.status !== 'DAMA' && admission.status !== 'LAMA') {
      return NextResponse.json({ error: 'Invalid admission status for completing discharge' }, { status: 400 })
    }

    // If bill exists and netPayable <= 0, set paymentStatus to Paid
    const updateData: { finalDiagnosis?: string; dischargeSummary?: string; paymentStatus?: string } = {
      finalDiagnosis,
      dischargeSummary,
    }

    if (admission.bill && admission.bill.netPayable <= 0) {
      updateData.paymentStatus = 'Paid'
    }

    const updatedAdmission = await db.ipdAdmission.update({
      where: { id },
      data: updateData,
    })

    emitNotification('discharge-advised', [roleRoom('receptionist'), roleRoom('hospital')], {
      id: updatedAdmission.id,
      title: 'Discharge Completed',
      message: `Discharge completed for ${updatedAdmission.patientName}`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ admission: updatedAdmission })
  } catch (error) {
    console.error('Complete discharge POST error:', error)
    return NextResponse.json({ error: 'Failed to complete discharge' }, { status: 500 })
  }
}
