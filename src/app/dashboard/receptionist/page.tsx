'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarDays, Users, Clock, ArrowRight, Plus, Stethoscope, ClipboardCheck } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ReceptionistStats {
  todayAppointments: number
  totalPatients: number
  pendingApprovals: number
  doctor: {
    id: string
    name: string
    profileImg: string | null
    specialization: string
  } | null
  todayAppointmentsList: {
    id: string
    appointmentNo: string
    patientName: string
    patientImg: string | null
    doctorName: string
    date: string
    status: string
    disease: string
    charge: number
  }[]
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Extend: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
}

export default function ReceptionistDashboardPage() {
  const router = useRouter()
  const { data: stats, isLoading } = useQuery<ReceptionistStats>({
    queryKey: ['receptionist-stats'],
    queryFn: () => fetch('/api/dashboard/receptionist/stats').then((r) => r.json()),
  })

  if (isLoading) {
    return <ReceptionistDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Doctor info banner */}
      {stats?.doctor && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900 dark:bg-teal-950/30"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={stats.doctor.profileImg || ''} />
            <AvatarFallback className="bg-teal-100 dark:bg-teal-900/50 text-lg">
              {stats.doctor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-medium text-muted-foreground">Working with</p>
            </div>
            <p className="text-lg font-semibold">{stats.doctor.name}</p>
            {stats.doctor.specialization && (
              <p className="text-sm text-muted-foreground">{stats.doctor.specialization}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          icon={CalendarDays}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={Users}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          icon={Clock}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          onClick={() => router.push('/dashboard/receptionist/appointments')}
          className="flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/receptionist/appointments')}
          className="flex items-center gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          Manage Appointments
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/receptionist/pending-bookings')}
          className="flex items-center gap-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          Pending Bookings
          {stats?.pendingApprovals !== undefined && stats.pendingApprovals > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
              {stats.pendingApprovals}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/receptionist/patients')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          View Patients
        </Button>
      </div>

      {/* Today's appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Today's Appointments</CardTitle>
          <Link href="/dashboard/receptionist/appointments">
            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 dark:text-teal-400">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.todayAppointmentsList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No appointments scheduled for today
                  </TableCell>
                </TableRow>
              )}
              {stats?.todayAppointmentsList?.map((appt, i) => (
                <motion.tr
                  key={appt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={appt.patientImg || ''} />
                        <AvatarFallback className="text-xs">{appt.patientName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{appt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{appt.appointmentNo}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(appt.date), 'h:mm a')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {appt.disease || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {appt.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{appt.charge.toLocaleString('en-IN')}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ReceptionistDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="h-5 w-44 animate-pulse rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
