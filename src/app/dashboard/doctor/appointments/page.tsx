'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Users,
  Clock,
  Video,
  MapPin,
  UserCheck,
  Play,
  Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ==================== TYPES ====================

interface Appointment {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string
  disease: string
  date: string
  status: string
  charge: number
  hasPrescription: boolean
}

interface QueueItem {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string
  disease: string
  timeSlot: string
  bookingMode: string
  bookingType: string
  createdAt: string
  status: string
  queuePosition: number
}

interface QueueResponse {
  date: string
  totalInQueue: number
  queue: QueueItem[]
  opdLimit: number
  opdCompletedToday: number
}

// ==================== CONSTANTS ====================

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Extend: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
}

const statusLabels: Record<string, string> = {
  Approve: 'Waiting',
  Visited: 'In Consultation',
  Finish: 'Completed',
  Canceled: 'Canceled',
  Extend: 'Extended',
  Pending: 'Pending',
}

const tabs = ["Today's Queue", 'All', 'Pending', 'Approve', 'Visited', 'Canceled', 'Finish']

// ==================== HELPERS ====================

function getRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true })
  } catch {
    return ''
  }
}

function getOpdColor(percentage: number): string {
  if (percentage < 80) return 'bg-emerald-500'
  if (percentage <= 95) return 'bg-amber-500'
  return 'bg-red-500'
}

// ==================== SKELETONS ====================

