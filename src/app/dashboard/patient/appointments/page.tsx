'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Eye, CalendarX, CalendarDays, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const tabs = ['All', 'Pending', 'Approved', 'Visited', 'Canceled', 'Finished']

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Visited: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
}

const statusMap: Record<string, string> = {
  All: 'All',
  Pending: 'Pending',
  Approved: 'Approve',
  Visited: 'Visited',
  Canceled: 'Canceled',
  Finished: 'Finish',
}

interface Appointment {
  id: string
  appointmentNo: string
  doctorName: string
  doctorImg: string
  doctorSpecialization: string
  date: string
  disease: string
  description: string
  status: string
  charge: number
  hasPrescription: boolean
  createdAt: string
}

export default function PatientAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['patient-appointments', activeTab],
    queryFn: () => {
      const status = statusMap[activeTab]
      const params = status !== 'All' ? `?status=${status}` : ''
      return fetch(`/api/dashboard/patient/appointments${params}`).then((r) => r.json())
    },
  })

  const appointments: Appointment[] = data?.appointments || []
  const counts: Record<string, number> = data?.counts || {}

  // Queue positions for approved appointments
  const approvedIds = appointments.filter((a) => a.status === 'Approve').map((a) => a.id)

  const { data: queueData } = useQuery<Record<string, number>>({
    queryKey: ['queue-positions', approvedIds],
    queryFn: async () => {
      const results: Record<string, number> = {}
      await Promise.all(
        approvedIds.map(async (id) => {
          try {
            const res = await fetch(`/api/patient/bookings/queue?bookingId=${id}`)
            if (res.ok) {
              const data = await res.json()
              if (typeof data.position === 'number') {
                results[id] = data.position
              }
            }
          } catch {
            // ignore individual fetch errors
          }
        })
      )
      return results
    },
    enabled: approvedIds.length > 0,
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patient/bookings/${id}/cancel`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to cancel')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['queue-positions'] })
      toast.success('Appointment canceled successfully')
      setCancelId(null)
    },
    onError: () => {
      toast.error('Failed to cancel appointment. Please try again.')
    },
  })

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabs.map((tab) => {
            const count = tab === 'All'
              ? Object.values(counts).reduce((a, b) => a + b, 0)
              : (counts[statusMap[tab]] || 0)
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-card data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-400"
              >
                {tab}
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium">
                  {count}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CalendarX className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}appointments found
              </p>
              <Button variant="outline" size="sm" className="mt-4 text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50" asChild>
                <Link href="/doctors">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Disease</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt, i) => (
                  <TableRow
                    key={appt.id}
                    className="group border-b border-border transition-colors hover:bg-muted/50"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={appt.doctorImg} />
                          <AvatarFallback className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                            {appt.doctorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{appt.doctorName}</p>
                          <p className="text-xs text-muted-foreground truncate">{appt.doctorSpecialization}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {format(new Date(appt.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {appt.disease || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            statusColors[appt.status] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {appt.status}
                        </span>
                        {appt.status === 'Approve' && queueData?.[appt.id] != null && (
                          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/50 dark:text-teal-400 dark:hover:bg-teal-900/50">
                            Queue #{queueData[appt.id]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(appt.status === 'Pending' || appt.status === 'Approve') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => setCancelId(appt.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cancel appointment</span>
                          </Button>
                        )}
                        {appt.hasPrescription && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700 dark:text-teal-400" asChild>
                            <Link href={`/dashboard/patient/appointments/${appt.id}`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/dashboard/patient/appointments/${appt.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              disabled={cancelMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
