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

    // --- Incoming handovers: where toNurseId = me, today, current shift ---
    const incomingHandovers = await db.shiftHandover.findMany({
      where: {
        toNurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
        shiftType: shift,
      },
      include: {
        fromNurse: { include: { user: { select: { name: true } } } },
        toNurse: { include: { user: { select: { name: true } } } },
        ward: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // --- My outgoing handovers: where fromNurseId = me, today ---
    const outgoingHandovers = await db.shiftHandover.findMany({
      where: {
        fromNurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
      },
      include: {
        fromNurse: { include: { user: { select: { name: true } } } },
        toNurse: { include: { user: { select: { name: true } } } },
        ward: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // --- My active patient assignments for current shift ---
    const assignments = await db.nursePatientAssignment.findMany({
      where: {
        nurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
        shiftType: shift,
        status: 'Active',
      },
      include: {
        admission: {
          include: {
            bed: { select: { bedNumber: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    // Enrich each assignment with latest vital, pending med count, pending sample count
    const patients = await Promise.all(
      assignments.map(async (assignment) => {
        const adm = assignment.admission

        // Latest vital record
        const latestVital = await db.vitalRecord.findFirst({
          where: { admissionId: adm.id },
          orderBy: { recordedAt: 'desc' },
          select: {
            id: true,
            temperature: true,
            pulse: true,
            spo2: true,
            bpSystolic: true,
            bpDiastolic: true,
            respiratoryRate: true,
            patientStatus: true,
            recordedAt: true,
          },
        })

        // Pending medicines count
        const activeOrders = await db.doctorOrder.findMany({
          where: {
            admissionId: adm.id,
            status: 'Active',
          },
          select: {
            id: true,
            scheduledTime: true,
            administrations: {
              where: { scheduledTime: { gte: todayStart, lte: todayEnd } },
              select: { id: true, status: true },
            },
          },
        })

        let pendingMedCount = 0
        for (const order of activeOrders) {
          const [h, m] = order.scheduledTime.split(':').map(Number)
          const scheduledDt = new Date()
          scheduledDt.setHours(h, m, 0, 0)
          const given = order.administrations.find((a) => a.status === 'Given')
          if (!given && scheduledDt <= new Date(Date.now() + 2 * 60 * 60 * 1000)) {
            pendingMedCount++
          }
        }

        // Pending sample count
        const pendingSampleCount = await db.sampleCollection.count({
          where: {
            admissionId: adm.id,
            status: { in: ['Ordered', 'Collected'] },
          },
        })

        return {
          assignmentId: assignment.id,
          admissionId: adm.id,
          admissionNo: adm.admissionNo,
          patientName: adm.patientName,
          patientAge: adm.patientAge,
          patientGender: adm.patientGender,
          bedNumber: adm.bed?.bedNumber || '',
          initialDiagnosis: adm.initialDiagnosis,
          latestVital: latestVital
            ? {
                ...latestVital,
                recordedAt: latestVital.recordedAt.toISOString(),
              }
            : null,
          pendingMedCount,
          pendingSampleCount,
        }
      })
    )

    // --- Next shift nurses (same ward, next shift) ---
    const shiftOrder: Record<string, string> = {
      Morning: 'Evening',
      Evening: 'Night',
      Night: 'Morning',
    }
    const nextShift = shiftOrder[shift]

    let nextShiftNurses: { id: string; name: string; employeeId: string; shift: string }[] = []
    if (nurse.wardId) {
      nextShiftNurses = await db.staffNurse.findMany({
        where: {
          wardId: nurse.wardId,
          shift: nextShift,
          id: { not: nurse.id },
          user: { status: 'Active' },
        },
        include: { user: { select: { name: true, status: true } } },
        orderBy: { employeeId: 'asc' },
      }).then((nurses) =>
        nurses.map((n) => ({
          id: n.id,
          name: n.user.name,
          employeeId: n.employeeId,
          shift: n.shift,
        }))
      )
    }

    // Fallback: if no ward assigned, look for same hospital
    if (!nurse.wardId) {
      nextShiftNurses = await db.staffNurse.findMany({
        where: {
          hospitalId: nurse.hospitalId,
          shift: nextShift,
          id: { not: nurse.id },
          user: { status: 'Active' },
        },
        include: { user: { select: { name: true, status: true } } },
        orderBy: { employeeId: 'asc' },
      }).then((nurses) =>
        nurses.map((n) => ({
          id: n.id,
          name: n.user.name,
          employeeId: n.employeeId,
          shift: n.shift,
        }))
      )
    }

    // Format handovers for response
    const formatHandover = (h: typeof incomingHandovers[0]) => ({
      id: h.id,
      shiftType: h.shiftType,
      shiftDate: h.shiftDate.toISOString(),
      wardName: h.ward.name,
      fromNurseName: h.fromNurse.user.name,
      toNurseName: h.toNurse.user.name,
      patientSummaries: JSON.parse(h.patientSummaries || '[]'),
      wardNotes: h.wardNotes,
      pendingTasks: JSON.parse(h.pendingTasks || '[]'),
      acknowledgedAt: h.acknowledgedAt?.toISOString() || null,
      acknowledgedBy: h.acknowledgedBy,
      createdAt: h.createdAt.toISOString(),
    })

    return NextResponse.json({
      currentShift: shift,
      wardName: nurse.ward?.name || 'Floating',
      incomingHandovers: incomingHandovers.map(formatHandover),
      outgoingHandovers: outgoingHandovers.map(formatHandover),
      patients,
      nextShiftNurses,
    })
  } catch (error) {
    console.error('Nurse handover GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { toNurseId, patientSummaries, wardNotes, pendingTasks } = body

    if (!toNurseId) {
      return NextResponse.json({ error: 'Target nurse is required' }, { status: 400 })
    }

    // Validate target nurse exists
    const targetNurse = await db.staffNurse.findUnique({
      where: { id: toNurseId },
    })
    if (!targetNurse) {
      return NextResponse.json({ error: 'Target nurse not found' }, { status: 404 })
    }

    const shift = getCurrentShift()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Use ward from nurse or target nurse
    const wardId = nurse.wardId || targetNurse.wardId || ''
    const hospitalId = nurse.hospitalId

    if (!wardId) {
      return NextResponse.json({ error: 'Ward not assigned' }, { status: 400 })
    }

    // Create handover record
    const handover = await db.shiftHandover.create({
      data: {
        hospitalId,
        wardId,
        shiftDate: todayStart,
        shiftType: shift,
        fromNurseId: nurse.id,
        toNurseId,
        patientSummaries: JSON.stringify(patientSummaries || []),
        wardNotes: wardNotes || '',
        pendingTasks: JSON.stringify(pendingTasks || []),
      },
    })

    // Mark the nurse's current shift assignments as Completed
    await db.nursePatientAssignment.updateMany({
      where: {
        nurseId: nurse.id,
        shiftDate: { gte: todayStart, lte: todayEnd },
        shiftType: shift,
        status: 'Active',
      },
      data: {
        status: 'Completed',
        unassignedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      handoverId: handover.id,
      message: 'Shift handover submitted successfully',
    })
  } catch (error) {
    console.error('Nurse handover POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json()
    const { handoverId } = body

    if (!handoverId) {
      return NextResponse.json({ error: 'Handover ID is required' }, { status: 400 })
    }

    // Verify handover belongs to this nurse
    const handover = await db.shiftHandover.findUnique({
      where: { id: handoverId },
    })
    if (!handover) {
      return NextResponse.json({ error: 'Handover not found' }, { status: 404 })
    }
    if (handover.toNurseId !== nurse.id) {
      return NextResponse.json({ error: 'Unauthorized to acknowledge this handover' }, { status: 403 })
    }
    if (handover.acknowledgedAt) {
      return NextResponse.json({ error: 'Handover already acknowledged' }, { status: 400 })
    }

    await db.shiftHandover.update({
      where: { id: handoverId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: nurse.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Handover acknowledged successfully',
    })
  } catch (error) {
    console.error('Nurse handover PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
