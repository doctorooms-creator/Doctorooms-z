import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

/**
 * GET — Return all schedules with their manual timeSlots for the logged-in doctor.
 * PUT — Update the timeSlots JSON field for a specific day's schedule.
 */

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const schedules = await db.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        day: true,
        startTime: true,
        endTime: true,
        slotDuration: true,
        timeSlots: true,
      },
    })

    // Parse timeSlots JSON for each schedule
    const schedulesWithParsedSlots = schedules.map((s) => ({
      ...s,
      manualSlots: JSON.parse(s.timeSlots || '[]') as string[],
    }))

    return NextResponse.json({ schedules: schedulesWithParsedSlots })
  } catch (error) {
    console.error('Doctor slots GET error:', error)
    return NextResponse.json({ error: 'Failed to load slots' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { day, timeSlots } = body as { day: string; timeSlots: string[] }

    if (!day) {
      return NextResponse.json({ error: 'Day is required' }, { status: 400 })
    }
    if (!Array.isArray(timeSlots)) {
      return NextResponse.json({ error: 'timeSlots must be an array' }, { status: 400 })
    }

    const existing = await db.doctorSchedule.findFirst({
      where: { doctorId: doctor.id, day },
    })

    if (existing) {
      const updated = await db.doctorSchedule.update({
        where: { id: existing.id },
        data: { timeSlots: JSON.stringify(timeSlots) },
      })
      return NextResponse.json({
        success: true,
        schedule: {
          ...updated,
          manualSlots: timeSlots,
        },
      })
    }

    // Create a new schedule with default times and the provided slots
    const created = await db.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        day,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        timeSlots: JSON.stringify(timeSlots),
      },
    })

    return NextResponse.json({
      success: true,
      schedule: {
        ...created,
        manualSlots: timeSlots,
      },
    })
  } catch (error) {
    console.error('Doctor slots PUT error:', error)
    return NextResponse.json({ error: 'Failed to update slots' }, { status: 500 })
  }
}
