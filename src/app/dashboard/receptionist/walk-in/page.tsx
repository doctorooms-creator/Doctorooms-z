'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlus,
  Loader2,
  Clock,
  UserRound,
  Video,
  Users,
  AlertCircle,
  RefreshCw,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ============ Types ============

interface QueueItem {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  disease: string
  timeSlot: string | null
  bookingMode: string
  bookingType: string
  createdAt: string
  status: string
  queuePosition: number
}

interface QueueData {
  date: string
  totalInQueue: number
  queue: QueueItem[]
  opdLimit: number
  opdCompletedToday: number
}

interface ScheduleSlot {
  day: string
  timeSlots: string[]
}

// ============ Constants ============

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

// ============ Component ============

export default function WalkInPage() {
  const queryClient = useQueryClient()
  const queueRef = useRef<HTMLDivElement>(null)

  // Form state
  const [patientName, setPatientName] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [disease, setDisease] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [bookingMode, setBookingMode] = useState<string>('InPerson')
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  // Fetch today's queue
  const { data: queueData, isLoading: queueLoading } = useQuery<QueueData>({
    queryKey: ['walkin-queue'],
    queryFn: () =>
      fetch('/api/dashboard/receptionist/walk-in').then((r) => r.json()),
    refetchInterval: 15_000,
  })

  // Fetch doctor schedule via the receptionist schedule API (handles doctorId lookup internally)
  const { data: scheduleResponse } = useQuery<{
    schedules: (ScheduleSlot & { startTime: string; endTime: string; slotDuration: number })[] | null
    todayName: string
  }>({
    queryKey: ['walkin-doctor-schedule'],
    queryFn: () =>
      fetch('/api/dashboard/receptionist/schedule').then((r) => r.json()),
  })

  // Compute available slots from schedule and queue data
  const availableSlots = (() => {
    if (!scheduleResponse?.schedules || !queueData) return []

    const todaySchedule = scheduleResponse.schedules.find(
      (s) => s.day === scheduleResponse.todayName
    )

    if (!todaySchedule?.timeSlots?.length) return []

    const bookedSlots = new Set(
      queueData.queue
        .filter((q: QueueItem) => q.timeSlot)
        .map((q: QueueItem) => q.timeSlot)
    )

    return todaySchedule.timeSlots.filter((slot: string) => !bookedSlots.has(slot))
  })()

  // Walk-in mutation
  const walkInMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/dashboard/receptionist/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Patient added to queue #${result.queuePosition}!`)
        setLastAddedId(result.booking.id)
        // Reset form
        setPatientName('')
        setMobileNo('')
        setGender('')
        setAge('')
        setDisease('')
        setTimeSlot('')
        setBookingMode('InPerson')
        // Invalidate and refetch queue
        queryClient.invalidateQueries({ queryKey: ['walkin-queue'] })
        queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
        queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] })
        // Scroll to queue after a tick
        setTimeout(() => {
          queueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      } else {
        toast.error(result.error || 'Failed to register patient')
      }
    },
    onError: () => {
      toast.error('Failed to register walk-in patient')
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!patientName.trim() || !disease.trim()) {
        toast.error('Patient name and disease/reason are required')
        return
      }
      walkInMutation.mutate({
        patientName: patientName.trim(),
        mobileNo: mobileNo.trim(),
        gender,
        age: age ? parseInt(age, 10) : null,
        disease: disease.trim(),
        timeSlot: timeSlot || null,
        bookingMode,
      })
    },
    [patientName, mobileNo, gender, age, disease, timeSlot, bookingMode, walkInMutation]
  )

  const isSubmitting = walkInMutation.isPending
  const queue = queueData?.queue ?? []
  const opdLimit = queueData?.opdLimit ?? 0
  const totalInQueue = queueData?.totalInQueue ?? 0
  const opdCompletedToday = queueData?.opdCompletedToday ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
          <UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Walk-in Registration</h2>
          <p className="text-sm text-muted-foreground">
            Register walk-in patients directly to the queue
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ============ LEFT: Registration Form ============ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Patient Name */}
                <div className="space-y-1">
                  <Label htmlFor="patientName" className="text-xs font-medium">
                    Patient Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientName"
                    placeholder="Full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                    className="h-9"
                  />
                </div>

                {/* Mobile + Gender row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="mobileNo" className="text-xs font-medium">
                      Mobile No.
                    </Label>
                    <Input
                      id="mobileNo"
                      placeholder="Phone number"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      disabled={isSubmitting}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs font-medium">
                      Gender
                    </Label>
                    <Select value={gender} onValueChange={setGender} disabled={isSubmitting}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <Label htmlFor="age" className="text-xs font-medium">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Age"
                    min={0}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>

                {/* Disease/Reason */}
                <div className="space-y-1">
                  <Label htmlFor="disease" className="text-xs font-medium">
                    Disease / Reason <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="disease"
                    placeholder="e.g. Fever, Headache, Check-up"
                    value={disease}
                    onChange={(e) => setDisease(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>

                {/* Time Slot (optional) */}
                <div className="space-y-1">
                  <Label htmlFor="timeSlot" className="text-xs font-medium">
                    Time Slot <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Select value={timeSlot} onValueChange={setTimeSlot} disabled={isSubmitting}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="No slot (next in queue)" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No available slots for today
                        </div>
                      )}
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Mode Toggle */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Booking Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={bookingMode === 'InPerson' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'flex-1 gap-1.5 h-9',
                        bookingMode === 'InPerson' &&
                          'bg-teal-600 text-white hover:bg-teal-700'
                      )}
                      onClick={() => setBookingMode('InPerson')}
                      disabled={isSubmitting}
                    >
                      <UserRound className="h-3.5 w-3.5" />
                      In Person
                    </Button>
                    <Button
                      type="button"
                      variant={bookingMode === 'VideoCall' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'flex-1 gap-1.5 h-9',
                        bookingMode === 'VideoCall' &&
                          'bg-teal-600 text-white hover:bg-teal-700'
                      )}
                      onClick={() => setBookingMode('VideoCall')}
                      disabled={isSubmitting}
                    >
                      <Video className="h-3.5 w-3.5" />
                      Video Call
                    </Button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !patientName.trim() || !disease.trim()}
                  className="w-full gap-2 bg-teal-600 text-white hover:bg-teal-700 h-10 font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add to Queue
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ RIGHT: Today's Queue ============ */}
        <motion.div
          ref={queueRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Today&apos;s Queue</CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
                  >
                    {totalInQueue}/{opdLimit}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className={cn(
                    'h-3.5 w-3.5',
                    queueLoading && 'animate-spin'
                  )} />
                  <span>Auto-refresh 15s</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* OPD progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Completed: {opdCompletedToday}</span>
                  <span>In Queue: {totalInQueue}</span>
                  <span>Limit: {opdLimit}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-teal-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(((opdCompletedToday + totalInQueue) / opdLimit) * 100, 100)}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Queue list */}
              {queueLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                    >
                      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No patients in queue
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Walk-in patients will appear here
                  </p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {queue.map((item) => {
                      const isJustAdded = item.id === lastAddedId
                      const ModeIcon =
                        item.bookingMode === 'VideoCall' ? Video : UserRound

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={isJustAdded
                            ? { opacity: 0, scale: 0.95, y: -10 }
                            : { opacity: 0, y: 10 }
                          }
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            backgroundColor: isJustAdded
                              ? 'rgba(20, 184, 166, 0.08)'
                              : 'transparent',
                          }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{
                            layout: { type: 'spring', stiffness: 350, damping: 30 },
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.2 },
                            backgroundColor: { duration: 2, delay: 1 },
                          }}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                            isJustAdded
                              ? 'border-teal-300 dark:border-teal-700'
                              : 'border-border/50 hover:border-border',
                            item.status === 'Visited' && 'opacity-60'
                          )}
                        >
                          {/* Queue position */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                            {item.queuePosition}
                          </div>

                          {/* Patient info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">
                                {item.patientName}
                              </p>
                              {item.bookingType === 'By Receptionist' && (
                                <Badge
                                  variant="outline"
                                  className="h-4 shrink-0 px-1.5 text-[10px] font-normal text-teal-600 dark:text-teal-400"
                                >
                                  Walk-in
                                </Badge>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              {item.disease && (
                                <span className="truncate max-w-[140px]">
                                  {item.disease}
                                </span>
                              )}
                              {item.timeSlot && (
                                <span className="flex shrink-0 items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {item.timeSlot}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status + Mode */}
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px]',
                                item.status === 'Approve'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              )}
                            >
                              {item.status === 'Approve' ? 'Waiting' : 'In Consultation'}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ModeIcon className="h-3 w-3" />
                              <span className="text-[10px]">
                                {item.bookingMode === 'VideoCall' ? 'Video' : 'In-Person'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
