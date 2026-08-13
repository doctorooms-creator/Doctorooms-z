import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
  const dateStart = startOfDay(new Date(dateStr + 'T00:00:00'))
  const dateEnd = endOfDay(new Date(dateStr + 'T00:00:00'))
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  const bookings = await db.booking.findMany({
    where: {
      ...hospitalFilter,
      bookingDate: { gte: dateStart, lte: dateEnd },
    },
    select: { bookingDate: true, status: true },
  })

  // Group by hour
  const hours: { hour: string; total: number; visited: number }[] = []
  for (let h = 0; h < 24; h++) {
    const hourStr = `${String(h).padStart(2, '0')}:00`
    const hourBookings = bookings.filter(b => {
      const bh = b.bookingDate.getHours()
      return bh === h
    })
    hours.push({
      hour: hourStr,
      total: hourBookings.length,
      visited: hourBookings.filter(b => b.status === 'Visited' || b.status === 'Finish').length,
    })
  }

  const peakHour = hours.reduce((max, h) => h.total > max.total ? h : max, hours[0])
  const totalPatients = bookings.length

  return NextResponse.json({ date: dateStr, hours, peakHour, totalPatients })
}
