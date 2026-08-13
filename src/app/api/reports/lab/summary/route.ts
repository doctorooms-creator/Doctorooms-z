import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, differenceInMinutes, format } from 'date-fns'

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

  const reports = await db.labReport.findMany({
    where: { ...hospitalFilter, createdAt: { gte: start, lte: end } },
    include: { testMaster: { select: { name: true, category: true, rate: true } } },
  })

  const totalReports = reports.length
  const ordered = reports.filter(r => r.status === 'Ordered').length
  const collected = reports.filter(r => r.status === 'Collected').length
  const processing = reports.filter(r => r.status === 'Processing' || r.status === 'ResultEntered').length
  const verified = reports.filter(r => r.status === 'Verified' || r.status === 'Filed').length
  const urgent = reports.filter(r => r.urgency === 'Urgent' || r.urgency === 'Stat').length

  // Revenue
  const totalRevenue = reports.reduce((s, r) => s + (r.testMaster?.rate || 0), 0)

  // Category breakdown
  const catMap: Record<string, { count: number; revenue: number }> = {}
  reports.forEach(r => {
    const cat = r.testMaster?.category || 'Uncategorized'
    if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 }
    catMap[cat].count++
    catMap[cat].revenue += r.testMaster?.rate || 0
  })
  const categories = Object.entries(catMap)
    .map(([category, data]) => ({ category, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
    .sort((a, b) => b.count - a.count)

  // Top tests
  const testMap: Record<string, { name: string; count: number }> = {}
  reports.forEach(r => {
    const name = r.testMaster?.name || 'Unknown'
    if (!testMap[name]) testMap[name] = { name, count: 0 }
    testMap[name].count++
  })
  const topTests = Object.values(testMap).sort((a, b) => b.count - a.count).slice(0, 15)

  return NextResponse.json({
    totalReports, ordered, collected, processing, verified, urgent,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    categories, topTests,
  })
}
