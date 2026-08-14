import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, format, subDays, differenceInDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }
  const days = parseInt(new URL(req.url).searchParams.get('days') || '30')

  const totalBeds = await db.bed.count({
    where: { ward: { hospitalId: user.role === 'admin' ? undefined : user.id } },
  })

  // Get daily snapshot: for each day, count admissions that were active
  const today = startOfDay(new Date())
  const trends: { date: string; occupied: number; admitted: number; discharged: number; occupancyRate: number }[] = []

  // Get all relevant admissions (admitted within the last `days` days + currently admitted)
  const lookbackStart = subDays(today, days)
  const allAdmissions = await db.ipdAdmission.findMany({
    where: {
      ...hospitalFilter,
      OR: [
        { admissionDate: { gte: lookbackStart } },
        { status: 'Admitted' },
      ],
    },
    select: { admissionDate: true, dischargeDate: true, status: true },
  })

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i)
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    let occupied = 0
    let admitted = 0
    let discharged = 0

    allAdmissions.forEach(a => {
      const admStart = startOfDay(a.admissionDate)
      if (format(admStart, 'yyyy-MM-dd') === dayStr) admitted++
      if (a.dischargeDate && format(startOfDay(a.dischargeDate), 'yyyy-MM-dd') === dayStr) discharged++
      if (a.admissionDate <= dayEnd && (!a.dischargeDate || a.dischargeDate > dayEnd)) occupied++
    })

    trends.push({
      date: dayStr,
      occupied,
      admitted,
      discharged,
      occupancyRate: totalBeds > 0 ? Math.round((occupied / totalBeds) * 1000) / 10 : 0,
    })
  }

  return NextResponse.json({ totalBeds, trends })
}
