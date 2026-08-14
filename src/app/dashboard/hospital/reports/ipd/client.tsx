'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BedDouble, Users, LogOut, Skull, TrendingUp, Clock, Activity, RefreshCw, BarChart3, PieChart as PieIcon } from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============
interface SummaryData {
  totalAdmissions: number; currentlyAdmitted: number; discharged: number
  expired: number; dama: number; avgLos: number; totalBeds: number
  bedOccupancyRate: number; dischargeBreakdown: { type: string; count: number }[]
  wardBreakdown: { ward: string; total: number; active: number; discharged: number }[]
}
interface OccupancyTrend { date: string; occupied: number; admitted: number; discharged: number; occupancyRate: number }
interface LosDept { department: string; avgLos: number; minLos: number; maxLos: number; totalPatients: number; totalDays: number }
interface Disease { diagnosis: string; admissions: number; departments: number }

// ============ Colors ============
const DISCHARGE_COLORS: Record<string, string> = {
  Normal: 'bg-emerald-500', DAMA: 'bg-amber-500', LAMA: 'bg-orange-500', Expired: 'bg-rose-500', Transferred: 'bg-sky-500',
}
const PIE_COLORS = ['bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500']

// ============ Component ============

export default function IpdReportClient() {
  const [period, setPeriod] = useState('month')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear().toString())
  const [month, setMonth] = useState((now.getMonth() + 1).toString())

  const qp = `?period=${period}&year=${year}&month=${month}`

  const summaryQ = useQuery({
    queryKey: ['ipd-summary', period, year, month],
    queryFn: () => fetch(`/api/reports/ipd/summary${qp}`).then(r => r.json()),
  })
  const occupancyQ = useQuery({
    queryKey: ['ipd-occupancy'],
    queryFn: () => fetch('/api/reports/ipd/bed-occupancy?days=30').then(r => r.json()),
  })
  const losQ = useQuery({
    queryKey: ['ipd-los', year, month],
    queryFn: () => fetch(`/api/reports/ipd/length-of-stay?year=${year}&month=${month}`).then(r => r.json()),
  })
  const diseaseQ = useQuery({
    queryKey: ['ipd-disease', period, year, month],
    queryFn: () => fetch(`/api/reports/ipd/disease-wise${qp}`).then(r => r.json()),
  })

  const s = summaryQ.data as SummaryData | undefined
  const occData = occupancyQ.data as { totalBeds: number; trends: OccupancyTrend[] } | undefined
  const losData = losQ.data as { departments: LosDept[] } | undefined
  const disData = diseaseQ.data as { diseases: Disease[]; totalAdmissions: number } | undefined

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxOccupied = useMemo(() => {
    if (!occData?.trends) return 1
    return Math.max(...occData.trends.map(t => t.occupied), 1)
  }, [occData?.trends])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxLos = useMemo(() => {
    if (!losData?.departments) return 1
    return Math.max(...losData.departments.map(d => d.avgLos), 1)
  }, [losData?.departments])

  const stats = [
    { title: 'Total Admissions', value: s?.totalAdmissions ?? '—', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Currently Admitted', value: s?.currentlyAdmitted ?? '—', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50', sub: s ? `${s.bedOccupancyRate}% occupancy` : '' },
    { title: 'Discharged', value: s?.discharged ?? '—', icon: LogOut, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Avg Length of Stay', value: s ? `${s.avgLos} days` : '—', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const refresh = () => { summaryQ.refetch(); occupancyQ.refetch(); losQ.refetch(); diseaseQ.refetch() }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IPD Analytics</h1>
          <p className="text-muted-foreground text-sm">Inpatient department performance and bed utilization</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          {(period === 'month' || period === 'year') && (
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((card, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  {card.sub && <p className="text-muted-foreground text-xs">{card.sub}</p>}
                </div>
                <div className={`rounded-lg p-2.5 ${card.bg}`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><Skull className="h-3.5 w-3.5 text-rose-500" /> Expired: {s?.expired ?? 0}</Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><Activity className="h-3.5 w-3.5 text-amber-500" /> DAMA: {s?.dama ?? 0}</Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><BedDouble className="h-3.5 w-3.5 text-emerald-500" /> Total Beds: {s?.totalBeds ?? 0}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ward Breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Ward Breakdown</CardTitle></CardHeader>
          <CardContent>
            {summaryQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-3">
                {s?.wardBreakdown?.map((w, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{w.ward}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="text-emerald-600">{w.active} active</span>
                        <span className="text-muted-foreground">{w.total} total</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${s.totalBeds > 0 ? (w.active / s.totalBeds) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {s?.wardBreakdown?.length === 0 && <p className="text-muted-foreground text-sm">No data</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discharge Type Pie (CSS) */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Discharge Types</CardTitle></CardHeader>
          <CardContent>
            {summaryQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-3">
                {s?.dischargeBreakdown && s.dischargeBreakdown.length > 0 ? (
                  <>
                    {/* CSS donut chart */}
                    <div className="flex justify-center">
                      <div className="relative h-32 w-32">
                        {(() => {
                          const total = s.dischargeBreakdown.reduce((sum: number, d: { count: number }) => sum + d.count, 0)
                          let cumulative = 0
                          return (
                            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                              {s.dischargeBreakdown.map((d: { type: string; count: number }, i: number) => {
                                const pct = total > 0 ? (d.count / total) * 100 : 0
                                const offset = cumulative
                                cumulative += pct
                                return (
                                  <circle
                                    key={i}
                                    cx="18" cy="18" r="15.91549430918954"
                                    fill="transparent"
                                    stroke={DISCHARGE_COLORS[d.type] || '#94a3b8'}
                                    strokeWidth="3"
                                    strokeDasharray={`${pct} ${100 - pct}`}
                                    strokeDashoffset={`${-offset}`}
                                    className="transition-all duration-500"
                                  />
                                )
                              })}
                            </svg>
                          )
                        })()}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{s.discharged}</span>
                        </div>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {s.dischargeBreakdown.map((d: { type: string; count: number }, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <div className={`h-2.5 w-2.5 rounded-sm ${DISCHARGE_COLORS[d.type] || 'bg-slate-400'}`} />
                          <span>{d.type}: {d.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No discharges in this period</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avg LOS by Dept */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Avg Length of Stay</CardTitle></CardHeader>
          <CardContent>
            {losQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-3">
                {losData?.departments?.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[120px]">{d.department}</span>
                      <span className="font-medium text-xs">{d.avgLos}d (n={d.totalPatients})</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${(d.avgLos / maxLos) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {losData?.departments?.length === 0 && <p className="text-muted-foreground text-sm">No data</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bed Occupancy Trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Bed Occupancy Trend (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {occupancyQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="flex items-end gap-px h-36 overflow-x-auto">
              {occData?.trends?.map((t, i) => (
                <div key={i} className="flex flex-col items-center flex-1 min-w-[6px] group">
                  <div
                    className={`w-full max-w-[16px] rounded-t transition-all duration-300 ${
                      t.occupancyRate > 80 ? 'bg-rose-400' : t.occupancyRate > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ height: `${(t.occupied / maxOccupied) * 120}px`, minHeight: '2px' }}
                    title={`${t.date}: ${t.occupied}/${occData?.totalBeds} beds (${t.occupancyRate}%)`}
                  />
                  <span className="text-[7px] text-muted-foreground mt-0.5 hidden lg:block">
                    {format(new Date(t.date + 'T00:00:00'), 'dd')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> &lt;50%</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> 50-80%</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> &gt;80%</div>
          </div>
        </CardContent>
      </Card>

      {/* Disease-wise Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Top Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          {diseaseQ.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Admissions</TableHead>
                  <TableHead className="text-right">Depts</TableHead>
                  <TableHead className="text-right w-24">Share</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {disData?.diseases?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{d.diagnosis}</TableCell>
                      <TableCell className="text-right font-medium">{d.admissions}</TableCell>
                      <TableCell className="text-right">{d.departments}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${disData.totalAdmissions > 0 ? (d.admissions / disData.totalAdmissions) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{disData.totalAdmissions > 0 ? Math.round((d.admissions / disData.totalAdmissions) * 100) : 0}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {disData?.diseases?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No diagnosis data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
