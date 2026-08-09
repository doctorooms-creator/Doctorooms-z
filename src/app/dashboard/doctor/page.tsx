'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CalendarDays,
  Users,
  FileText,
  Star,
  ArrowRight,
  Clock,
  Stethoscope,
  PenSquare,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DoctorStats {
  todayAppointments: number
  totalPatients: number
  pendingPrescriptions: number
  averageRating: string
  todayList: {
    id: string
    appointmentNo: string
    patientName: string
    patientImg: string
    disease: string
    date: string
    status: string
  }[]
  recentReviews: {
    id: string
    patientName: string
    patientImg: string
    star: number
    review: string
    date: string
  }[]
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
}

export default function DoctorDashboardPage() {
  const { data: stats, isLoading } = useQuery<DoctorStats>({
    queryKey: ['doctor-stats'],
    queryFn: () => fetch('/api/dashboard/doctor/stats').then((r) => r.json()),
  })

  if (isLoading) return <DoctorDashboardSkeleton />

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          icon={CalendarDays}
          trend={{ value: 12, label: 'from yesterday' }}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={Users}
          trend={{ value: 8, label: 'this month' }}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          title="Pending Prescriptions"
          value={stats?.pendingPrescriptions ?? 0}
          icon={FileText}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Average Rating"
          value={stats?.averageRating ?? '0.0'}
          icon={Star}
          trend={{ value: 5, label: 'this month' }}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Today's Schedule
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 dark:text-teal-400" asChild>
              <Link href="/dashboard/doctor/appointments">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {stats?.todayList?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No appointments today</p>
                </div>
              )}
              {stats?.todayList?.map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={appt.patientImg || ''} />
                    <AvatarFallback className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                      {appt.patientName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{appt.patientName}</p>
                    <p className="text-xs text-muted-foreground">{appt.disease || 'General checkup'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appt.date), 'h:mm a')}
                    </p>
                    <Badge
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {appt.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {stats?.recentReviews?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Star className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No reviews yet</p>
                </div>
              )}
              {stats?.recentReviews?.map((rev, i) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="space-y-1.5 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={rev.patientImg || ''} />
                      <AvatarFallback className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        {rev.patientName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{rev.patientName}</span>
                    <div className="ml-auto flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-3 w-3',
                            s < rev.star
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.review && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{rev.review}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'New Prescription', icon: PenSquare, href: '/dashboard/doctor/prescriptions/new', color: 'text-teal-600 dark:text-teal-400' },
          { label: 'Manage Schedule', icon: Clock, href: '/dashboard/doctor/schedule', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'My Patients', icon: Users, href: '/dashboard/doctor/patients', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Edit Profile', icon: Stethoscope, href: '/dashboard/doctor/profile', color: 'text-violet-600 dark:text-violet-400' },
        ].map((action, i) => (
          <motion.a
            key={action.label}
            href={action.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <action.icon className={cn('h-5 w-5', action.color)} />
            <span className="text-sm font-medium">{action.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </motion.a>
        ))}
      </div>
    </div>
  )
}

function DoctorDashboardSkeleton() {
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}