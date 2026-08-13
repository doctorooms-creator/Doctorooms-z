'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListOrdered,
  Clock,
  Users,
  UserCheck,
  CheckCircle2,
  Stethoscope,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ─── Types ──────────────────────────────────────────────────────────────

interface ScheduleDoctor {
  id: string
  name: string
  profileImg: string | null
  specialization: string
  designation: string
  fees: number
  schedules: unknown[]
}

interface ScheduleDepartment {
  department: { id: string; name: string; shortCode: string; icon: string }
  doctors: ScheduleDoctor[]
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
  doctorId: string
  doctorName: string
  departmentId: string | null
  queuePosition: number
}

interface WalkInResponse {
  isHospitalMode: boolean
  date: string
  totalInQueue: number
  queue: QueueItem[]
  opdCompletedToday: number
}

interface ScheduleResponse {
  isHospitalMode: boolean
  departments: ScheduleDepartment[]
  todayName: string
}

interface DoctorQueueData {
  doctor: ScheduleDoctor
  department: ScheduleDepartment['department']
  queue: QueueItem[]
  stats: { total: number; waiting: number; inConsultation: number; completed: number }
  currentServing: QueueItem | null
}

// ─── Status helpers ─────────────────────────────────────────────────────

function statusDisplay(status: string) {
  switch (status) {
    case 'Approve':
      return { label: 'Waiting', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' }
    case 'Visited':
      return { label: 'In Consultation', color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' }
    case 'Finish':
      return { label: 'Done', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

function formatTime(isoString: string) {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
}

// ─── API fetchers ───────────────────────────────────────────────────────

async function fetchSchedule(): Promise<ScheduleResponse> {
  const res = await fetch('/api/dashboard/receptionist/schedule')
  if (!res.ok) throw new Error('Failed to load schedule')
  const data = await res.json()
  if (!data.isHospitalMode) throw new Error('Not in hospital mode')
  return data
}

async function fetchWalkInQueue(): Promise<WalkInResponse> {
  const res = await fetch('/api/dashboard/receptionist/walk-in')
  if (!res.ok) throw new Error('Failed to load queue')
  return res.json()
}

// ─── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Component: Queue Item Row ─────────────────────────────────────────

function QueueItemRow({ item, index }: { item: QueueItem; index: number }) {
  const status = statusDisplay(item.status)

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.03 }}
      className={
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border ${
          item.status === 'Visited'
            ? 'bg-teal-50/80 border-teal-200 dark:bg-teal-950/20 dark:border-teal-900'
            : item.status === 'Finish'
            ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50'
            : 'border-transparent hover:bg-muted/50'
        }`
      }
    >
      {/* Token number badge */}
      <div className="flex-shrink-0 w-20">
        {item.tokenNumber ? (
          <Badge
            className="bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800 font-mono text-xs px-2 py-0.5"
          >
            {item.tokenNumber}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">
            #{item.queuePosition}
          </span>
        )}
      </div>

      {/* Patient name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.patientName}</p>
        {item.disease && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.disease}</p>
        )}
      </div>

      {/* Time slot */}
      {item.timeSlot && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="size-3" />
          <span>{item.timeSlot}</span>
        </div>
      )}

      {/* Status badge */}
      <Badge variant="outline" className={status.color}>
        {status.label}
      </Badge>
    </motion.div>
  )
}

// ─── Component: Doctor Queue Card ───────────────────────────────────────

function DoctorQueueCard({ data }: { data: DoctorQueueData }) {
  const { doctor, department, queue, stats, currentServing } = data

  return (
    <motion.div variants={cardVariants}>
      <Card className="overflow-hidden">
        {/* Doctor header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex-shrink-0">
                <Stethoscope className="size-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{doctor.name}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {doctor.designation && (
                    <span className="text-xs text-muted-foreground">{doctor.designation}</span>
                  )}
                  {doctor.specialization && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">{doctor.specialization}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {stats.total > 0 && (
              <Badge variant="secondary" className="flex-shrink-0">
                {stats.total} patient{stats.total !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 gap-4">
          {/* Current serving banner */}
          {currentServing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 p-3 text-white"
            >
              <div className="flex items-center gap-2 text-xs font-medium opacity-90 mb-1">
                <UserCheck className="size-3.5" />
                <span>Currently Serving</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {currentServing.tokenNumber || `#${currentServing.queuePosition}`}
                </span>
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {currentServing.patientName}
                </span>
              </div>
            </motion.div>
          )}

          {/* Queue list */}
          {queue.length > 0 ? (
            <div className="max-h-80 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {queue.map((item, index) => (
                  <QueueItemRow key={item.id} item={item} index={index} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ListOrdered className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No patients in queue</p>
              <p className="text-xs text-muted-foreground/70 mt-1">New walk-in registrations will appear here</p>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs border">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-amber-500" />
              <span className="text-muted-foreground">Waiting:</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{stats.waiting}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-teal-500" />
              <span className="text-muted-foreground">Consulting:</span>
              <span className="font-semibold text-teal-700 dark:text-teal-400">{stats.inConsultation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Done:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{stats.completed}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Component: Skeleton loader ─────────────────────────────────────────

function QueueSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function QueueManagementPage() {
  const [activeDept, setActiveDept] = useState('all')

  const scheduleQuery = useQuery({
    queryKey: ['receptionist-schedule'],
    queryFn: fetchSchedule,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const queueQuery = useQuery({
    queryKey: ['receptionist-walk-in-queue'],
    queryFn: fetchWalkInQueue,
    refetchInterval: 15000,
  })

  // Combine schedule + queue data into per-doctor structures
  const doctorQueues = useMemo<DoctorQueueData[]>(() => {
    if (!scheduleQuery.data || !queueQuery.data) return []

    const departments = scheduleQuery.data.departments
    const allQueueItems = queueQuery.data.queue

    const result: DoctorQueueData[] = []

    for (const dept of departments) {
      for (const doc of dept.doctors) {
        const doctorQueueItems = allQueueItems.filter((q) => q.doctorId === doc.id)

        // Sort by tokenOrder > 0 first, then createdAt
        const sorted = [...doctorQueueItems].sort((a, b) => {
          const aOrder = a.tokenOrder > 0 ? a.tokenOrder : Infinity
          const bOrder = b.tokenOrder > 0 ? b.tokenOrder : Infinity
          if (aOrder !== bOrder) return aOrder - bOrder
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })

        // Recalculate queue positions
        sorted.forEach((item, idx) => {
          item.queuePosition = idx + 1
        })

        const stats = {
          total: sorted.length,
          waiting: sorted.filter((q) => q.status === 'Approve').length,
          inConsultation: sorted.filter((q) => q.status === 'Visited').length,
          completed: sorted.filter((q) => q.status === 'Finish').length,
        }

        const currentServing =
          sorted.filter((q) => q.status === 'Visited').pop() || null

        result.push({
          doctor: doc,
          department: dept.department,
          queue: sorted,
          stats,
          currentServing,
        })
      }
    }

    return result
  }, [scheduleQuery.data, queueQuery.data])

  // Filtered queues by department
  const filteredQueues = useMemo(() => {
    if (activeDept === 'all') return doctorQueues
    return doctorQueues.filter((dq) => dq.department.id === activeDept)
  }, [doctorQueues, activeDept])

  // Aggregate stats across all doctors
  const totalStats = useMemo(() => {
    return doctorQueues.reduce(
      (acc, dq) => ({
        total: acc.total + dq.stats.total,
        waiting: acc.waiting + dq.stats.waiting,
        inConsultation: acc.inConsultation + dq.stats.inConsultation,
        completed: acc.completed + dq.stats.completed,
      }),
      { total: 0, waiting: 0, inConsultation: 0, completed: 0 }
    )
  }, [doctorQueues])

  const departments = scheduleQuery.data?.departments || []
  const isLoading = scheduleQuery.isLoading || queueQuery.isLoading
  const isError = scheduleQuery.isError || queueQuery.isError

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                  <ListOrdered className="size-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    OPD Queue Management
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {queueQuery.data?.date
                      ? new Date(queueQuery.data.date + 'T00:00:00').toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Today'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Aggregate stats pills */}
                {!isLoading && !isError && (
                  <div className="hidden md:flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5">
                      <Users className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{totalStats.waiting}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 px-3 py-1.5">
                      <UserCheck className="size-3.5 text-teal-600 dark:text-teal-400" />
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalStats.inConsultation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{totalStats.completed}</span>
                    </div>
                  </div>
                )}

                {/* Refresh button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        queueQuery.refetch()
                      }}
                    >
                      <RefreshCw className={`size-4 ${queueQuery.isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh queue</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${queueQuery.isFetching ? 'bg-teal-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-xs text-muted-foreground">
                {queueQuery.isFetching ? 'Updating...' : 'Auto-refresh every 15s'}
              </span>
            </div>
          </motion.div>

          {/* ── Error state ── */}
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="size-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Unable to Load Queue</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {scheduleQuery.error?.message || queueQuery.error?.message || 'Something went wrong. Please try again.'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  scheduleQuery.refetch()
                  queueQuery.refetch()
                }}
              >
                <RefreshCw className="size-4 mr-2" />
                Retry
              </Button>
            </motion.div>
          )}

          {/* ── Loading state ── */}
          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <QueueSkeleton />
              <QueueSkeleton />
              <QueueSkeleton />
            </div>
          )}

          {/* ── Main content ── */}
          {!isLoading && !isError && (
            <>
              {/* Department filter tabs (if > 1 department) */}
              {departments.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <Tabs value={activeDept} onValueChange={setActiveDept}>
                    <ScrollArea className="w-full">
                      <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="all" className="gap-1.5">
                          All Departments
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                            {doctorQueues.length}
                          </Badge>
                        </TabsTrigger>
                        {departments.map((dept) => {
                          const deptDoctorCount = doctorQueues.filter(
                            (dq) => dq.department.id === dept.department.id
                          ).length
                          return (
                            <TabsTrigger
                              key={dept.department.id}
                              value={dept.department.id}
                              className="gap-1.5"
                            >
                              {dept.department.name}
                              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                {deptDoctorCount}
                              </Badge>
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                    </ScrollArea>
                  </Tabs>
                </motion.div>
              )}

              {/* Doctor queue cards */}
              {filteredQueues.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredQueues.map((dq) => (
                    <DoctorQueueCard key={dq.doctor.id} data={dq} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ListOrdered className="size-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold">No Queue Data</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {activeDept !== 'all'
                      ? 'No doctors found in this department'
                      : 'No departments or doctors configured yet'}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
    </TooltipProvider>
  )
}
