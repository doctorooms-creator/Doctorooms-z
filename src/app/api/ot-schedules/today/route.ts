import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve hospitalId
    let hospitalId: string | undefined
    if (user.role === 'hospital') {
      const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
      if (hospital) hospitalId = hospital.id
    } else {
      const { searchParams } = new URL(req.url)
      hospitalId = searchParams.get('hospitalId') || undefined
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all OTs
    const otWhere: Record<string, unknown> = {}
    if (hospitalId) otWhere.hospitalId = hospitalId

    const ots = await db.operationTheater.findMany({
      where: Object.keys(otWhere).length > 0 ? otWhere : undefined,
      orderBy: { name: 'asc' },
    })

    // Get today's schedules
    const scheduleWhere: Record<string, unknown> = {
      scheduledDate: { gte: today, lt: tomorrow },
    }
    if (hospitalId) scheduleWhere.hospitalId = hospitalId

    const schedules = await db.otSchedule.findMany({
      where: scheduleWhere,
      orderBy: [{ scheduledStartTime: 'asc' }],
      include: {
        ot: { select: { name: true, otType: true, floorNo: true } },
        surgeon: { include: { user: { select: { name: true } } } },
        admission: { select: { admissionNo: true } },
      },
    })

    // Group by OT
    const grouped: Record<string, {
      id: string
      name: string
      otType: string
      floorNo: string
      status: string
      surgeries: typeof schedules
    }> = {}

    for (const ot of ots) {
      const otSchedules = schedules.filter((s) => s.otId === ot.id)
      const hasActive = otSchedules.some((s) => s.status === 'InProgress')
      const hasScheduled = otSchedules.some((s) => s.status === 'Scheduled')
      grouped[ot.id] = {
        id: ot.id,
        name: ot.name,
        otType: ot.otType,
        floorNo: ot.floorNo,
        status: hasActive ? 'Occupied' : hasScheduled ? 'Scheduled' : 'Available',
        surgeries: otSchedules.map((s) => ({
          id: s.id,
          scheduleNo: s.scheduleNo,
          patientName: s.patientName,
          patientAge: s.patientAge,
          patientGender: s.patientGender,
          admissionNo: s.admission.admissionNo,
          surgeonName: s.surgeon.user?.name || '',
          surgeryName: s.surgeryName,
          surgeryType: s.surgeryType,
          scheduledStartTime: s.scheduledStartTime,
          estimatedDuration: s.estimatedDuration,
          actualStartTime: s.actualStartTime,
          actualEndTime: s.actualEndTime,
          status: s.status,
          notes: s.notes,
        })),
      }
    }

    return NextResponse.json({
      date: today.toISOString(),
      operationTheaters: Object.values(grouped),
    })
  } catch (error) {
    console.error('OT today board GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
