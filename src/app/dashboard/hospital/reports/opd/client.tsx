'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, Users, UserCheck, UserX, Clock, IndianRupee, RefreshCw, Footprints } from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

// ============ Types ============
interface SummaryData {
  totalBookings: number; visited: number; canceled: number; pending: number; walkIns: number
  totalRevenue: number; avgPerDay: number
  departmentBreakdown: { department: string; count: number }[]
  dayOfWeekBreakdown: { day: string; count: number }[]
}
interface HourlyData {
  date: string; hours: { hour: string; total: number; visited: number }[]
  peakHour: { hour: string; total: number; visited: number }; totalPatients: number
}

const DOW_COLORS = ['bg-emerald-500','bg-teal-500','bg-amber-500','bg-rose-500','bg-violet-500','bg-sky-500','bg-orange-500']

// ============ Component ============

export default function OpdReportClient() {
  const [period, setPeriod] = useState('month')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear().toString())
  const [month, setMonth] = useState((now.getMonth() + 1).toString())
  const [selectedDate, setSelectedDate] = useState(format(now, 'yyyy-MM-dd'))

  const qp = `?period=${period}&year=${year}&month=${month}`

  const summaryQ = useQuery({
    queryKey: ['opd-summary', period, year, month],
    queryFn: () => fetch(`/api/reports/opd/summary${qp}`).then(r => r.json()),
  })
  const hourlyQ = useQuery({
    queryKey: ['opd-hourly', selectedDate],
    queryFn: () => fetch(`/api/reports/opd/hourly?date=${selectedDate}`).then(r => r.json()),
  })

  const s = summaryQ.data as SummaryData | undefined
  const h = hourlyQ.data as HourlyData | undefined

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxDept = useMemo(() => {
    if (!s?.departmentBreakdown) return 1
    return Math.max(...s.departmentBreakdown.map(d => d.count), 1)
  }, [s?.departmentBreakdown])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxHourly = useMemo(() => {
    if (!h?.hours) return 1
    return Math.max(...h.hours.map(hr => hr.total), 1)
  }, [h?.hours])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxDow = useMemo(() => {
    if (!s?.dayOfWeekBreakdown) return 1
    return Math.max(...s.dayOfWeekBreakdown.map(d => d.count), 1)
  }, [s?.dayOfWeekBreakdown])

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const stats = [
    { title: 'Total Bookings', value: s?.totalBookings ?? '—', icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Visited', value: s?.visited ?? '—', icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50', sub: s ? `${s.totalBookings > 0 ? Math.round((s.visited / s.totalBookings) * 100) : 0}% conversion` : '' },
    { title: 'Walk-ins', value: s?.walkIns ?? '—', icon: Footprints, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Revenue', value: s ? fmt(s.totalRevenue) : '—', icon: IndianRupee, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const refresh = () => { summaryQ.refetch(); hourlyQ.refetch() }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OPD Analytics</h1>
          <p className="text-muted-foreground text-sm">Outpatient department flow and performance</p>
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

      {/* Secondary stats */}
      <div className="flex flex-wrap gap-3">
        <span className="text-sm text-muted-foreground">Avg/day: <span className="font-medium text-foreground">{s?.avgPerDay ?? 0}</span></span>
        <span className="text-sm text-muted-foreground">Canceled: <span className="font-medium text-rose-600">{s?.canceled ?? 0}</span></span>
        <span className="text-sm text-muted-foreground">Pending: <span className="font-medium text-amber-600">{s?.pending ?? 0}</span></span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Department-wise Visits</CardTitle></CardHeader>
          <CardContent>
            {summaryQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {s?.departmentBreakdown?.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[150px]">{d.department}</span>
                      <span>{d.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(d.count / maxDept) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {s?.departmentBreakdown?.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No data</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day of Week */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Visits by Day of Week</CardTitle></CardHeader>
          <CardContent>
            {summaryQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="flex items-end gap-3 h-40">
                {s?.dayOfWeekBreakdown?.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{d.count}</span>
                    <div
                      className={`w-full max-w-[40px] rounded-t ${DOW_COLORS[i]} transition-all duration-500`}
                      style={{ height: `${(d.count / maxDow) * 120}px`, minHeight: '2px' }}
                    />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Patient Flow */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Hourly Patient Flow</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">Total: {h?.totalPatients ?? 0} | Peak: {h?.peakHour?.hour ?? '—'} ({h?.peakHour?.total ?? 0})</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hourlyQ.isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="flex items-end gap-px h-32 overflow-x-auto">
              {h?.hours?.filter(hr => hr.total > 0 || (parseInt(hr.hour) >= 7 && parseInt(hr.hour) <= 21)).map((hr, i) => (
                <div key={i} className="flex-1 min-w-[12px] flex flex-col items-center">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className="w-full max-w-[20px] rounded-t bg-emerald-400 transition-all duration-300"
                      style={{ height: `${(hr.total / maxHourly) * 100}px`, minHeight: hr.total > 0 ? '2px' : '0px' }}
                      title={`${hr.hour}: ${hr.total} booked, ${hr.visited} visited`}
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-0.5 hidden sm:block">{hr.hour.replace(':00','')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
