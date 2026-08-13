import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns'

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

  const admissions = await db.ipdAdmission.findMany({
    where: { ...hospitalFilter, admissionDate: { gte: start, lte: end } },
    select: {
      initialDiagnosis: true,
      finalDiagnosis: true,
      departmentId: true,
      status: true,
    },
  })

  const diseaseMap: Record<string, { count: number; departments: Set<string> }> = {}

  admissions.forEach(a => {
    const diagnosis = a.finalDiagnosis || a.initialDiagnosis
    if (!diagnosis) return
    const parts = diagnosis.split(',').map(s => s.trim()).filter(Boolean)
    parts.forEach(d => {
      if (!diseaseMap[d]) diseaseMap[d] = { count: 0, departments: new Set() }
      diseaseMap[d].count++
      if (a.departmentId) diseaseMap[d].departments.add(a.departmentId)
    })
  })

  const diseases = Object.entries(diseaseMap)
    .map(([name, data]) => ({
      diagnosis: name,
      admissions: data.count,
      departments: data.departments.size,
    }))
    .sort((a, b) => b.admissions - a.admissions)
    .slice(0, 30)

  const total = admissions.length

  return NextResponse.json({ diseases, totalAdmissions: total })
}
