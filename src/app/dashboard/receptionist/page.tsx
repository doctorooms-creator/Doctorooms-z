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
import {
  CalendarDays,
  Users,
  Clock,
  ArrowRight,
  Plus,
  Stethoscope,
  ClipboardCheck,
  UserCheck,
  Building2,
  MapPin,
  Phone,
  Heart,
  Brain,
  Eye,
  Bone,
  Baby,
  Pill,
  Activity,
  Microscope,
  Scissors,
  ListOrdered,
  type LucideIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ReceptionistStats {
  isHospitalMode?: boolean
  todayAppointments: number
  todayVisited: number
  pendingApprovals: number
  doctor: {
    id: string
    name: string
    profileImg: string | null
    specialization: string
    contactNo: string
    hospitalAddress: string
    city: string
    state: string
  } | null
  hospital: {
    hospitalName: string
    address: string
    city: string
    state: string
    contactNo: string
  } | null
  todayAppointmentsList: {
    id: string
    appointmentNo: string
    patientName: string
    patientImg: string | null
    doctorName?: string
    date: string
    status: string
    disease: string
    charge: number
  }[]
  departments?: {
    id: string
    name: string
    shortCode: string
    icon: string
    todayCount: number
    activeDoctors: number
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

// Department shortCode → Lucide icon mapping
const departmentIconMap: Record<string, LucideIcon> = {
  CARD: Heart,
  NEUR: Brain,
  ORTH: Bone,
  OPTH: Eye,
  GYNE: Baby,
  PED: Baby,
  PATH: Microscope,
  RAD: Activity,
  ENT: Stethoscope,
  SURG: Scissors,
  GEN: Stethoscope,
  PHAR: Pill,
  DERMA: Eye,
  DENT: Bone,
  PSYC: Brain,
  ONCO: Activity,
  NEPH: Activity,
  GASTRO: Stethoscope,
  PULM: Activity,
  UROL: Stethoscope,
}

// Color palette for department cards
const departmentColors = [
  { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', iconBg: 'bg-teal-100 dark:bg-teal-900/50', iconColor: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400' },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' },
  { bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800', iconBg: 'bg-sky-100 dark:bg-sky-900/50', iconColor: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' },
  { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', iconBg: 'bg-orange-100 dark:bg-orange-900/50', iconColor: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', iconBg: 'bg-cyan-100 dark:bg-cyan-900/50', iconColor: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400' },
]

export default function ReceptionistDashboardPage() {
  const router = useRouter()
  const { data: stats, isLoading } = useQuery<ReceptionistStats>({
    queryKey: ['receptionist-stats'],
    queryFn: () => fetch('/api/dashboard/receptionist/stats').then((r) => r.json()),
  })

  const isHospitalMode = stats?.isHospitalMode === true

  if (isLoading) {
    return <ReceptionistDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Doctor + Hospital info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <p className="text-sm font-medium text-muted-foreground">My Doctor</p>
              </div>
              <p className="truncate text-lg font-semibold">{stats.doctor.name}</p>
              {stats.doctor.specialization && (
                <p className="truncate text-sm text-muted-foreground">{stats.doctor.specialization}</p>
              )}
            </div>
          </motion.div>
        )}
        {stats?.hospital && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">My Hospital</p>
              <p className="truncate text-lg font-semibold">{stats.hospital.hospitalName}</p>
              {stats.hospital.address && (
                <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">
                    {stats.hospital.address}{stats.hospital.city ? `, ${stats.hospital.city}` : ''}{stats.hospital.state ? `, ${stats.hospital.state}` : ''}
                  </span>
                </div>
              )}
              {stats.hospital.contactNo && (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{stats.hospital.contactNo}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

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
          title="Today Visited"
          value={stats?.todayVisited ?? 0}
          icon={UserCheck}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          icon={Clock}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      {/* Hospital Mode: Departments section */}
      {isHospitalMode && stats?.departments && stats.departments.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-semibold">Departments</h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {stats.departments.map((dept, i) => {
              const color = departmentColors[i % departmentColors.length]
              const DeptIcon = departmentIconMap[dept.shortCode.toUpperCase()] || Building2
              return (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  <Card className={cn(
                    'cursor-default border transition-all duration-200 hover:shadow-md',
                    color.border,
                    color.bg
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          color.iconBg
                        )}>
                          <DeptIcon className={cn('h-5 w-5', color.iconColor)} />
                        </div>
                        <span className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                          color.badge
                        )}>
                          {dept.shortCode}
                        </span>
                      </div>
                      <p className="mt-3 truncate text-sm font-bold">{dept.name}</p>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{dept.todayCount}</span> patients today
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{dept.activeDoctors}</span> doctors active
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>
      )}

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
        {/* Hospital Mode: View Queue & OPD Walk-in */}
        {isHospitalMode && (
          <>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/receptionist/walk-in')}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <ListOrdered className="h-4 w-4" />
              View Queue
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/receptionist/walk-in')}
              className="flex items-center gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
            >
              <Plus className="h-4 w-4" />
              OPD Walk-in
            </Button>
          </>
        )}
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
                {isHospitalMode && <TableHead>Doctor</TableHead>}
                <TableHead>Time</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.todayAppointmentsList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isHospitalMode ? 6 : 5} className="py-8 text-center text-muted-foreground">
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
                  {isHospitalMode && (
                    <TableCell className="text-sm text-muted-foreground">
                      {appt.doctorName || '—'}
                    </TableCell>
                  )}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
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
      {/* Departments skeleton placeholder */}
      <div>
        <div className="mb-3 h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-5 w-12 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-2 space-y-1">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
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
