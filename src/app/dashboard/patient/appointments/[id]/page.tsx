'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  SendHorizontal,
  Pill,
  Thermometer,
  Activity,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  Circle,
  Video,
  Printer,
  MessageSquare,
  Star,
  CalendarPlus,
  Hash,
  Users,
  Building2,
  RefreshCw,
  Hourglass,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { PrescriptionPrintView, type PrintData } from '@/components/prescription/print-view'

// ==================== QUEUE POSITION SECTION ====================

interface QueueInfoData {
  totalAhead: number
  myPosition: number
  estimatedWaitMinutes: number
  currentlyServingToken: string | null
  currentlyServingPatientName: null
}

function QueuePositionSection({
  tokenNumber,
  queueInfo,
  doctor,
  department,
  hospital,
  isLoading,
  bookingStatus,
  bookingMode,
}: {
  tokenNumber: string
  queueInfo: QueueInfoData | null
  doctor: { name: string; specialization: string; profileImg: string } | null
  department: { name: string; shortCode: string; floorNo: string; opdRoom: string } | null
  hospital: { hospitalName: string; address: string; city: string } | null
  isLoading: boolean
  bookingStatus: string
  bookingMode: string
}) {
  // Progress bar: if totalAhead = 0 and status is Visited, we are 100% done
  const progressPercent =
    bookingStatus === 'Visited'
      ? 100
      : queueInfo
        ? Math.max(0, Math.min(100, ((queueInfo.myPosition > 0 ? 1 : 0) / (queueInfo.myPosition + queueInfo.totalAhead || 1)) * 100))
        : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className="overflow-hidden border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 via-white to-amber-50/30 dark:from-violet-950/30 dark:via-gray-950 dark:to-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-violet-700 dark:text-violet-400">
              <Hash className="h-4 w-4" />
              Your Queue Position
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className={cn('h-3 w-3', queueInfo && 'animate-spin')} style={queueInfo ? { animationDuration: '2s' } : undefined} />
              <span>Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Token Number — Large Badge */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/30">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {tokenNumber}
                </span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                Your Token
              </span>
            </motion.div>

            {isLoading ? (
              <div className="flex-1 space-y-3">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-5 w-56 animate-pulse rounded bg-muted" />
                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              </div>
            ) : bookingStatus === 'Visited' ? (
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.15 }}
                    className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 dark:bg-emerald-900/50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      It&apos;s your turn!
                    </span>
                  </motion.div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Doctor is consulting with you now.
                </p>
              </div>
            ) : queueInfo ? (
              <div className="flex-1 space-y-3">
                {/* Position */}
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold text-foreground">
                    #{queueInfo.myPosition} in queue
                  </span>
                </div>

                {/* Patients ahead */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-500" />
                  <span className="text-sm text-muted-foreground">
                    {queueInfo.totalAhead === 0
                      ? 'No one ahead — you are next!'
                      : `${queueInfo.totalAhead} patient${queueInfo.totalAhead > 1 ? 's' : ''} ahead of you`}
                  </span>
                </div>

                {/* Estimated wait */}
                <div className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {queueInfo.estimatedWaitMinutes === 0
                      ? '~0 minutes'
                      : `~${queueInfo.estimatedWaitMinutes} minutes`}
                  </span>
                  <span className="text-sm text-muted-foreground">estimated wait</span>
                </div>

                {/* Currently Serving */}
                {queueInfo.currentlyServingToken && (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-muted-foreground">
                      Currently Serving:{' '}
                      <span className="font-semibold text-teal-700 dark:text-teal-400">
                        {queueInfo.currentlyServingToken}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  Queue information will be available once your appointment is confirmed.
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(queueInfo || bookingStatus === 'Visited') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Queue Progress</span>
                <span className="font-medium">
                  {bookingStatus === 'Visited'
                    ? 'Consulting'
                    : queueInfo
                      ? `${Math.round(progressPercent)}%`
                      : '—'}
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2.5 bg-violet-100 dark:bg-violet-900/30 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-violet-500 [&>[data-slot=progress-indicator]]:to-violet-400"
              />
              {/* Step indicator dots */}
              <div className="flex items-center justify-between">
                <StepDot label="Waiting" active={bookingStatus === 'Approve' && (queueInfo?.totalAhead ?? 0) > 0} done={bookingStatus === 'Visited'} />
                <div className="flex-1 h-px bg-border mx-2" />
                <StepDot label="Next" active={bookingStatus === 'Approve' && (queueInfo?.totalAhead ?? 0) === 0} done={bookingStatus === 'Visited'} />
                <div className="flex-1 h-px bg-border mx-2" />
                <StepDot label="Consulting" active={bookingStatus === 'Visited'} done={bookingStatus === 'Visited'} />
              </div>
            </motion.div>
          )}

          {/* Doctor & Location Info */}
          {(doctor || department || hospital) && (
            <>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Doctor info */}
                {doctor && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-teal-100 dark:bg-teal-900/50 shrink-0">
                      <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Doctor</p>
                      <p className="text-sm font-medium text-teal-700 dark:text-teal-400 truncate">
                        Dr. {doctor.name} ({doctor.specialization})
                      </p>
                    </div>
                  </div>
                )}

                {/* Department info */}
                {department && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 shrink-0">
                      <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium truncate">
                        {department.name}
                        {department.floorNo && (
                          <span className="text-muted-foreground"> — {department.floorNo}</span>
                        )}
                        {department.opdRoom && (
                          <span className="text-muted-foreground">, {department.opdRoom}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hospital info */}
                {hospital && (
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                      <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium truncate">
                        {hospital.hospitalName}
                        {hospital.address && (
                          <span className="text-muted-foreground"> — {hospital.address}</span>
                        )}
                        {hospital.city && (
                          <span className="text-muted-foreground">, {hospital.city}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video call indicator */}
              {bookingMode === 'VideoCall' && (
                <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 dark:bg-teal-950/30 dark:border-teal-800">
                  <Video className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                    This is a video consultation
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/** Small step indicator dot */
function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={done ? { scale: [1, 1.2, 1] } : active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
        className={cn(
          'h-3 w-3 rounded-full border-2 transition-colors',
          done
            ? 'bg-violet-500 border-violet-500'
            : active
              ? 'bg-violet-200 border-violet-500 dark:bg-violet-800'
              : 'bg-transparent border-muted-foreground/30'
        )}
      />
      <span className={cn(
        'text-[10px] font-medium transition-colors',
        done ? 'text-violet-600 dark:text-violet-400' : active ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  )
}

// ==================== TYPES ====================

interface ChatMessage {
  id: string
  fromId: string
  message: string
  status: string
  createdAt: string
  sender: {
    id: string
    name: string
    profileImg: string
  }
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Visited: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
}

const timelineIcons: Record<string, typeof CheckCircle2> = {
  Pending: Circle,
  Approve: CheckCircle2,
  Visited: CheckCircle2,
  Finish: CheckCircle2,
  Canceled: XCircle,
}

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const id = params.id as string
  const [chatMessage, setChatMessage] = useState('')
  const [printRxIndex, setPrintRxIndex] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['appointment-detail', id],
    queryFn: () => fetch(`/api/dashboard/patient/appointments/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  const { appointment, doctor, patient, prescriptions, statusTimeline } = data || {}

  // Queue info query — auto-refreshes every 30 seconds
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['patient-queue', id],
    queryFn: () => fetch(`/api/patient/bookings/queue?bookingId=${id}`).then((r) => r.json()),
    enabled: !!id && !!appointment?.tokenNumber,
    refetchInterval: 30_000,
  })

  const queueInfo = queueData?.queueInfo
  const queueDoctor = queueData?.doctor
  const queueDepartment = queueData?.department
  const queueHospital = queueData?.hospital
  const showQueueSection = appointment?.tokenNumber && appointment?.status !== 'Finish' && appointment?.status !== 'Canceled'

  // Check if this booking has been rated
  const { data: ratingData } = useQuery({
    queryKey: ['booking-rating', id],
    queryFn: () => fetch(`/api/patient/feedback/check?bookingId=${id}`).then((r) => r.json()),
    enabled: !!id && appointment?.status === 'Finish',
  })
  const bookingRating = ratingData?.rating

  // Separate query for chat messages (polls every 10s for near-real-time)
  const { data: chatData } = useQuery({
    queryKey: ['booking-chat', id],
    queryFn: () => fetch(`/api/bookings/${id}/chat`).then((r) => r.json()),
    enabled: !!id,
    refetchInterval: 10_000,
  })

  const chatMessages = chatData?.messages

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages?.length])

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) =>
      fetch(`/api/bookings/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      }).then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error || 'Failed to send') })
        return r.json()
      }),
    onMutate: async (msg) => {
      if (!user) return { previousMessages: [] }
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['booking-chat', id] })
      // Snapshot previous data
      const prev = queryClient.getQueryData(['booking-chat', id])
      // Optimistically add the message
      queryClient.setQueryData(['booking-chat', id], (old: { messages: ChatMessage[] } | undefined) => ({
        messages: [
          ...(old?.messages || []),
          {
            id: `temp-${Date.now()}`,
            fromId: user.id,
            message: msg,
            status: 'UNREAD',
            createdAt: new Date().toISOString(),
            sender: { id: user.id, name: user.name || 'You', profileImg: user.profileImg || '' },
          },
        ],
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-chat', id] })
    },
    onError: (_err, _msg, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['booking-chat', id], context.prev)
      }
      toast.error('Failed to send message')
    },
    onSettled: () => {
      setChatMessage('')
    },
  })

  const handleSendMessage = useCallback(() => {
    if (!chatMessage.trim()) return
    sendMessageMutation.mutate(chatMessage.trim())
  }, [chatMessage, sendMessageMutation])

  const handlePrintPrescription = (index: number) => {
    setPrintRxIndex(index)
  }

  const handleClosePrint = () => setPrintRxIndex(null)
  const handlePrintAction = () => window.print()

  // Fetch print data from the print API for the selected prescription
  const selectedRxId = printRxIndex !== null ? prescriptions?.[printRxIndex]?.id : null
  const { data: printData } = useQuery<PrintData>({
    queryKey: ['patient-rx-print-data', selectedRxId],
    queryFn: () => fetch(`/api/prescription/${selectedRxId}/print`).then((r) => r.json()),
    enabled: !!selectedRxId,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Appointment Details</h2>
          <p className="text-xs text-muted-foreground">{appointment?.appointmentNo}</p>
        </div>
        <span
          className={cn(
            'ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
            statusColors[appointment?.status] || 'bg-gray-100 text-gray-700'
          )}
        >
          {appointment?.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor & Patient Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Doctor Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doctor Information</CardTitle>
              </CardHeader>
              <CardContent>
                {doctor ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={doctor.img} />
                        <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {doctor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                    </div>
                    <Separator />
                    {doctor.hospitalAddress && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctor.hospitalAddress}</span>
                      </div>
                    )}
                    {doctor.experience && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctor.experience} experience</span>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50" asChild>
                      <Link href={`/doctors/${doctor.id}`}>View Profile</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Doctor info not available</p>
                )}
              </CardContent>
            </Card>

            {/* Patient Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={patient?.img} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        {(patient?.name || 'P').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient?.name || appointment?.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment?.gender}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {appointment?.bloodGroup && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Blood: {appointment.bloodGroup}</span>
                      </div>
                    )}
                    {appointment?.age && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Age: {appointment.age}</span>
                      </div>
                    )}
                    {appointment?.weight > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Weight: {appointment.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {appointment?.bookingDate ? format(new Date(appointment.bookingDate), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-teal-500" />
                  <span className="text-muted-foreground">Disease:</span>
                  <span className="font-medium">{appointment?.disease || '—'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <FileText className="mt-0.5 h-4 w-4 text-teal-500" />
                  <span className="text-muted-foreground shrink-0">Description:</span>
                  <span className="text-muted-foreground">{appointment?.description || 'No description provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Position Section */}
          {showQueueSection && (
            <QueuePositionSection
              tokenNumber={appointment.tokenNumber}
              queueInfo={queueInfo}
              doctor={queueDoctor}
              department={queueDepartment}
              hospital={queueHospital}
              isLoading={queueLoading}
              bookingStatus={appointment.status}
              bookingMode={appointment.bookingMode}
            />
          )}

          {/* Quick Re-book */}
          {(appointment?.status === 'Visited' || appointment?.status === 'Finish') && appointment?.doctorId && (
            <Button asChild className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20">
              <Link href={`/dashboard/patient/book/${appointment.doctorId}`}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Book Again with Dr. {doctor?.name}
              </Link>
            </Button>
          )}

          {/* Join Video Call - shown when doctor has started a video consultation */}
          {appointment?.bookingMode === 'VideoCall' && appointment?.status === 'Visited' && appointment?.videoRoomId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className="overflow-hidden border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/30 shrink-0">
                      <Video className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                          Doctor has started the call — Join Now
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your video consultation with {doctor?.name || 'your doctor'} is ready.
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/30 text-base px-6 h-12"
                        onClick={() => router.push(`/dashboard/video-call/${appointment.videoRoomId}`)}
                      >
                        <Video className="h-5 w-5" />
                        Join Video Call
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Rate This Visit — shown for finished appointments */}
          {appointment?.status === 'Finish' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className={cn(
                'overflow-hidden',
                !bookingRating && 'border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50 to-amber-50 dark:from-teal-950/30 dark:to-amber-950/20'
              )}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className={cn(
                      'flex items-center justify-center h-14 w-14 rounded-2xl shrink-0',
                      bookingRating
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-teal-600 shadow-lg shadow-teal-600/30'
                    )}>
                      <Star className={cn(
                        'h-7 w-7',
                        bookingRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-white'
                      )} />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      {bookingRating ? (
                        <>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                              You rated this visit
                            </p>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  'h-4 w-4',
                                  s <= bookingRating.star
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-none text-muted-foreground/30'
                                )}
                              />
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {ratingLabels[bookingRating.star - 1]} &middot; {format(new Date(bookingRating.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                              How was your visit?
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Share your experience to help other patients
                          </p>
                        </>
                      )}
                    </div>
                    {!bookingRating && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/30"
                          onClick={() => {
                            const doctorUserId = doctor?.userId || ''
                            router.push(`/dashboard/patient/feedback?bookingId=${id}&doctorId=${doctorUserId}`)
                          }}
                        >
                          <Star className="h-4 w-4" />
                          Rate This Visit
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Chat Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-teal-500" />
                <CardTitle className="text-base font-semibold">Chat with Doctor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                {!chatMessages || chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs opacity-60">Start a conversation about your appointment</p>
                  </div>
                ) : (
                  chatMessages.map((msg: ChatMessage) => {
                    const isMe = msg.fromId === user.id
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}
                      >
                        {!isMe && (
                          <Avatar className="h-7 w-7 shrink-0 mt-1">
                            <AvatarImage src={msg.sender?.profileImg} />
                            <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {(msg.sender?.name || 'D').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="max-w-[75%] space-y-0.5">
                          {!isMe && (
                            <p className="text-[10px] font-medium text-muted-foreground pl-1">
                              {msg.sender?.name || 'Support'}
                            </p>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                              isMe
                                ? 'bg-teal-600 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-bl-md'
                            )}
                          >
                            <p>{msg.message}</p>
                          </div>
                          <p className={cn('text-[10px] text-muted-foreground', isMe ? 'text-right pr-1' : 'pl-1')}>
                            {(() => {
                              try {
                                return formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })
                              } catch {
                                return ''
                              }
                            })()}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-border p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex gap-2"
                >
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="min-h-[40px] max-h-[100px] resize-none text-sm"
                    rows={1}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 shrink-0 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                    disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {statusTimeline?.map((step: { status: string; label: string; date: string }, i: number) => {
                  const Icon = timelineIcons[step.status] || Circle
                  const isLast = i === statusTimeline.length - 1
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full',
                            step.status === 'Canceled'
                              ? 'bg-red-100 dark:bg-red-900/50'
                              : 'bg-teal-100 dark:bg-teal-900/50'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-3.5 w-3.5',
                              step.status === 'Canceled' ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'
                            )}
                          />
                        </div>
                        {!isLast && (
                          <div className="mt-1 h-full min-h-[24px] w-px bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(step.date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Prescription View */}
          {prescriptions && prescriptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4 text-teal-500" />
                    Prescription
                  </CardTitle>
                  {prescriptions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => handlePrintPrescription(0)}
                    >
                      <Printer className="h-3.5 w-3.5" /> Print
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {prescriptions.map((rx: {
                  id: string
                  disease: string
                  weight: string
                  bp: string
                  temperature: string
                  description: string
                  medicines: { medicine: string; morning: boolean; afternoon: boolean; evening: boolean; tab: number; dose: string }[]
                  labels: { label: string; value: string; labelUnit: string }[]
                  suggestions: { question: string; suggestions: string }[]
                }) => (
                  <div key={rx.id} className="space-y-3">
                    {/* Vitals */}
                    {(rx.bp || rx.temperature || rx.weight) && (
                      <div className="grid grid-cols-3 gap-2">
                        {rx.bp && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <Activity className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                            <p className="mt-1 text-xs font-medium">{rx.bp}</p>
                            <p className="text-[10px] text-muted-foreground">BP</p>
                          </div>
                        )}
                        {rx.temperature && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <Thermometer className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                            <p className="mt-1 text-xs font-medium">{rx.temperature}</p>
                            <p className="text-[10px] text-muted-foreground">Temp</p>
                          </div>
                        )}
                        {rx.weight && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <Activity className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                            <p className="mt-1 text-xs font-medium">{rx.weight}</p>
                            <p className="text-[10px] text-muted-foreground">Weight</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Medicines */}
                    {rx.medicines?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Pill className="h-3.5 w-3.5" /> Medicines
                        </p>
                        <div className="space-y-1.5">
                          {rx.medicines.map((med) => (
                            <div key={med.medicine || med.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                              <span className="font-medium text-sm">{med.medicine}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                {med.morning && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">M</Badge>}
                                {med.afternoon && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">A</Badge>}
                                {med.evening && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">E</Badge>}
                                <span>{med.tab}x {med.dose}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Labels */}
                    {rx.labels?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Lab Results</p>
                        <div className="space-y-1">
                          {rx.labels.map((l) => (
                            <div key={l.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{l.label}</span>
                              <span className="font-medium">{l.value} {l.labelUnit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {rx.suggestions?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Doctor&apos;s Advice</p>
                        <div className="space-y-1">
                          {rx.suggestions.map((s) => (
                            <div key={s.id} className="rounded-lg bg-teal-50 p-2 text-sm dark:bg-teal-950/30">
                              <p className="font-medium text-teal-700 dark:text-teal-400">{s.question}</p>
                              <p className="text-muted-foreground">{s.suggestions}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rx.description && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        {rx.description}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Print preview overlay */}
      {printRxIndex !== null && printData && (
        <PrescriptionPrintView
          data={printData}
          onClose={handleClosePrint}
          onPrint={handlePrintAction}
        />
      )}
    </div>
  )
}
