import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { emitNotification, roleRoom } from '@/lib/emit-notification'
import { validateBody, createOtScheduleSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      const hospitalUser = await requireRole(req, 'hospital')
      if (!hospitalUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      let effectiveUser = hospitalUser
    } else {
      let effectiveUser = user
    }

    const body = await req.json()
    const v = validateBody(createOtScheduleSchema, body)
    if (!v.success) return v.error
    const {
      otId,
      admissionId,
      surgeryName,
      surgeryType,
      scheduledDate,
      scheduledStartTime,
      estimatedDuration,
      anesthetistId,
      assistantIds,
      notes,
    } = v.data
    const { surgeryCategory, nurseId, otTechnician } = body

    // Get admission with patient info
    const admission = await db.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: { hospital: { select: { id: true, hospitalName: true } } },
    })
    if (!admission) {
      return NextResponse.json({ error: 'Admission not found' }, { status: 404 })
    }

    // Resolve surgeonId
    let surgeonId: string
    if (effectiveUser.role === 'doctor') {
      const doctor = await db.doctor.findUnique({ where: { userId: effectiveUser.id } })
      if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      surgeonId = doctor.id
    } else {
      surgeonId = admission.attendingDoctorId
    }

    // Verify OT exists
    const ot = await db.operationTheater.findUnique({ where: { id: otId } })
    if (!ot) {
      return NextResponse.json({ error: 'Operation theater not found' }, { status: 404 })
    }

    // Auto-generate scheduleNo
    const today = new Date(scheduledDate)
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayCount = await db.otSchedule.count({
      where: { scheduledDate: { gte: today, lt: tomorrow } },
    })
    const scheduleNo = `OT-${new Date().getFullYear()}-${String(todayCount + 1).padStart(4, '0')}`

    const schedule = await db.otSchedule.create({
      data: {
        scheduleNo,
        otId,
        hospitalId: admission.hospitalId,
        admissionId,
        patientName: admission.patientName,
        patientAge: admission.patientAge,
        patientGender: admission.patientGender,
        surgeonId,
        assistantSurgeons: JSON.stringify(assistantIds || []),
        anesthetistId: anesthetistId || null,
        nurseId: nurseId || null,
        otTechnician: otTechnician || '',
        surgeryName,
        surgeryCategory: surgeryCategory || '',
        surgeryType,
        scheduledDate: new Date(scheduledDate),
        scheduledStartTime,
        estimatedDuration,
        notes: notes || '',
        status: 'Scheduled',
      },
    })

    // Update OT status
    await db.operationTheater.update({
      where: { id: otId },
      data: { status: 'Occupied' },
    })

    emitNotification('ot-scheduled', [roleRoom('nurse'), roleRoom('hospital')], {
      id: schedule.id,
      title: 'OT Scheduled',
      message: `Surgery "${surgeryName}" scheduled for ${schedule.patientName}`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ schedule: { id: schedule.id, scheduleNo } }, { status: 201 })
  } catch (error) {
    console.error('OT schedule POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'hospital')
    if (!user) {
      const doctorUser = await requireRole(req, 'doctor')
      if (!doctorUser) {
        const adminUser = await requireRole(req, 'admin')
        if (!adminUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    }

    const { searchParams } = new URL(req.url)
    const otId = searchParams.get('otId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const surgeonId = searchParams.get('surgeonId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (otId) where.otId = otId
    if (surgeonId) where.surgeonId = surgeonId
    if (status) where.status = status
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      where.scheduledDate = { gte: start, lt: end }
    }

    const [schedules, total] = await Promise.all([
      db.otSchedule.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: [{ scheduledDate: 'asc' }, { scheduledStartTime: 'asc' }],
        skip,
        take: limit,
        include: {
          ot: { select: { name: true, otType: true, floorNo: true } },
          surgeon: { include: { user: { select: { name: true } } } },
          admission: { select: { admissionNo: true, bedId: true, wardId: true } },
        },
      }),
      db.otSchedule.count({ where: Object.keys(where).length > 0 ? where : undefined }),
    ])

    return NextResponse.json({
      data: schedules.map((s) => ({
        id: s.id,
        scheduleNo: s.scheduleNo,
        otId: s.otId,
        otName: s.ot.name,
        otType: s.ot.otType,
        otFloor: s.ot.floorNo,
        hospitalId: s.hospitalId,
        admissionId: s.admissionId,
        admissionNo: s.admission.admissionNo,
        patientName: s.patientName,
        patientAge: s.patientAge,
        patientGender: s.patientGender,
        surgeonId: s.surgeonId,
        surgeonName: s.surgeon.user?.name || '',
        assistantSurgeons: s.assistantSurgeons,
        anesthetistId: s.anesthetistId,
        nurseId: s.nurseId,
        otTechnician: s.otTechnician,
        surgeryName: s.surgeryName,
        surgeryCategory: s.surgeryCategory,
        surgeryType: s.surgeryType,
        scheduledDate: s.scheduledDate.toISOString(),
        scheduledStartTime: s.scheduledStartTime,
        estimatedDuration: s.estimatedDuration,
        actualStartTime: s.actualStartTime,
        actualEndTime: s.actualEndTime,
        status: s.status,
        notes: s.notes,
        cancellationReason: s.cancellationReason,
        createdAt: s.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('OT schedules GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
