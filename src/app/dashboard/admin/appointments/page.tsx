'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  CalendarDays,
  Search,
  Eye,
  Clock,
  IndianRupee,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = ['All', 'Pending', 'Approve', 'Visited', 'Canceled', 'Extend', 'Finish']

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Extend: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
}

const statusIcons: Record<string, typeof Clock> = {
  Pending: AlertCircle,
  Approve: CheckCircle2,
  Visited: CheckCircle2,
  Canceled: XCircle,
  Finish: CheckCircle2,
  Extend: Timer,
}

interface AppointmentItem {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  doctorName: string
  doctorImg: string | null
  doctorSpec: string
  bookingDate: string
  disease: string
  status: string
  bookingType: string
  appointmentCharge: number
  description: string
  patientEmail: string
  patientPhone: string
  gender: string
  age: number | null
}

interface AppointmentsResponse {
  appointments: AppointmentItem[]
  total: number
  statusCounts: Record<string, number>
}

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [viewAppt, setViewAppt] = useState<AppointmentItem | null>(null)

  const { data, isLoading } = useQuery<AppointmentsResponse>({
    queryKey: ['admin-appointments', statusFilter, search],
    queryFn: () =>
      fetch(`/api/dashboard/admin/appointments?status=${statusFilter}&search=${encodeURIComponent(search)}`).then(
        (r) => r.json()
      ),
  })

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
  }, [])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Appointments"
          value={data?.total ?? 0}
          icon={CalendarDays}
          trend={{ value: 15, label: 'from last month' }}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Pending"
          value={data?.statusCounts?.Pending ?? 0}
          icon={Clock}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Completed"
          value={(data?.statusCounts?.Visited ?? 0) + (data?.statusCounts?.Finish ?? 0)}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Canceled"
          value={data?.statusCounts?.Canceled ?? 0}
          icon={XCircle}
          gradient="from-red-500 to-red-600"
          iconBg="bg-red-100 dark:bg-red-900/50"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {s}
                  {data?.statusCounts?.[s] !== undefined && (
                    <span className="ml-1.5 opacity-70">{data.statusCounts[s]}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient or doctor..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">All Appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Disease</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.appointments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">No appointments found</p>
                      </TableCell>
                    </TableRow>
                  )}
                  <AnimatePresence>
                    {data?.appointments?.map((appt, i) => {
                      const StatusIcon = statusIcons[appt.status] || Clock
                      return (
                        <motion.tr
                          key={appt.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="group border-b border-border transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={appt.patientImg || ''} />
                                <AvatarFallback className="text-xs">
                                  {appt.patientName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-medium">{appt.patientName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={appt.doctorImg || ''} />
                                <AvatarFallback className="text-xs">
                                  {appt.doctorName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{appt.doctorName}</p>
                                <p className="text-xs text-muted-foreground">{appt.doctorSpec}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {format(new Date(appt.bookingDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{appt.disease || '—'}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                                statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {appt.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">{appt.bookingType}</span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewAppt(appt)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Appointment Dialog */}
      <Dialog open={!!viewAppt} onOpenChange={() => setViewAppt(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Appointment Details
              <span className="text-xs text-muted-foreground font-normal">
                #{viewAppt?.appointmentNo}
              </span>
            </DialogTitle>
          </DialogHeader>
          {viewAppt && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                    statusColors[viewAppt.status]
                  )}
                >
                  {(() => {
                    const Icon = statusIcons[viewAppt.status] || Clock
                    return <Icon className="h-3.5 w-3.5" />
                  })()}
                  {viewAppt.status}
                </span>
                <span className="text-xs text-muted-foreground">{viewAppt.bookingType}</span>
              </div>

              {/* Patient info */}
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={viewAppt.patientImg || ''} />
                  <AvatarFallback>{viewAppt.patientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium">{viewAppt.patientName}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {viewAppt.gender && <span>{viewAppt.gender}</span>}
                    {viewAppt.age && <span>{viewAppt.age} yrs</span>}
                  </div>
                </div>
              </div>

              {/* Doctor info */}
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={viewAppt.doctorImg || ''} />
                  <AvatarFallback>{viewAppt.doctorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium">{viewAppt.doctorName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{viewAppt.doctorSpec}</p>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(new Date(viewAppt.bookingDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <IndianRupee className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Fee:</span>
                  <span className="font-medium">₹{viewAppt.appointmentCharge.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {viewAppt.disease && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Disease / Symptoms</p>
                  <p className="text-sm">{viewAppt.disease}</p>
                </div>
              )}
              {viewAppt.description && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{viewAppt.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
