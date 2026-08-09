'use client'

import { useEffect, useState } from 'react'
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
import {
  Users,
  Stethoscope,
  CalendarDays,
  IndianRupee,
  UserPlus,
  Building2,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  totalDoctors: number
  totalAppointments: number
  pendingAppointments: number
  revenue: number
  roleDistribution: Record<string, number>
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

const roleColors: Record<string, string> = {
  admin: 'from-red-500 to-red-600',
  doctor: 'from-teal-500 to-teal-600',
  patient: 'from-blue-500 to-blue-600',
  hospital: 'from-amber-500 to-amber-600',
  receptionist: 'from-violet-500 to-violet-600',
  assistant: 'from-pink-500 to-pink-600',
  pharmacist: 'from-emerald-500 to-emerald-600',
}

const roleIconBgs: Record<string, string> = {
  admin: 'bg-red-100 dark:bg-red-900/50',
  doctor: 'bg-teal-100 dark:bg-teal-900/50',
  patient: 'bg-blue-100 dark:bg-blue-900/50',
  hospital: 'bg-amber-100 dark:bg-amber-900/50',
  receptionist: 'bg-violet-100 dark:bg-violet-900/50',
  assistant: 'bg-pink-100 dark:bg-pink-900/50',
  pharmacist: 'bg-emerald-100 dark:bg-emerald-900/50',
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/dashboard/admin/stats').then((r) => r.json()),
  })

  if (isLoading) {
    return <AdminDashboardSkeleton />
  }

  const roleEntries = stats?.roleDistribution
    ? Object.entries(stats.roleDistribution).filter(([, count]) => count > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          trend={{ value: 12, label: 'from last month' }}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          title="Doctors"
          value={stats?.totalDoctors ?? 0}
          icon={Stethoscope}
          trend={{ value: 8, label: 'from last month' }}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Appointments"
          value={stats?.totalAppointments ?? 0}
          icon={CalendarDays}
          trend={{ value: 5, label: 'from last month' }}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Revenue"
          value={`₹${((stats?.revenue ?? 0)).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          trend={{ value: 18, label: 'from last month' }}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent appointments table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Appointments</CardTitle>
            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 dark:text-teal-400">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
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

        {/* User role distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleEntries.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No users yet</p>
            )}
            {roleEntries.map(([role, count], i) => {
              const total = stats?.totalUsers || 1
              const pct = Math.round((count / total) * 100)
              return (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{role}</span>
                    <span className="text-muted-foreground">
                      {count} <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', roleColors[role] || 'bg-gray-400')}
                    />
                  </div>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Add User', icon: UserPlus, href: '/dashboard/admin/users', color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Manage Doctors', icon: Stethoscope, href: '/dashboard/admin/doctors', color: 'text-teal-600 dark:text-teal-400' },
          { label: 'Manage Hospitals', icon: Building2, href: '/dashboard/admin/hospitals', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Write Blog Post', icon: FileText, href: '/dashboard/admin/blog', color: 'text-violet-600 dark:text-violet-400' },
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

function AdminDashboardSkeleton() {
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
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
