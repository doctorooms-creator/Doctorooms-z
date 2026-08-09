'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  XCircle,
  Phone,
  Clock,
  Video,
  UserRound,
  Stethoscope,
  Loader2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PendingBooking {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  patientMobile: string
  disease: string
  description: string
  bookingDate: string
  timeSlot: string | null
  bookingMode: string
  createdAt: string
  doctorName: string
  doctorSpecialization: string
  queuePosition: number | null
  opdCount: number
  opdLimit: number
}

const bookingModeStyles: Record<string, string> = {
  InPerson: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  VideoCall: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
}

const bookingModeIcons: Record<string, typeof UserRound> = {
  InPerson: UserRound,
  VideoCall: Video,
}

export default function PendingBookingsPage() {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectTargetName, setRejectTargetName] = useState('')
  const [extendTargetId, setExtendTargetId] = useState<string | null>(null)
  const [extendTargetName, setExtendTargetName] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ bookings: PendingBooking[] }>({
    queryKey: ['receptionist-pending-bookings'],
    queryFn: () =>
      fetch('/api/dashboard/receptionist/pending-bookings').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const bookings = data?.bookings ?? []

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/receptionist/bookings/${id}/approve`, {
        method: 'PATCH',
      }).then((r) => r.json()),
    onMutate: async (id) => {
      setApprovingId(id)
      await queryClient.cancelQueries({ queryKey: ['receptionist-pending-bookings'] })
      const prev = queryClient.getQueryData<{ bookings: PendingBooking[] }>(['receptionist-pending-bookings'])
      return { prev }
    },
    onSuccess: (result, id) => {
      setApprovingId(null)
      if (result.success) {
        toast.success(`Patient approved! Queue #${result.queuePosition}`)
        queryClient.setQueryData<{ bookings: PendingBooking[] }>(
          ['receptionist-pending-bookings'],
          (old) => old ? { bookings: old.bookings.filter((b) => b.id !== id) } : old
        )
        queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
        queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] })
      }
    },
    onError: (_err, id, ctx) => {
      setApprovingId(null)
      if (ctx?.prev) {
        queryClient.setQueryData(['receptionist-pending-bookings'], ctx.prev)
      }
      toast.error('Failed to approve booking. OPD limit may have been reached.')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/receptionist/bookings/${id}/reject`, {
        method: 'PATCH',
      }).then((r) => r.json()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['receptionist-pending-bookings'] })
      const prev = queryClient.getQueryData<{ bookings: PendingBooking[] }>(['receptionist-pending-bookings'])
      return { prev }
    },
    onSuccess: (_result, id) => {
      toast.success('Booking rejected')
      queryClient.setQueryData<{ bookings: PendingBooking[] }>(
        ['receptionist-pending-bookings'],
        (old) => old ? { bookings: old.bookings.filter((b) => b.id !== id) } : old
      )
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] })
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['receptionist-pending-bookings'], ctx.prev)
      }
      toast.error('Failed to reject booking')
    },
  })

  const handleReject = (id: string, name: string) => {
    setRejectTargetId(id)
    setRejectTargetName(name)
    setRejectDialogOpen(true)
  }

  const confirmReject = () => {
    if (rejectTargetId) {
      rejectMutation.mutate(rejectTargetId)
    }
    setRejectDialogOpen(false)
    setRejectTargetId(null)
    setRejectTargetName('')
  }

  const handleExtend = (id: string, name: string) => {
    setExtendTargetId(id)
    setExtendTargetName(name)
    setExtendDialogOpen(true)
  }

  const confirmExtend = () => {
    if (extendTargetId) {
      extendMutation.mutate(extendTargetId)
    }
    setExtendDialogOpen(false)
    setExtendTargetId(null)
    setExtendTargetName('')
  }

  const extendMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/receptionist/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Extend' }),
      }).then((r) => r.json()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['receptionist-pending-bookings'] })
      const prev = queryClient.getQueryData<{ bookings: PendingBooking[] }>(['receptionist-pending-bookings'])
      return { prev }
    },
    onSuccess: (_result, id) => {
      toast.success('Booking extended')
      queryClient.setQueryData<{ bookings: PendingBooking[] }>(
        ['receptionist-pending-bookings'],
        (old) => old ? { bookings: old.bookings.filter((b) => b.id !== id) } : old
      )
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] })
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['receptionist-pending-bookings'], ctx.prev)
      }
      toast.error('Failed to extend booking')
    },
  })

  const isApproving = (id: string) => approveMutation.isPending || approvingId === id
  const isRejecting = (id: string) => rejectMutation.isPending && rejectMutation.variables === id
  const isExtending = (id: string) => extendMutation.isPending && extendMutation.variables === id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pending Booking Requests</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve online booking requests
          </p>
        </div>
        {bookings.length > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-600 px-2 text-xs font-bold text-white">
            {bookings.length}
          </span>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-2 sm:w-48">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="space-y-2 sm:w-40">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
                    <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && bookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
        >
          <CalendarCheck className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">No pending requests</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            All booking requests have been processed
          </p>
        </motion.div>
      )}

      {/* Booking cards */}
      <AnimatePresence mode="popLayout">
        <div className="grid gap-4">
          {bookings.map((booking, i) => {
            const ModeIcon = bookingModeIcons[booking.bookingMode] || UserRound
            const isBeingApproved = isApproving(booking.id)
            const isBeingRejected = isRejecting(booking.id)

            return (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isBeingApproved ? 0.98 : 1,
                }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{
                  layout: { type: 'spring', stiffness: 350, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  y: { stiffness: 300, damping: 30 },
                  delay: i * 0.05,
                }}
              >
                <Card
                  className={cn(
                    'transition-colors duration-500',
                    isBeingApproved && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20',
                    isBeingRejected && 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                  )}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: Patient info */}
                      <div className="flex items-start gap-3 sm:min-w-[200px]">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.patientImg || ''} />
                          <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                            {booking.patientName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-tight">{booking.patientName}</p>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{booking.patientMobile || '—'}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(booking.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Booking details */}
                      <div className="flex-1 space-y-2 sm:min-w-[200px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                              bookingModeStyles[booking.bookingMode] || 'bg-gray-100 text-gray-700'
                            )}
                          >
                            <ModeIcon className="h-3 w-3" />
                            {booking.bookingMode === 'InPerson' ? 'In Person' : 'Video Call'}
                          </span>
                          {booking.timeSlot && (
                            <span className="text-xs text-muted-foreground">
                              <Clock className="mr-0.5 inline h-3 w-3" />
                              {booking.timeSlot}
                            </span>
                          )}
                        </div>
                        {booking.disease && (
                          <p className="text-sm font-medium text-foreground/90">
                            {booking.disease}
                          </p>
                        )}
                        {booking.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {booking.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                        </p>
                      </div>

                      {/* Right: Doctor info */}
                      <div className="sm:min-w-[160px] sm:text-right">
                        <div className="flex items-center gap-1.5 sm:justify-end">
                          <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          <p className="text-sm font-medium">{booking.doctorName}</p>
                        </div>
                        {booking.doctorSpecialization && (
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-right">
                            {booking.doctorSpecialization}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 sm:justify-end">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              booking.opdCount >= booking.opdLimit
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400'
                            )}
                          >
                            {booking.opdCount}/{booking.opdLimit}
                          </span>
                          <span className="text-xs text-muted-foreground">OPD</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action buttons */}
                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(booking.id)}
                        disabled={isApproving(booking.id) || isRejecting(booking.id) || isExtending(booking.id)}
                        className="gap-1.5 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                      >
                        {isApproving(booking.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExtend(booking.id, booking.patientName)}
                        disabled={isApproving(booking.id) || isRejecting(booking.id) || isExtending(booking.id)}
                        className="gap-1.5 border-violet-200 text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-900 dark:hover:bg-violet-950/50 disabled:opacity-60"
                      >
                        {isExtending(booking.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarClock className="h-4 w-4" />
                        )}
                        Extend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(booking.id, booking.patientName)}
                        disabled={isApproving(booking.id) || isRejecting(booking.id) || isExtending(booking.id)}
                        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/50 disabled:opacity-60"
                      >
                        {isRejecting(booking.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </AnimatePresence>

      {/* Reject confirmation dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the booking request from{' '}
              <span className="font-semibold text-foreground">{rejectTargetName}</span>
              ? This action cannot be undone and the patient will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Reject Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend confirmation dialog */}
      <AlertDialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extend Booking Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to extend the booking request from{' '}
              <span className="font-semibold text-foreground">{extendTargetName}</span>
              ? The patient will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExtend}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              Extend Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
