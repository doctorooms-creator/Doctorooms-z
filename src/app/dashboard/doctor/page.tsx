'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
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
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  Timer,
  UserCheck,
  CircleCheck,
  UserPlus,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────

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
    tokenNumber: string | null
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

interface HospitalLink {
  id: string
  designation: string
  fees: number
  opdTimings: string
  isAvailable: boolean
  hospital: { id: string; hospitalName: string; city: string; state: string }
  department: { id: string; name: string; shortCode: string; floorNo: string; opdRoom: string }
}

interface HospitalLinksResponse {
  hospitalLinks: HospitalLink[]
  doctorId: string
  isHospitalMode: boolean
}

interface QueueItem {
  id: string
  tokenNumber: string | null
  tokenOrder: number
  patientName: string
  patientImg: string | null
  disease: string
  timeSlot: string
  status: string
  bookingType: string
  createdAt: string
  receptionistName: string
}

interface QueueStats {
  total: number
  waiting: number
  inConsultation: number
  completed: number
}

interface QueueResponse {
  doctor: { id: string; name: string; specialization: string; profileImg: string }
  department: { id: string; name: string; shortCode: string; floorNo: string; opdRoom: string } | null
  hospital: { id: string; hospitalName: string } | null
  date: string
  queue: QueueItem[]
  stats: QueueStats
  currentServing: { tokenNumber: string | null; patientName: string } | null
}

// ─── Constants ──────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
}

const QUEUE_REFRESH_INTERVAL = 15_000 // 15 seconds

// ─── Component ──────────────────────────────────────────────────────

export default function DoctorDashboardPage() {
  // ── Data fetching ──
  const { data: stats, isLoading, error } = useQuery<DoctorStats>({
    queryKey: ['doctor-stats'],
    queryFn: () => fetch('/api/dashboard/doctor/stats').then((r) => {
      if (!r.ok) throw new Error('Failed to load stats')
      return r.json()
    }),
    retry: 1,
  })

  const { data: hospitalData } = useQuery<HospitalLinksResponse>({
    queryKey: ['doctor-hospital-links'],
    queryFn: () => fetch('/api/dashboard/doctor/hospital-links').then((r) => {
      if (!r.ok) throw new Error('Failed to load hospital links')
      return r.json()
    }),
    retry: 1,
    staleTime: 60_000,
  })

  const isHospitalMode = hospitalData?.isHospitalMode === true
  const primaryLink = hospitalData?.hospitalLinks?.[0] ?? null
  const doctorId = hospitalData?.doctorId ?? ''

  // ── Queue fetching with auto-refresh ──
  const { data: queueData } = useQuery<QueueResponse>({
    queryKey: ['doctor-opd-queue', doctorId],
    queryFn: () =>
      fetch(`/api/queue/doctor/${doctorId}`).then((r) => {
        if (!r.ok) throw new Error('Failed to load queue')
        return r.json()
      }),
    enabled: isHospitalMode && !!doctorId,
    refetchInterval: QUEUE_REFRESH_INTERVAL,
    staleTime: 10_000,
  })

  // ── Loading / Error ──
  if (isLoading) return <DoctorDashboardSkeleton />

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Please try re-logging in or refresh the page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Hospital & Department Banner (Hospital Mode) ── */}
      <AnimatePresence>
        {isHospitalMode && primaryLink && (
          <HospitalBanner link={primaryLink} />
        )}
      </AnimatePresence>

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

      {/* ── OPD Queue Section (Hospital Mode) ── */}
      <AnimatePresence>
        {isHospitalMode && queueData && (
          <OPDQueueSection queueData={queueData} />
        )}
      </AnimatePresence>

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
                  {/* Token badge in hospital mode */}
                  {isHospitalMode && appt.tokenNumber && (
                    <Badge className="shrink-0 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[11px] font-mono px-2 py-0.5 border-0">
                      {appt.tokenNumber}
                    </Badge>
                  )}
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

// ─── Hospital Banner Sub-component ──────────────────────────────────