function QueueSkeleton() {
  return (
    <div className="space-y-4">
      {/* OPD Progress skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>
      {/* Queue items skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AppointmentsSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== TODAY'S QUEUE TAB ====================

function TodaysQueueTab() {
  const queryClient = useQueryClient()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    id: string
    newStatus: string
    label: string
  }>({ open: false, id: '', newStatus: '', label: '' })

  const { data, isLoading, isError } = useQuery<QueueResponse>({
    queryKey: ['doctor-queue'],
    queryFn: () => fetch('/api/dashboard/doctor/queue').then((r) => r.json()),
    refetchInterval: 15000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/dashboard/doctor/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      toast.success('Patient status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const handleStatusChange = (id: string, newStatus: string, label: string) => {
    setConfirmDialog({ open: true, id, newStatus, label })
  }

  const confirmStatusChange = () => {
    statusMutation.mutate({ id: confirmDialog.id, status: confirmDialog.newStatus })
    setConfirmDialog({ open: false, id: '', newStatus: '', label: '' })
  }

  const router = useRouter()

  const videoCallMutation = useMutation({
    mutationFn: (bookingId: string) =>
      fetch('/api/dashboard/doctor/video-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
        queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
        toast.success('Video call started!')
        router.push(data.joinUrl)
      } else {
        toast.error(data.message || 'Failed to start video call')
      }
    },
    onError: () => toast.error('Failed to start video call'),
  })

  const handleStartVideoCall = useCallback((bookingId: string) => {
    videoCallMutation.mutate(bookingId)
  }, [videoCallMutation])

  const opdPercentage = data ? Math.round(((data.opdCompletedToday + (data.totalInQueue || 0)) / data.opdLimit) * 100) : 0
  const progressColor = getOpdColor(opdPercentage)

  if (isLoading) return <QueueSkeleton />

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">Failed to load queue</p>
          <p className="text-sm mt-1">Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* OPD Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-semibold text-foreground">
                Today's OPD Progress
              </span>
            </div>
            <span className="text-sm font-bold text-foreground">
              {data.opdCompletedToday + (data.totalInQueue || 0)}{' '}
              <span className="font-normal text-muted-foreground">/ {data.opdLimit}</span>
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(opdPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', progressColor)}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{data.totalInQueue} in queue</span>
            <span>{data.opdCompletedToday} completed</span>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <AnimatePresence mode="popLayout">
        {data.queue.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">No patients in queue</p>
                <p className="text-sm mt-1">
                  Approved patients will appear here automatically.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.queue.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card className={cn(
              'overflow-hidden transition-all',
              item.status === 'Visited' && 'ring-2 ring-teal-500/40 bg-teal-50/50 dark:bg-teal-950/20'
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Queue Position Badge */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white text-lg font-bold shadow-md shadow-teal-600/20">
                      {item.queuePosition}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {item.queuePosition === 1 ? 'Next' : `#${item.queuePosition}`}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.patientImg} />
                        <AvatarFallback className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {item.patientName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-semibold truncate">{item.patientName}</p>
                    </div>

                    {item.disease && (
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {item.disease}
                      </p>
                    )}

                    {/* Info badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.timeSlot && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 gap-1 border-border">
                          <Clock className="h-3 w-3" />
                          {item.timeSlot}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[11px] px-1.5 py-0 gap-1',
                          item.bookingMode === 'VideoCall'
                            ? 'border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400'
                            : 'border-teal-300 text-teal-600 dark:border-teal-700 dark:text-teal-400'
                        )}
                      >
                        {item.bookingMode === 'VideoCall' ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        {item.bookingMode === 'VideoCall' ? 'Video Call' : 'In Person'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[11px] px-1.5 py-0 gap-1 border-border"
                      >
                        {item.bookingType === 'By Self' ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        {item.bookingType === 'By Self' ? 'Online' : 'Walk-in'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Status + Actions (right side) */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Badge className={cn('text-[11px] px-2 py-0.5', statusColors[item.status])}>
                      {statusLabels[item.status] || item.status}
                    </Badge>

                    <div className="flex items-center gap-1">
                      {item.status === 'Approve' && (
                        item.bookingMode === 'VideoCall' ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1 shadow-sm"
                            onClick={() => handleStartVideoCall(item.id)}
                            disabled={videoCallMutation.isPending}
                          >
                            <Video className="h-3 w-3" />
                            <span className="hidden sm:inline">Video Call</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1 shadow-sm"
                            onClick={() => handleStatusChange(item.id, 'Visited', 'Start Consultation')}
                          >
                            <Play className="h-3 w-3" />
                            <span className="hidden sm:inline">Start</span>
                          </Button>
                        )
                      )}
                      {item.status === 'Visited' && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-sm"
                          onClick={() => handleStatusChange(item.id, 'Finish', 'Finish Consultation')}
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span className="hidden sm:inline">Finish</span>
                        </Button>
                      )}
                      {(item.status === 'Approve' || item.status === 'Visited') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          onClick={() => handleStatusChange(item.id, 'Canceled', 'Cancel Appointment')}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this appointment status to{' '}
              <strong>{confirmDialog.newStatus}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ==================== APPOINTMENTS LIST TAB ====================

function AppointmentsListTab({ activeTab }: { activeTab: string }) {
  const queryClient = useQueryClient()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    id: string
    newStatus: string
  }>({ open: false, id: '', newStatus: '' })

  const { data, isLoading } = useQuery<{
    appointments: Appointment[]
    counts: Record<string, number>
  }>({
    queryKey: ['doctor-appointments', activeTab],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/appointments?status=${activeTab}`).then((r) => r.json()),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/dashboard/doctor/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
      toast.success('Appointment status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const handleStatusChange = (id: string, newStatus: string) => {
    setConfirmDialog({ open: true, id, newStatus })
  }

  const confirmStatusChange = () => {
    statusMutation.mutate({ id: confirmDialog.id, status: confirmDialog.newStatus })
    setConfirmDialog({ open: false, id: '', newStatus: '' })
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {isLoading && <AppointmentsSkeleton />}

          {!isLoading && data?.appointments?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">No appointments found</p>
              <p className="text-sm mt-1">
                Appointments will appear here when patients book with you.
              </p>
            </div>
          )}

          {!isLoading && data?.appointments?.length > 0 && (
            <div className="max-h-[500px] overflow-y-auto">
              <div className="divide-y divide-border">
                {data.appointments.map((appt, i) => (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={appt.patientImg || ''} />
                      <AvatarFallback className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        {appt.patientName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{appt.patientName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(appt.date), 'MMM d, yyyy')}</span>
                        {appt.disease && <span>· {appt.disease}</span>}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      {appt.hasPrescription && (
                        <Link href={`/dashboard/doctor/prescriptions`}>
                          <Badge
                            variant="outline"
                            className="text-teal-600 border-teal-300 dark:text-teal-400 dark:border-teal-700 gap-1"
                          >
                            <FileText className="h-3 w-3" /> Rx
                          </Badge>
                        </Link>
                      )}
                      <Badge
                        className={cn(
                          'text-xs px-2 py-0.5',
                          statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {appt.status}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {appt.status === 'Pending' && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                            onClick={() => handleStatusChange(appt.id, 'Approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={() => handleStatusChange(appt.id, 'Canceled')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {appt.status === 'Approve' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/30"
                          onClick={() => handleStatusChange(appt.id, 'Visited')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {appt.status === 'Visited' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          onClick={() => handleStatusChange(appt.id, 'Finish')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Appointment Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this appointment status to{' '}
              <strong>{confirmDialog.newStatus}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ==================== MAIN PAGE ====================

export default function DoctorAppointmentsPage() {
  const [activeTab, setActiveTab] = useState("Today's Queue")

  const isQueueTab = activeTab === "Today's Queue"

  // For the list tabs, map "Today's Queue" to empty string to avoid sending bad query
  const listTabValue = isQueueTab ? '' : activeTab

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                'relative data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm',
                tab === "Today's Queue" &&
                  'data-[state=active]:bg-teal-600 data-[state=active]:text-white'
              )}
            >
              {tab === "Today's Queue" && (
                <Activity className="h-3.5 w-3.5 mr-1" />
              )}
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {isQueueTab ? <TodaysQueueTab /> : <AppointmentsListTab activeTab={listTabValue} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
