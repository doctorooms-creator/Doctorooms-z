'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { Stethoscope, CalendarDays, Activity, ArrowRight, Star, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface HospitalStats {
  totalDoctors: number
  totalAppointments: number
  patientVisits: number
  doctors: {
    id: string
    name: string
    profileImg: string | null
    specialization: string
    status: string
    totalAppointments: number
    avgRating: number
  }[]
  recentAppointments: {
    id: string
    appointmentNo: string
    patientName: string
    doctorName: string
    doctorImg: string | null
    date: string
    status: string
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

const doctorStatusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Block: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export default function HospitalDashboardPage() {
  const { data: stats, isLoading } = useQuery<HospitalStats>({
    queryKey: ['hospital-stats'],
    queryFn: () => fetch('/api/dashboard/hospital/stats').then((r) => r.json()),
  })

  if (isLoading) {
    return <HospitalDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors ?? 0}
          icon={Stethoscope}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Total Appointments"
          value={stats?.totalAppointments ?? 0}
          icon={CalendarDays}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Patient Visits"
          value={stats?.patientVisits ?? 0}
          icon={Activity}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Associated doctors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Associated Doctors</CardTitle>
            <Link href="/dashboard/hospital/doctors">
              <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 dark:text-teal-400">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {stats?.doctors?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No doctors linked yet
                </p>
              )}
              <div className="divide-y divide-border">
                {stats?.doctors?.map((doctor, i) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={doctor.profileImg || ''} />
                      <AvatarFallback className="text-xs bg-teal-100 dark:bg-teal-900/50">
                        {doctor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doctor.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doctor.specialization || 'General'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {doctor.avgRating > 0 && (
                        <div className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {doctor.avgRating}
                        </div>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                          doctorStatusColors[doctor.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {doctor.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Appointments</CardTitle>
            <Link href="/dashboard/hospital/appointments">
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
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentAppointments?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No appointments yet
                    </TableCell>
                  </TableRow>
                )}
                {stats?.recentAppointments?.map((appt, i) => (
                  <motion.tr
                    key={appt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{appt.patientName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={appt.doctorImg || ''} />
                          <AvatarFallback className="text-xs">{appt.doctorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {appt.doctorName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(appt.date), 'MMM d, yyyy')}
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
    </div>
  )
}

function HospitalDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-4 w-28 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
