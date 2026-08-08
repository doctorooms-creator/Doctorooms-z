'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  CalendarDays,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

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

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Visited: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
}

const tabs = ['All', 'Pending', 'Approve', 'Visited', 'Canceled', 'Finish']

export default function DoctorAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; newStatus: string }>({ open: false, id: '', newStatus: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ appointments: Appointment[]; counts: Record<string, number> }>({
    queryKey: ['doctor-appointments', activeTab],
    queryFn: () => fetch(`/api/dashboard/doctor/appointments?status=${activeTab}`).then((r) => r.json()),
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
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              {tab}
              {data?.counts?.[tab] !== undefined && tab !== 'All' && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-100 px-1 text-[10px] font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                  {data.counts[tab]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
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
          )}

          {!isLoading && data?.appointments?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">No appointments found</p>
              <p className="text-sm mt-1">Appointments will appear here when patients book with you.</p>
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
                    {/* Mobile: compact, Desktop: full */}
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
                          <Badge variant="outline" className="text-teal-600 border-teal-300 dark:text-teal-400 dark:border-teal-700 gap-1">
                            <FileText className="h-3 w-3" /> Rx
                          </Badge>
                        </Link>
                      )}
                      <Badge className={cn('text-xs px-2 py-0.5', statusColors[appt.status] || 'bg-gray-100 text-gray-700')}>
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
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Appointment Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this appointment status to <strong>{confirmDialog.newStatus}</strong>? This action cannot be undone.
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
