'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarDays, Search, Clock, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface HospitalAppointment {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  doctorName: string
  doctorImg: string | null
  doctorId: string
  date: string
  status: string
  charge: number
  disease: string
  bookingType: string
  createdAt: string
  tokenNumber: string | null
  tokenOrder: number | null
  departmentId: string | null
  departmentName: string | null
}

interface DoctorOption {
  id: string
  name: string
}

interface DepartmentOption {
  id: string
  name: string
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

export default function HospitalAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [doctorFilter, setDoctorFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{
    appointments: HospitalAppointment[]
    doctors: DoctorOption[]
    departments: DepartmentOption[]
    statusCounts: Record<string, number>
  }>({
    queryKey: ['hospital-appointments', statusFilter, doctorFilter, departmentFilter, search],
    queryFn: () =>
      fetch(
        `/api/dashboard/hospital/appointments?status=${statusFilter}&doctorId=${doctorFilter}&departmentId=${departmentFilter}&search=${encodeURIComponent(search)}`
      ).then((r) => r.json()),
  })

  const appointments = data?.appointments ?? []
  const doctors = data?.doctors ?? []
  const departments = data?.departments ?? []
  const statusCounts = data?.statusCounts ?? {}

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
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

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient or appointment #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All Doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
                          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <CalendarDays className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {search || statusFilter !== 'all' || doctorFilter !== 'all' || departmentFilter !== 'all'
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
                              {appt.disease && (
                                <p className="text-xs text-muted-foreground">{appt.disease}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={appt.doctorImg || ''} />
                              <AvatarFallback className="text-xs">
                                {appt.doctorName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {appt.doctorName}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {format(new Date(appt.date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs">
                              {format(new Date(appt.date), 'h:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {appt.tokenNumber ? (
                            <Badge
                              variant="outline"
                              className="border-violet-300 bg-violet-50 text-violet-700 text-[10px] px-1.5 py-0 font-semibold whitespace-nowrap dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                            >
                              {appt.tokenNumber}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {appt.departmentName || '—'}
                          </span>
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
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
