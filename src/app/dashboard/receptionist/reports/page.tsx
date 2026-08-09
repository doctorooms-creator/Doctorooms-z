'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart3, CalendarDays, Users, CheckCircle2, XCircle, Clock, IndianRupee, ArrowLeftRight, RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { StatCard } from '@/components/dashboard/stat-card'

interface ReportBooking {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  disease: string
  bookingDate: string
  status: string
  appointmentCharge: number
  bookingMode: string
  bookingType: string
  timeSlot: string
}

interface ReportStats {
  total: number
  pending: number
  approved: number
  visited: number
  finished: number
  canceled: number
  extended: number
  revenue: number
}

interface ReportData {
  doctor: { name: string; dailyLimit: number } | null
  date: string
  stats: ReportStats
  bookings: ReportBooking[]
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Extend: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
}

const statusBarColors: Record<string, string> = {
  Pending: 'bg-amber-400',
  Approve: 'bg-emerald-400',
  Visited: 'bg-teal-400',
  Finish: 'bg-blue-400',
  Canceled: 'bg-red-400',
  Extend: 'bg-violet-400',
}

export default function ReceptionistReportsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['receptionist-report', selectedDate],
    queryFn: () => fetch(`/api/dashboard/receptionist/reports?date=${selectedDate}`).then(r => r.json()),
  })

  const stats = data?.stats
  const bookings = data?.bookings ?? []

  const completed = (stats?.visited ?? 0) + (stats?.finished ?? 0)

  // Compute bar segments
  const total = stats?.total ?? 0
  const barSegments = stats
    ? [
        { label: 'Pending', count: stats.pending, color: statusBarColors.Pending },
        { label: 'Approved', count: stats.approved, color: statusBarColors.Approve },
        { label: 'Visited', count: stats.visited, color: statusBarColors.Visited },
        { label: 'Finished', count: stats.finished, color: statusBarColors.Finish },
        { label: 'Canceled', count: stats.canceled, color: statusBarColors.Canceled },
        { label: 'Extended', count: stats.extended, color: statusBarColors.Extend },
      ].filter(s => s.count > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
            <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Daily Report</h2>
            <p className="text-sm text-muted-foreground">Dr. {data?.doctor?.name || '...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="reportDate" className="text-sm text-muted-foreground whitespace-nowrap">Date</Label>
            <Input
              id="reportDate"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          {selectedDate !== today && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="gap-1 text-xs">
              <RotateCcw className="h-3 w-3" /> Today
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      ) : !data ? null : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Appointments" value={stats?.total ?? 0} icon={CalendarDays} gradient="from-teal-500 to-teal-600" iconBg="bg-teal-100 dark:bg-teal-900/50" />
            <StatCard title="Completed" value={completed} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/50" />
            <StatCard title="Canceled" value={stats?.canceled ?? 0} icon={XCircle} gradient="from-red-500 to-red-600" iconBg="bg-red-100 dark:bg-red-900/50" />
            <StatCard title="Revenue" value={`₹${(stats?.revenue ?? 0).toLocaleString('en-IN')}`} icon={IndianRupee} gradient="from-amber-500 to-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/50" />
          </div>

          {/* Secondary Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats?.pending ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approved / Waiting</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stats?.approved ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <ArrowLeftRight className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Extended</p>
                  <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{stats?.extended ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown Bar */}
          {total > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  {barSegments.map(seg => (
                    <motion.div
                      key={seg.label}
                      initial={{ width: 0 }}
                      animate={{ width: `${(seg.count / total) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={cn('h-full', seg.color)}
                      title={`${seg.label}: ${seg.count}`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {barSegments.map(seg => (
                    <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                      <div className={cn('h-2 w-2 rounded-full', seg.color)} />
                      <span className="text-muted-foreground">{seg.label}</span>
                      <span className="font-medium">{seg.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointments Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Disease</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        No appointments for this date
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b, i) => (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={b.patientImg || ''} />
                              <AvatarFallback className="text-[10px]">{b.patientName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{b.patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.disease || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.timeSlot || format(new Date(b.bookingDate), 'h:mm a')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.bookingMode === 'VideoCall' ? 'Video' : 'In-Person'}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', statusColors[b.status] || '')}>
                            {b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">₹{b.appointmentCharge.toLocaleString('en-IN')}</TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
