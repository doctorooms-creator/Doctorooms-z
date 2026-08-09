'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Search,
  Clock,
  UserCheck,
  UserX,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  Stethoscope,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReceptionistAppointment {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  doctorName: string
  doctorImg: string | null
  doctorId: string
  doctorSpecialization: string | null
  date: string
  status: string
  charge: number
  disease: string
  bookingType: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Extend: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
}

const statusIcons: Record<string, typeof Clock> = {
  Pending: Clock,
  Approve: UserCheck,
  Visited: UserCheck,
  Canceled: UserX,
  Finish: UserCheck,
  Extend: Clock,
}

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approve', label: 'Approved' },
  { value: 'Visited', label: 'Visited' },
  { value: 'Finish', label: 'Finished' },
  { value: 'Canceled', label: 'Canceled' },
]

export default function ReceptionistAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<ReceptionistAppointment | null>(null)

  // New appointment form state
  const [formPatientName, setFormPatientName] = useState('')
  const [formDisease, setFormDisease] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{
    appointments: ReceptionistAppointment[]
    statusCounts: Record<string, number>
    doctor: { id: string; name: string; fees: number } | null
  }>({
    queryKey: ['receptionist-appointments', statusFilter, search, fromDate, toDate],
    queryFn: () =>
      fetch(
        `/api/dashboard/receptionist/appointments?status=${statusFilter}&search=${encodeURIComponent(search)}${fromDate ? `&from=${fromDate}` : ''}${toDate ? `&to=${toDate}` : ''}`
      ).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: {
      patientName: string
      disease: string
      date: string
      time: string
      description: string
    }) =>
      fetch('/api/dashboard/receptionist/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
      toast.success('Appointment created successfully')
      setDialogOpen(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to create appointment')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: string
    }) =>
      fetch(`/api/dashboard/receptionist/appointments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      }).then((r) => r.json()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-stats'] })
      toast.success(
        variables.status === 'Approve'
          ? 'Appointment approved'
          : 'Appointment rejected'
      )
    },
    onError: () => {
      toast.error('Failed to update appointment')
    },
  })

  const handleCreateAppointment = () => {
    if (!formPatientName || !formDate) {
      toast.error('Patient name and date are required')
      return
    }
    createMutation.mutate({
      patientName: formPatientName,
      disease: formDisease,
      date: formDate,
      time: formTime,
      description: formDescription,
    })
  }

  const handleStatusAction = (id: string, action: 'approve' | 'reject') => {
    setSelectedId(id)
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const confirmStatusChange = () => {
    if (selectedId && confirmAction) {
      statusMutation.mutate({
        id: selectedId,
        status: confirmAction === 'approve' ? 'Approve' : 'Canceled',
      })
    }
    setConfirmOpen(false)
    setSelectedId(null)
    setConfirmAction(null)
  }

  const resetForm = () => {
    setFormPatientName('')
    setFormDisease('')
    setFormDate('')
    setFormTime('')
    setFormDescription('')
  }

  const appointments = data?.appointments ?? []
  const statusCounts = data?.statusCounts ?? {}
  const doctor = data?.doctor

  // Get today's date as YYYY-MM-DD for the date input min
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      {/* Header with new appointment button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
            <Input id="from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="to" className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
            <Input id="to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-40" />
          </div>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate('') }} className="text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700">
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {doctor && (
                <div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-950/30">
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="text-sm font-medium">{doctor.name}</p>
                  {doctor.fees > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Consultation fee: ₹{doctor.fees.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient name"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disease">Disease / Condition</Label>
                <Input
                  id="disease"
                  placeholder="e.g. Fever, Headache"
                  value={formDisease}
                  onChange={(e) => setFormDisease(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAppointment}
                  disabled={createMutation.isPending}
                  className="bg-teal-600 text-white hover:bg-teal-700"
                >
                  {createMutation.isPending ? 'Booking...' : 'Book Appointment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const count =
              tab.value === 'all'
                ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
                : statusCounts[tab.value] || 0
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'text-xs',
                    statusFilter === tab.value
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient or appointment #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></TableCell>
                    <TableCell><div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="ml-auto h-8 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <CalendarDays className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== 'all' || fromDate || toDate
                        ? 'No appointments match your filters'
                        : 'No appointments yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt, i) => {
                  const StatusIcon = statusIcons[appt.status] || Clock
                  const canApproveOrReject = appt.status === 'Pending'
                  return (
                    <motion.tr
                      key={appt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group border-b border-border transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={appt.patientImg || ''} />
                            <AvatarFallback className="text-xs">
                              {appt.patientName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p
                              className="text-sm font-medium cursor-pointer hover:underline hover:text-teal-600 dark:hover:text-teal-400"
                              onClick={() => { setSelectedAppt(appt); setDetailOpen(true) }}
                            >
                              {appt.patientName}
                            </p>
                            <p className="text-xs text-muted-foreground">{appt.appointmentNo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(appt.date), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(appt.date), 'h:mm a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{appt.bookingType}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {appt.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{appt.charge.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        {canApproveOrReject && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                              onClick={() => handleStatusAction(appt.id, 'approve')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                              onClick={() => handleStatusAction(appt.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </motion.tr>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppt && (
            <div className="space-y-4">
              {/* Status + Appointment # */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusColors[selectedAppt.status] || 'bg-gray-100 text-gray-700'
                )}>
                  {selectedAppt.status}
                </span>
                <span className="text-xs text-muted-foreground">{selectedAppt.appointmentNo}</span>
              </div>

              {/* Patient info card */}
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedAppt.patientImg || ''} />
                    <AvatarFallback>{selectedAppt.patientName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{selectedAppt.patientName}</p>
                </div>
                <p className="text-sm">Disease: {selectedAppt.disease || '—'}</p>
                <p className="text-sm">Type: {selectedAppt.bookingType}</p>
              </div>

              {/* Doctor info */}
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Doctor</p>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-teal-600" />
                  <p className="text-sm font-medium">{selectedAppt.doctorName}</p>
                </div>
                {selectedAppt.doctorSpecialization && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedAppt.doctorSpecialization}</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{format(new Date(selectedAppt.date), 'MMM d, yyyy')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">{format(new Date(selectedAppt.date), 'h:mm a')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Fee</p>
                  <p className="text-sm font-medium">₹{selectedAppt.charge.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{format(new Date(selectedAppt.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' ? 'Approve Appointment' : 'Reject Appointment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'approve'
                ? 'Are you sure you want to approve this appointment? The patient will be notified.'
                : 'Are you sure you want to reject this appointment? The patient will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={cn(
                confirmAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {confirmAction === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
