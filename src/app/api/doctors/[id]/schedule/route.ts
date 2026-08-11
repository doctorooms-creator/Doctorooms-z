import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * PUBLIC endpoint — no auth required.
 * Returns a doctor's weekly schedule, holiday list, and pre-computed time slots.
 * Used by the patient booking flow.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // The id here is the User ID (since the public doctor detail page uses user.id)
    // But it could also be the Doctor.id — check both
    let doctor = await db.doctor.findUnique({
      where: { userId: id },
      select: {
        id: true,
        userId: true,
        fees: true,
        emergencyCharge: true,
        dailyLimit: true,
        bookingDays: true,
      },
    })

    // If not found by userId, try by doctor.id
    if (!doctor) {
      doctor = await db.doctor.findUnique({
        where: { id: id },
        select: {
          id: true,
          userId: true,
          fees: true,
          emergencyCharge: true,
          dailyLimit: true,
          bookingDays: true,
        },
      })
    }

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Get schedules
    const schedules = await db.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { day: 'asc' },
    })

    // Get holidays (next 180 days from today)
    const today = new Date()
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + (doctor.bookingDays || 180))

    const holidays = await db.doctorHoliday.findMany({
      where: {
        userId: doctor.userId,
        date: { gte: today, lt: maxDate },
      },
      select: {
        date: true,
        remark: true,
      },
      orderBy: { date: 'asc' },
    })

    // Generate time slots for each schedule — prefer manual slots over auto-generated
    const schedulesWithSlots = schedules.map((s) => {
      let parsedManual: string[] = []
      try {
        parsedManual = JSON.parse(s.timeSlots || '[]')
      } catch {
        parsedManual = []
      }
      // If manual slots exist and are non-empty, use them; otherwise auto-generate
      const useManual = Array.isArray(parsedManual) && parsedManual.length > 0
      return {
        id: s.id,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration,
        timeSlots: useManual
          ? parsedManual
          : generateTimeSlots(s.startTime, s.endTime, s.slotDuration),
      }
    })

    return NextResponse.json({
      doctorId: doctor.id,
      userId: doctor.userId,
      fees: doctor.fees,
      emergencyCharge: doctor.emergencyCharge,
      dailyLimit: doctor.dailyLimit,
      bookingDays: doctor.bookingDays || 180,
      schedules: schedulesWithSlots,
      holidays: holidays.map((h) => ({
        date: h.date.toISOString().split('T')[0],
        remark: h.remark,
      })),
    })
  } catch (error) {
    console.error('Public doctor schedule API error:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let currentMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60)
    const m = currentMinutes % 60
    const period = h >= 12 ? 'PM' : 'AM'
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
    slots.push(`${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`)
    currentMinutes += slotDuration
  }

  return slots
}
