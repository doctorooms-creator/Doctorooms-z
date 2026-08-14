import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, differenceInDays, format } from 'date-fns'

function getDateRange(period: string, year: number, month: number) {
  const now = new Date()
  let start: Date
  let end: Date = endOfDay(now)
  switch (period) {
    case 'today':
      start = startOfDay(now); break
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 }); break
    case 'year':
      start = startOfYear(new Date(year, 0, 1))
      end = endOfDay(new Date(year, 11, 31)); break
    default:
      start = startOfMonth(new Date(year, month - 1, 1))
      end = endOfDay(new Date(year, month, 0)); break
  }
  return { start, end }
}

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'month'
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  const { start, end } = getDateRange(period, year, month)
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  // Current period admissions
  const admissions = await db.ipdAdmission.findMany({
    where: { ...hospitalFilter, admissionDate: { gte: start, lte: end } },
    include: {
      department: { select: { name: true } },
      ward: { select: { name: true, wardType: true } },
    },
  })

  const totalAdmissions = admissions.length
  const currentlyAdmitted = await db.ipdAdmission.count({
    where: { ...hospitalFilter, status: 'Admitted' },
  })

  const discharged = admissions.filter(a => a.status === 'Discharged' || a.status === 'Expired' || a.status === 'DAMA')
  const expired = admissions.filter(a => a.status === 'Expired').length
  const dama = admissions.filter(a => a.status === 'DAMA').length

  // Average LOS
  let totalLos = 0
  let losCount = 0
  discharged.forEach(a => {
    if (a.dischargeDate) {
      totalLos += differenceInDays(a.dischargeDate, a.admissionDate) + 1
      losCount++
    }
  })
  const avgLos = losCount > 0 ? Math.round((totalLos / losCount) * 10) / 10 : 0

  // Discharge type breakdown
  const dischargeBreakdown: Record<string, number> = {}
  discharged.forEach(a => {
    const dtype = a.dischargeType || a.status
    dischargeBreakdown[dtype] = (dischargeBreakdown[dtype] || 0) + 1
  })

  // Ward breakdown
  const wardMap: Record<string, { total: number; active: number; discharged: number }> = {}
  admissions.forEach(a => {
    const wName = a.ward?.name || 'Unknown'
    if (!wardMap[wName]) wardMap[wName] = { total: 0, active: 0, discharged: 0 }
    wardMap[wName].total++
    if (a.status === 'Admitted') wardMap[wName].active++
    else wardMap[wName].discharged++
  })

  // Also count currently admitted per ward (they might be from prior periods)
  const allActiveAdmissions = await db.ipdAdmission.findMany({
    where: { ...hospitalFilter, status: 'Admitted' },
    include: { ward: { select: { name: true } } },
  })
  const activeWardMap: Record<string, number> = {}
  allActiveAdmissions.forEach(a => {
    const wName = a.ward?.name || 'Unknown'
    activeWardMap[wName] = (activeWardMap[wName] || 0) + 1
  })

  const wardBreakdown = Object.entries(wardMap).map(([name, data]) => ({
    ward: name,
    total: data.total,
    active: activeWardMap[name] || data.active,
    discharged: data.discharged,
  }))

  // Total beds
  const totalBeds = await db.bed.count({
    where: { ward: { hospitalId: user.role === 'admin' ? undefined : user.id } },
  })

  return NextResponse.json({
    totalAdmissions,
    currentlyAdmitted,
    discharged: discharged.length,
    expired,
    dama,
    avgLos,
    totalBeds,
    bedOccupancyRate: totalBeds > 0 ? Math.round((currentlyAdmitted / totalBeds) * 1000) / 10 : 0,
    dischargeBreakdown: Object.entries(dischargeBreakdown).map(([type, count]) => ({ type, count })),
    wardBreakdown,
  })
}