function HospitalBanner({ link }: { link: HospitalLink }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/20 p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Hospital icon + name */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200 truncate">
              {link.hospital.hospitalName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {link.department.shortCode && (
                <Badge className="bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-mono px-1.5 py-0 border-0">
                  {link.department.shortCode}
                </Badge>
              )}
              <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                {link.department.name}
              </span>
              {(link.department.floorNo || link.department.opdRoom) && (
                <span className="text-xs text-amber-600/80 dark:text-amber-500/70 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[link.department.floorNo, link.department.opdRoom].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: designation + timings */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          {link.designation && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="font-medium">{link.designation}</span>
            </div>
          )}
          {link.opdTimings && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span>{link.opdTimings}</span>
            </div>
          )}
          {link.fees > 0 && (
            <Badge variant="outline" className="text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
              ₹{link.fees}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── OPD Queue Section Sub-component ────────────────────────────────

function OPDQueueSection({ queueData }: { queueData: QueueResponse }) {
  const { queue, stats, currentServing } = queueData

  const waitingItems = queue.filter((q) => q.status === 'Approve')
  const inConsultationItems = queue.filter((q) => q.status === 'Visited')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <UserPlus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Today's OPD Queue</h3>
            <p className="text-[11px] text-muted-foreground">Auto-refreshes every 15s</p>
          </div>
        </div>
      </div>

      {/* Current Serving Banner */}
      {currentServing && (
        <motion.div
          key={currentServing.tokenNumber || 'serving'}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border-2 border-teal-300 dark:border-teal-700 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/60">
              <UserCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Currently Serving
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {currentServing.tokenNumber && (
                  <span className="text-lg font-bold font-mono text-teal-700 dark:text-teal-300">
                    {currentServing.tokenNumber}
                  </span>
                )}
                <span className="text-sm font-medium text-foreground truncate">
                  {currentServing.patientName}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Queue stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.waiting}</p>
            <p className="text-[11px] text-muted-foreground leading-none">Waiting</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
            <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{stats.inConsultation}</p>
            <p className="text-[11px] text-muted-foreground leading-none">In Consultation</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
            <p className="text-[11px] text-muted-foreground leading-none">Done</p>
          </div>
        </div>
      </div>

      {/* Queue list */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[420px] overflow-y-auto">
            {queue.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <UserPlus className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No patients in queue</p>
              </div>
            )}
            {queue.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-muted/40',
                  item.status === 'Visited' && 'bg-teal-50/50 dark:bg-teal-950/20',
                  item.status === 'Finish' && 'opacity-60',
                )}
              >
                {/* Token number badge */}
                <Badge
                  className={cn(
                    'shrink-0 font-mono text-xs px-2.5 py-0.5 border-0 min-w-[3.5rem] justify-center',
                    item.status === 'Visited'
                      ? 'bg-teal-500 text-white'
                      : item.status === 'Finish'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                        : 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                  )}
                >
                  {item.tokenNumber || `#${item.tokenOrder || i + 1}`}
                </Badge>

                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.patientImg || ''} />
                  <AvatarFallback className="text-[11px] bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                    {item.patientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.patientName}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {item.disease || 'General checkup'}
                    </p>
                    {item.bookingType !== 'By Self' && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-dashed">
                        {item.bookingType}
                      </Badge>
                    )}
                  </div>
                  {item.receptionistName && (
                    <p className="text-xs text-muted-foreground mt-0.5">via R. {item.receptionistName}</p>
                  )}
                </div>

                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 shrink-0',
                    statusColors[item.status] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {item.status === 'Visited' ? 'In Progress' : item.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Patient Button (visual only for now) */}
      {waitingItems.length > 0 && (
        <div className="flex justify-center">
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white px-8"
            disabled={inConsultationItems.length > 0}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {inConsultationItems.length > 0
              ? 'Patient in consultation'
              : 'Call Next Patient'
            }
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────

function DoctorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hospital banner skeleton (show by default — will collapse if no hospital) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
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