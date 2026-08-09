'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  CheckCircle2,
  Stethoscope,
  FileText,
  CalendarPlus,
  Upload,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PatientStats {
  upcomingAppointments: number
  completedVisits: number
  totalDoctors: number
  medicalDocuments: number
  upcomingList: {
    id: string
    doctorName: string
    doctorImg: string
    doctorSpecialization: string
    date: string
    disease: string
    status: string
    appointmentNo: string
  }[]
  recentActivity: {
    id: string
    type: string
    message: string
    date: string
    status: string
  }[]
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Visited: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400',
}

const activityColors: Record<string, string> = {
  Pending: 'bg-amber-500',
  Approve: 'bg-blue-500',
  Visited: 'bg-emerald-500',
  Canceled: 'bg-red-500',
  Finish: 'bg-gray-500',
}

export default function PatientDashboardPage() {
  const { data: stats, isLoading } = useQuery<PatientStats>({
    queryKey: ['patient-stats'],
    queryFn: () => fetch('/api/dashboard/patient/stats').then((r) => r.json()),
  })

  if (isLoading) {
    return <PatientDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Appointments"
          value={stats?.upcomingAppointments ?? 0}
          icon={CalendarDays}
          trend={{ value: 12, label: 'from last month' }}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Completed Visits"
          value={stats?.completedVisits ?? 0}
          icon={CheckCircle2}
          trend={{ value: 8, label: 'from last month' }}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors ?? 0}
          icon={Stethoscope}
          trend={{ value: 5, label: 'all time' }}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Medical Documents"
          value={stats?.medicalDocuments ?? 0}
          icon={FileText}
          trend={{ value: 15, label: 'from last month' }}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 dark:text-teal-400" asChild>
              <Link href="/dashboard/patient/appointments">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.upcomingList?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No upcoming appointments</p>
                <Button variant="outline" size="sm" className="mt-4 text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50" asChild>
                  <Link href="/doctors">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats?.upcomingList?.map((appt, i) => (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={`/dashboard/patient/appointments/${appt.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={appt.doctorImg} />
                        <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {appt.doctorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.doctorName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {appt.doctorSpecialization} {appt.disease ? `• ${appt.disease}` : ''}
                        </p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <p className="text-xs font-medium">
                          {format(new Date(appt.date), 'MMM d, yyyy')}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                asChild
              >
                <Link href="/doctors">
                  <CalendarPlus className="h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50"
                asChild
              >
                <Link href="/dashboard/patient/health-records">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <Link href="/dashboard/patient/appointments">
                  <CalendarDays className="h-4 w-4" />
                  My Appointments
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <Link href="/dashboard/patient/feedback">
                  <FileText className="h-4 w-4" />
                  Give Feedback
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity?.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats?.recentActivity?.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="relative mt-1">
                        <div
                          className={cn(
                            'h-2.5 w-2.5 rounded-full',
                            activityColors[activity.status] || 'bg-gray-400'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{activity.message}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PatientDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
