import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const schedules = await db.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Doctor schedule error:', error)
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { schedules: newSchedules } = body as {
      schedules: { day: string; startTime: string; endTime: string; slotDuration: number }[]
    }

    // Upsert each day's schedule
    await Promise.all(
      newSchedules.map(async (s) => {
        const existing = await db.doctorSchedule.findFirst({
          where: { doctorId: doctor.id, day: s.day },
        })
        if (existing) {
          return db.doctorSchedule.update({
            where: { id: existing.id },
            data: { startTime: s.startTime, endTime: s.endTime, slotDuration: s.slotDuration },
          })
        }
        return db.doctorSchedule.create({
          data: { doctorId: doctor.id, day: s.day, startTime: s.startTime, endTime: s.endTime, slotDuration: s.slotDuration },
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save schedule error:', error)
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 })
  }
}
