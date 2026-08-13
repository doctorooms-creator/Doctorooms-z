import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { differenceInMinutes, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  const mStart = startOfMonth(new Date(year, month - 1, 1))
  const mEnd = endOfMonth(new Date(year, month - 1, 1))
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  const reports = await db.labReport.findMany({
    where: { ...hospitalFilter, createdAt: { gte: mStart, lte: mEnd } },
    include: { testMaster: { select: { name: true, category: true, reportDays: true } } },
  })

  // Calculate TAT for verified reports
  const tatData: { reportId: string; testName: string; category: string; orderedAt: Date; verifiedAt: Date | null; tatMinutes: number | null }[] = []

  reports.forEach(r => {
    if (r.verifiedAt) {
      const tat = differenceInMinutes(r.verifiedAt, r.createdAt)
      tatData.push({
        reportId: r.id,
        testName: r.testMaster?.name || 'Unknown',
        category: r.testMaster?.category || 'Uncategorized',
        orderedAt: r.createdAt,
        verifiedAt: r.verifiedAt,
        tatMinutes: tat,
      })
    }
  })

  // Average TAT by test
  const testTat: Record<string, { total: number; count: number; min: number; max: number }> = {}
  tatData.forEach(t => {
    if (!testTat[t.testName]) testTat[t.testName] = { total: 0, count: 0, min: Infinity, max: 0 }
    testTat[t.testName].total += t.tatMinutes!
    testTat[t.testName].count++
    testTat[t.testName].min = Math.min(testTat[t.testName].min, t.tatMinutes!)
    testTat[t.testName].max = Math.max(testTat[t.testName].max, t.tatMinutes!)
  })

  const testTatList = Object.entries(testTat)
    .map(([testName, data]) => ({
      testName,
      avgTatMinutes: Math.round(data.total / data.count),
      avgTatHours: Math.round((data.total / data.count / 60) * 10) / 10,
      minTatMinutes: data.min === Infinity ? 0 : data.min,
      maxTatMinutes: data.max,
      sampleSize: data.count,
    }))
    .sort((a, b) => b.avgTatMinutes - a.avgTatMinutes)

  // Average TAT by category
  const catTat: Record<string, { total: number; count: number }> = {}
  tatData.forEach(t => {
    if (!catTat[t.category]) catTat[t.category] = { total: 0, count: 0 }
    catTat[t.category].total += t.tatMinutes!
    catTat[t.category].count++
  })
  const categoryTat = Object.entries(catTat).map(([category, data]) => ({
    category,
    avgTatMinutes: Math.round(data.total / data.count),
    avgTatHours: Math.round((data.total / data.count / 60) * 10) / 10,
    sampleSize: data.count,
  })).sort((a, b) => b.avgTatMinutes - a.avgTatMinutes)

  // Overall
  const overallAvg = tatData.length > 0 ? Math.round(tatData.reduce((s, t) => s + t.tatMinutes!, 0) / tatData.length) : 0
  const withinTarget = tatData.filter(t => t.tatMinutes! <= 240).length // 4 hours target

  return NextResponse.json({
    overallAvgTatMinutes: overallAvg,
    overallAvgTatHours: Math.round((overallAvg / 60) * 10) / 10,
    totalVerified: tatData.length,
    within4Hours: withinTarget,
    within4HoursPercent: tatData.length > 0 ? Math.round((withinTarget / tatData.length) * 1000) / 10 : 0,
    testTat: testTatList,
    categoryTat,
  })
}