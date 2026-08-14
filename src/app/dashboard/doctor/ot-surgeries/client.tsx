'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Cross,
  CalendarDays,
  Clock,
  User,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  Clock4,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { cn } from '@/lib/utils'

interface Schedule {
  id: string
  scheduleNo: string
  otName: string
  otType: string
  otFloor: string
  hospitalId: string
  admissionId: string
  admissionNo: string
  patientName: string
  patientAge: number
  patientGender: string
  surgeonName: string
  assistantSurgeons: string
  surgeryName: string
  surgeryCategory: string
  surgeryType: string
  scheduledDate: string
  scheduledStartTime: string
  estimatedDuration: number
  actualStartTime: string
  actualEndTime: string
  status: string
  notes: string
  cancellationReason: string
}

const statusColors: Record<string, string> = {
  Scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  InProgress: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Postponed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
}

const statusActions: Record<string, { label: string; icon: typeof Play; variant: 'default' | 'destructive' | 'outline'; color: string }[]> = {
  Scheduled: [
    { label: 'Start', icon: Play, variant: 'default', color: 'bg-rose-600 hover:bg-rose-700' },
    { label: 'Cancel', icon: XCircle, variant: 'destructive', color: '' },
    { label: 'Postpone', icon: Clock4, variant: 'outline', color: '' },
  ],
  InProgress: [
    { label: 'Complete', icon: CheckCircle2, variant: 'default', color: 'bg-emerald-600 hover:bg-emerald-700' },
  ],
}

export default function DoctorOtSurgeriesClient() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionDialog, setActionDialog] = useState<{ scheduleId: string; action: string } | null>(null)
  const [actionTime, setActionTime] = useState('')
  const [actionReason, setActionReason] = useState('')

  const { data, isLoading } = useQuery<{ schedules: Schedule[] }>({ 
    queryKey: ['doctor-ot-schedules', statusFilter],
    queryFn: () =>
      fetch(`/api/ot-schedules?status=${statusFilter === 'all' ? '' : statusFilter}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const schedules = data?.schedules ?? []
  const scheduledCount = schedules.filter((s) => s.status === 'Scheduled').length
  const inProgressCount = schedules.filter((s) => s.status === 'InProgress').length
  const completedCount = schedules.filter((s) => s.status === 'Completed').length

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetch(`/api/ot-schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Schedule updated')
      setActionDialog(null)
      setActionTime('')
      setActionReason('')
      queryClient.invalidateQueries({ queryKey: ['doctor-ot-schedules'] })
    },
    onError: () => toast.error('Failed to update schedule'),
  })

  function handleAction() {
    if (!actionDialog) return
    const { scheduleId, action } = actionDialog
    const body: Record<string, unknown> = { status: action }
    if (actionTime) body.actualStartTime = actionTime
    if (action === 'Completed' && actionTime) body.actualEndTime = actionTime
    if (action === 'Cancelled' && actionReason) body.cancellationReason = actionReason
    updateMutation.mutate({ id: scheduleId, body })
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{scheduledCount}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/40">
                <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
              <div className="rounded-lg bg-rose-100 p-2.5 dark:bg-rose-900/40">
                <Cross className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/40">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="InProgress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Postponed">Postponed</SelectItem>
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
                  <TableHead>Schedule #</TableHead>
                  <TableHead>OT</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Surgery</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No surgeries found
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs">{s.scheduleNo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.otName}</p>
                          <p className="text-xs text-muted-foreground">{s.otType}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.patientName}</p>
                          <p className="text-xs text-muted-foreground">{s.admissionNo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.surgeryName}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(s.scheduledDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.scheduledStartTime}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.estimatedDuration}min</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', statusColors[s.status] || '')}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(statusActions[s.status] || []).map((action) => (
                            <Button
                              key={action.label}
                              size="sm"
                              variant={action.variant}
                              className={cn('h-7 text-xs', action.color)}
                              onClick={() => {
                                setActionDialog({ scheduleId: s.id, action: action.label === 'Start' ? 'InProgress' : action.label === 'Complete' ? 'Completed' : action.label === 'Cancel' ? 'Cancelled' : 'Postponed' })
                                setActionTime('')
                                setActionReason('')
                              }}
                            >
                              <action.icon className="mr-1 h-3 w-3" />
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.action === 'InProgress' && 'Start Surgery?'}
              {actionDialog?.action === 'Completed' && 'Complete Surgery?'}
              {actionDialog?.action === 'Cancelled' && 'Cancel Surgery?'}
              {actionDialog?.action === 'Postponed' && 'Postpone Surgery?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.action === 'InProgress' && 'This will mark the surgery as in progress.'}
              {actionDialog?.action === 'Completed' && 'This will mark the surgery as completed.'}
              {actionDialog?.action === 'Cancelled' && 'Provide a reason for cancellation.'}
              {actionDialog?.action === 'Postponed' && 'This surgery will be postponed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {(actionDialog?.action === 'InProgress' || actionDialog?.action === 'Completed') && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={actionTime}
                  onChange={(e) => setActionTime(e.target.value)}
                  placeholder="e.g., 09:15"
                />
              </div>
            </div>
          )}

          {actionDialog?.action === 'Cancelled' && (
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Cancellation reason..."
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
