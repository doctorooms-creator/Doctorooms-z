import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { differenceInDays, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const user = await requireRole(req, 'hospital') || await requireRole(req, 'admin')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

  const periodStart = startOfMonth(new Date(year, month - 1, 1))
  const periodEnd = endOfMonth(new Date(year, month - 1, 1))
  const hospitalFilter = user.role === 'admin' ? {} : { hospitalId: user.id }

  const admissions = await db.ipdAdmission.findMany({
    where: {
      ...hospitalFilter,
      admissionDate: { lte: periodEnd },
      status: { in: ['Discharged', 'Expired', 'DAMA'] },
      dischargeDate: { not: null },
    },
    include: { department: { select: { name: true } } },
  })

  const deptLos: Record<string, { total: number; count: number; min: number; max: number }> = {}

  admissions.forEach(a => {
    if (!a.dischargeDate) return
    const los = differenceInDays(a.dischargeDate, a.admissionDate) + 1
    const dept = a.department?.name || 'Other'
    if (!deptLos[dept]) deptLos[dept] = { total: 0, count: 0, min: Infinity, max: 0 }
    deptLos[dept].total += los
    deptLos[dept].count++
    deptLos[dept].min = Math.min(deptLos[dept].min, los)
    deptLos[dept].max = Math.max(deptLos[dept].max, los)
  })

  const departments = Object.entries(deptLos).map(([dept, data]) => ({
    department: dept,
    avgLos: Math.round((data.total / data.count) * 10) / 10,
    minLos: data.min === Infinity ? 0 : data.min,
    maxLos: data.max,
    totalPatients: data.count,
    totalDays: data.total,
  })).sort((a, b) => b.avgLos - a.avgLos)

  return NextResponse.json({ departments })
}
