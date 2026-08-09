import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      include: {
        user: { select: { name: true, profileImg: true, id: true } },
        schedules: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Fetch upcoming holidays (from today onwards)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const holidays = await db.doctorHoliday.findMany({
      where: {
        userId: doctor.userId,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 30,
    })

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Build schedule map
    const scheduleMap: Record<string, { day: string; startTime: string; endTime: string; slotDuration: number; timeSlots: string[] } | null> = {}
    for (const s of doctor.schedules) {
      const slots = s.timeSlots ? JSON.parse(s.timeSlots) as string[] : []
      scheduleMap[s.day] = {
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration,
        timeSlots: slots,
      }
    }

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        profileImg: doctor.user.profileImg,
        specialization: doctor.specialization,
      },
      schedules: days.map(day => scheduleMap[day] || null),
      holidays: holidays.map(h => ({
        id: h.id,
        date: h.date.toISOString(),
        remark: h.remark,
      })),
      todayName,
    })
  } catch (error) {
    console.error('Receptionist schedule error:', error)
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 })
  }
}
