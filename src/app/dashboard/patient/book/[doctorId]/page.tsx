'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import Link from 'next/link'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  IndianRupee,
  ShieldCheck,
  MapPin,
  Video,
  Building2,
  ChevronLeft,
  CalendarDays,
  Clock,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────
interface DoctorInfo {
  id: string
  name: string
  profileImg: string
  doctor: {
    specialization: string
    education: string
    experience: string
    city: string
    address: string
    fees: number
    emergencyCharge: number
    contactNo: string
    isEmergency: boolean
  } | null
}

interface ScheduleEntry {
  id: string
  day: string
  startTime: string
  endTime: string
  slotDuration: number
  timeSlots: string[]
}

interface ScheduleData {
  doctorId: string
  userId: string
  fees: number
  emergencyCharge: number
  dailyLimit: number
  bookingDays: number
  schedules: ScheduleEntry[]
  holidays: { date: string; remark: string }[]
}

interface SlotAvailability {
  slot: string
  available: boolean
  loading: boolean
}

// ── Constants ───────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ── Component ─────────────────────────────────────────
export default function PatientBookDoctorPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const doctorId = params.doctorId as string

  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [bookingMode, setBookingMode] = useState<'InPerson' | 'VideoCall'>('InPerson')
  const [disease, setDisease] = useState('')
  const [description, setDescription] = useState('')
  const [bookingState, setBookingState] = useState('')
  const [bookingCity, setBookingCity] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [slotStatuses, setSlotStatuses] = useState<SlotAvailability[]>([])

  // ── Fetch doctor info ──
  const {
    data: doctorData,
    isLoading: doctorLoading,
  } = useQuery({
    queryKey: ['doctor-info', doctorId],
    queryFn: () => fetch(`/api/doctors/${doctorId}`).then((r) => r.json()),
    enabled: !!doctorId,
  })

  const doctor: DoctorInfo | null = doctorData?.doctor || null

  // ── Fetch doctor schedule (public, no auth) ──
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
  } = useQuery<ScheduleData>({
    queryKey: ['doctor-schedule', doctorId],
    queryFn: () => fetch(`/api/doctors/${doctorId}/schedule`).then((r) => r.json()),
    enabled: !!doctorId,
  })

  const fees = doctor?.doctor?.fees ?? scheduleData?.fees ?? 0

  // ── Determine available days for the selected date ──
  const scheduleForSelectedDay = useMemo(() => {
    if (!selectedDate || !scheduleData?.schedules) return null
    const dayName = format(selectedDate, 'EEEE')
    return scheduleData.schedules.find((s) => s.day === dayName) || null
  }, [selectedDate, scheduleData])

  const timeSlots = useMemo(() => {
    if (!scheduleForSelectedDay) return []
    return scheduleForSelectedDay.timeSlots
  }, [scheduleForSelectedDay])

  // ── Check if selected date is a holiday ──
  const isHoliday = useMemo(() => {
    if (!selectedDate || !scheduleData?.holidays) return false
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return scheduleData.holidays.some((h) => h.date === dateStr)
  }, [selectedDate, scheduleData])

  // ── Check individual slot availability ──
  const checkSlotAvailabilities = useCallback(async () => {
    if (!selectedDate || timeSlots.length === 0) {
      setSlotStatuses([])
      return
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const currentDoctorId = scheduleData?.doctorId
    const initial: SlotAvailability[] = timeSlots.map((slot) => ({
      slot,
      available: true,
      loading: true,
    }))
    setSlotStatuses(initial)

    // Check all slots in parallel
    const results = await Promise.all(
      timeSlots.map(async (slot) => {
        try {
          const res = await fetch(
            `/api/patient/bookings/check-slot?doctorId=${currentDoctorId}&date=${dateStr}&timeSlot=${encodeURIComponent(slot)}`
          )
          const data = await res.json()
          return { slot, available: data.available !== false, loading: false }
        } catch {
          return { slot, available: true, loading: false }
        }
      })
    )

    setSlotStatuses(results)
  }, [selectedDate, timeSlots, scheduleData])

  // When date changes, reset slot and re-check availability
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setSelectedDate(date)
      setSelectedSlot(null)
      setShowBookingForm(false)
      if (date) {
        // Small delay to allow scheduleForSelectedDay to compute
        setTimeout(() => checkSlotAvailabilities(), 50)
      } else {
        setSlotStatuses([])
      }
    },
    [checkSlotAvailabilities]
  )

  // ── Booking mutation ──
  const bookMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/patient/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || 'Booking failed')))
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Appointment booked successfully! Waiting for confirmation.')
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['patient-stats'] })
      router.push('/dashboard/patient/appointments')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to book appointment')
    },
  })

  // ── Handlers ──
  const handleSlotClick = (slot: string) => {
    const status = slotStatuses.find((s) => s.slot === slot)
    if (status && !status.available) return
    setSelectedSlot(slot === selectedSlot ? null : slot)
    setShowBookingForm(slot !== selectedSlot || showBookingForm)
  }

  const handleBook = () => {
    if (!selectedDate || !selectedSlot || !disease.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    bookMutation.mutate({
      doctorId: scheduleData?.doctorId || doctorId,
      bookingDate: dateStr,
      timeSlot: selectedSlot,
      bookingMode,
      disease: disease.trim(),
      description: description.trim(),
      state: bookingState.trim(),
      city: bookingCity.trim(),
    })
  }

  // ── Calendar disabled dates ──
  const disablePastDates = (date: Date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()))
  }

  const disableNonScheduleDays = (date: Date) => {
    if (!scheduleData?.schedules) return false // Allow all if no schedule loaded yet
    const dayName = format(date, 'EEEE')
    const hasSchedule = scheduleData.schedules.some((s) => s.day === dayName)
    return !hasSchedule
  }

  // ── Loading state ──
  if (doctorLoading || scheduleLoading) {
    return <BookingPageSkeleton />
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-bold mb-2">Doctor Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">The doctor you are looking for does not exist.</p>
        <Button variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400" asChild>
          <Link href="/doctors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Browse Doctors
          </Link>
        </Button>
      </div>
    )
  }

  const doc = doctor.doctor
  const initials = doctor.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <motion.div {...fadeIn} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/patient" className="hover:text-teal-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/patient/appointments" className="hover:text-teal-600 transition-colors">Appointments</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">Book Appointment</span>
      </motion.div>

      {/* Doctor Info Card */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="border-teal-200/50 dark:border-teal-800/30 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2" />
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-teal-200 dark:border-teal-800 shrink-0">
                <AvatarImage src={doctor.profileImg !== 'default.png' ? doctor.profileImg : ''} />
                <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{doctor.name}</h2>
                  <ShieldCheck className="h-5 w-5 text-teal-500 shrink-0" />
                  {doc?.isEmergency && (
                    <Badge variant="destructive" className="text-[10px] px-1.5">Emergency</Badge>
                  )}
                </div>
                <p className="text-teal-600 dark:text-teal-400 font-medium text-sm mt-0.5">
                  {doc?.specialization || 'General Physician'}
                </p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {doc?.experience && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doc.experience}</span>}
                  {doc?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{doc.city}</span>}
                  <span className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400">
                    <IndianRupee className="h-3 w-3" />{fees} consultation
                  </span>
                </div>
              </div>
              <Button variant="outline" size="icon" className="shrink-0 h-8 w-8" asChild>
                <Link href={`/doctors/${doctorId}`}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back to profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main booking area */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Calendar + Slots */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: Select Date */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-teal-500" />
                  <span className="flex items-center gap-2">
                    Step 1: Select Date
                    <Badge variant="secondary" className="text-[10px] font-normal">Required</Badge>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => disablePastDates(date) || disableNonScheduleDays(date)}
                    className="rounded-xl border p-3 pointer-events-auto"
                    classNames={{
                      day_selected: 'bg-teal-500 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-500 focus:text-white',
                      day_today: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
                      day_disabled: 'text-muted-foreground/30 line-through',
                    }}
                  />
                </div>

                {/* Holiday notice */}
                <AnimatePresence>
                  {selectedDate && isHoliday && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Doctor is on holiday on this date.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 2: Select Slot + Mode */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-500" />
                  <span className="flex items-center gap-2">
                    Step 2: Select Slot & Mode
                    {!selectedDate && <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">Select date first</Badge>}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate && scheduleForSelectedDay ? (
                  <div className="space-y-4">
                    {/* Schedule info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{scheduleForSelectedDay.day}</strong>
                        {' · '}
                        {scheduleForSelectedDay.startTime}–{scheduleForSelectedDay.endTime}
                        {' · '}
                        {scheduleForSelectedDay.slotDuration}min slots
                      </span>
                      {scheduleData?.dailyLimit && (
                        <span className="ml-auto">
                          Max {scheduleData.dailyLimit} patients/day
                        </span>
                      )}
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={bookingMode === 'InPerson' ? 'default' : 'outline'}
                        className={
                          bookingMode === 'InPerson'
                            ? 'bg-teal-500 hover:bg-teal-600 text-white'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }
                        onClick={() => setBookingMode('InPerson')}
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1.5" />
                        In Person
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={bookingMode === 'VideoCall' ? 'default' : 'outline'}
                        className={
                          bookingMode === 'VideoCall'
                            ? 'bg-teal-500 hover:bg-teal-600 text-white'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }
                        onClick={() => setBookingMode('VideoCall')}
                      >
                        <Video className="h-3.5 w-3.5 mr-1.5" />
                        Video Call
                      </Button>
                    </div>

                    <Separator />

                    {/* Time slots grid */}
                    {slotStatuses.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto">
                        {slotStatuses.map((status) => {
                          const isSelected = selectedSlot === status.slot
                          const isUnavailable = !status.available

                          return (
                            <motion.button
                              key={status.slot}
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleSlotClick(status.slot)}
                              disabled={status.loading || isUnavailable}
                              className={`relative py-2.5 px-2 text-xs font-medium rounded-lg border transition-all duration-200
                                ${
                                  isSelected
                                    ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20'
                                    : isUnavailable
                                      ? 'bg-muted/50 text-muted-foreground/40 border-border cursor-not-allowed line-through'
                                      : 'hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-300 border-border text-foreground'
                                }
                              `}
                            >
                              {status.loading ? (
                                <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                              ) : (
                                status.slot
                              )}
                              {isSelected && (
                                <Check className="h-3 w-3 absolute top-0.5 right-0.5" />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-teal-500 mr-2" />
                        <span className="text-sm text-muted-foreground">Loading slots...</span>
                      </div>
                    )}

                    {slotStatuses.length > 0 && slotStatuses.every((s) => !s.available) && (
                      <div className="text-center py-3 text-sm text-muted-foreground">
                        All slots are booked for this date. Try a different date.
                      </div>
                    )}
                  </div>
                ) : selectedDate && !scheduleForSelectedDay ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Doctor is not available on {format(selectedDate, 'EEEE')}.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Please select a different date.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a date to see available time slots.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Disabled dates indicate the doctor is not scheduled.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Booking Summary / Form */}
        <div className="lg:col-span-2">
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {selectedSlot ? (
                    <>
                      <Check className="h-5 w-5 text-teal-500" />
                      Confirm Booking
                    </>
                  ) : (
                    'Booking Summary'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor</span>
                    <span className="font-medium truncate ml-2">{doctor.name}</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{format(selectedDate, 'MMM d, yyyy (EEEE)')}</span>
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium text-teal-600 dark:text-teal-400">{selectedSlot}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="font-medium flex items-center gap-1">
                      {bookingMode === 'InPerson' ? (
                        <><Building2 className="h-3 w-3" /> In Person</>
                      ) : (
                        <><Video className="h-3 w-3" /> Video Call</>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-medium">Fee</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      <IndianRupee className="h-4 w-4 inline" />{fees}
                    </span>
                  </div>
                </div>

                {/* Booking form (appears when slot selected) */}
                <AnimatePresence mode="wait">
                  {selectedSlot && (
                    <motion.div
                      key="booking-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <Separator />
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="disease" className="text-sm font-medium">
                            Reason / Disease <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="disease"
                            placeholder="e.g. Fever, Headache, Routine Checkup"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="state" className="text-sm font-medium">
                              State <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Input
                              id="state"
                              placeholder="e.g. Maharashtra"
                              value={bookingState}
                              onChange={(e) => setBookingState(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-sm font-medium">
                              City <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Input
                              id="city"
                              placeholder="e.g. Mumbai"
                              value={bookingCity}
                              onChange={(e) => setBookingCity(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="description" className="text-sm font-medium">
                            Additional Notes <span className="text-muted-foreground font-normal">(optional)</span>
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Brief description of your symptoms..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="text-sm resize-none"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white h-11 font-semibold"
                        disabled={!disease.trim() || bookMutation.isPending}
                        onClick={handleBook}
                      >
                        {bookMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Confirm & Book
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No slot selected hint */}
                {!selectedSlot && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Select a date and time slot to proceed with booking.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────
function BookingPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-5 w-48" />
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="flex justify-center">
                <Skeleton className="h-72 w-72 rounded-xl" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
