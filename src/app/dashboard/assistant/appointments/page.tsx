'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Search,
  Clock,
  UserCheck,
  UserX,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AssistantAppointment {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  doctorName: string
  doctorImg: string | null
  date: string
  status: string
  charge: number
  disease: string
  bookingType: string
  createdAt: string
  description: string
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

export default function AssistantAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AssistantAppointment | null>(null)

  const { data, isLoading } = useQuery<{
    appointments: AssistantAppointment[]
    statusCounts: Record<string, number>
    doctor: { id: string; name: string } | null
  }>({
    queryKey: ['assistant-appointments', statusFilter, search],
    queryFn: () =>
      fetch(
        `/api/dashboard/assistant/appointments?status=${statusFilter}&search=${encodeURIComponent(search)}`
      ).then((r) => r.json()),
  })

  const appointments = data?.appointments ?? []
  const statusCounts = data?.statusCounts ?? {}

  const handleView = (appt: AssistantAppointment) => {
    setSelectedAppointment(appt)
    setViewOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Tab filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Table — View-only for assistants */}
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
                <TableHead className="text-right">Action</TableHead>
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
                    <TableCell><div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <CalendarDays className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== 'all'
                        ? 'No appointments match your filters'
                        : 'No appointments yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt, i) => {
                  const StatusIcon = statusIcons[appt.status] || Clock
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
                            <p className="text-sm font-medium">{appt.patientName}</p>
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
                        <button
                          onClick={() => handleView(appt)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </TableCell>
                    </motion.tr>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View appointment detail dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedAppointment.patientImg || ''} />
                  <AvatarFallback>{selectedAppointment.patientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedAppointment.patientName}</p>
                  <p className="text-xs text-muted-foreground">{selectedAppointment.appointmentNo}</p>
                </div>
                <span
                  className={cn(
                    'ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    statusColors[selectedAppointment.status] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {selectedAppointment.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedAppointment.date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{format(new Date(selectedAppointment.date), 'h:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedAppointment.bookingType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-medium">₹{selectedAppointment.charge.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {selectedAppointment.disease && (
                <div>
                  <p className="text-sm text-muted-foreground">Disease / Condition</p>
                  <p className="text-sm font-medium mt-0.5">{selectedAppointment.disease}</p>
                </div>
              )}

              {selectedAppointment.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm mt-0.5 rounded-lg bg-muted p-3">{selectedAppointment.description}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-right">
                Created: {format(new Date(selectedAppointment.createdAt), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
