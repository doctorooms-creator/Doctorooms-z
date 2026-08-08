'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Clock,
  Plus,
  Trash2,
  CalendarOff,
  Pencil,
  Save,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleItem {
  id: string
  day: string
  startTime: string
  endTime: string
  slotDuration: number
}

interface Holiday {
  id: string
  date: string
  remark: string
}

export default function DoctorSchedulePage() {
  const queryClient = useQueryClient()
  const [editDay, setEditDay] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ startTime: '09:00', endTime: '17:00', slotDuration: 30 })
  const [holidayDialog, setHolidayDialog] = useState(false)
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayRemark, setHolidayRemark] = useState('')
  const [deleteHoliday, setDeleteHoliday] = useState<string | null>(null)

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery<{ schedules: ScheduleItem[] }>({
    queryKey: ['doctor-schedule'],
    queryFn: () => fetch('/api/dashboard/doctor/schedule').then((r) => r.json()),
  })

  const { data: holidaysData, isLoading: holidaysLoading } = useQuery<{ holidays: Holiday[] }>({
    queryKey: ['doctor-holidays'],
    queryFn: () => fetch('/api/dashboard/doctor/holidays').then((r) => r.json()),
  })

  const saveScheduleMutation = useMutation({
    mutationFn: (schedules: { day: string; startTime: string; endTime: string; slotDuration: number }[]) =>
      fetch('/api/dashboard/doctor/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] })
      toast.success('Schedule saved')
      setEditDay(null)
    },
    onError: () => toast.error('Failed to save schedule'),
  })

  const addHolidayMutation = useMutation({
    mutationFn: () =>
      fetch('/api/dashboard/doctor/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: holidayDate, remark: holidayRemark }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-holidays'] })
      toast.success('Holiday added')
      setHolidayDialog(false)
      setHolidayDate('')
      setHolidayRemark('')
    },
    onError: () => toast.error('Failed to add holiday'),
  })

  const deleteHolidayMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/holidays?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-holidays'] })
      toast.success('Holiday removed')
      setDeleteHoliday(null)
    },
    onError: () => toast.error('Failed to remove holiday'),
  })

  const schedules = scheduleData?.schedules || []
  const holidays = holidaysData?.holidays || []
  const scheduleMap = schedules.reduce((acc, s) => {
    acc[s.day] = s
    return acc
  }, {} as Record<string, ScheduleItem>)

  const openEditDay = (day: string) => {
    const existing = scheduleMap[day]
    setEditForm({
      startTime: existing?.startTime || '09:00',
      endTime: existing?.endTime || '17:00',
      slotDuration: existing?.slotDuration || 30,
    })
    setEditDay(day)
  }

  const saveSchedule = () => {
    if (!editDay) return
    saveScheduleMutation.mutate([
      { day: editDay, ...editForm, slotDuration: parseInt(String(editForm.slotDuration)) || 30 },
    ])
  }

  const saveAllDays = () => {
    const allSchedules = DAYS.map((day) => {
      const existing = scheduleMap[day]
      return {
        day,
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '17:00',
        slotDuration: existing?.slotDuration || 30,
      }
    })
    saveScheduleMutation.mutate(allSchedules)
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Weekly Schedule
        </h2>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={saveAllDays} disabled={saveScheduleMutation.isPending}>
          <Save className="mr-2 h-4 w-4" /> Save All
        </Button>
      </div>

      {scheduleLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day, i) => {
            const sched = scheduleMap[day]
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={cn(sched && 'border-teal-300 dark:border-teal-700')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{day}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDay(day)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sched ? (
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {sched.startTime} — {sched.endTime}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {sched.slotDuration} min slots
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round(
                            (new Date(`2000-01-01T${sched.endTime}`).getTime() - new Date(`2000-01-01T${sched.startTime}`).getTime()) / (sched.slotDuration * 60000)
                          )} slots/day
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Holidays */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarOff className="h-5 w-5 text-red-500" />
          Holidays
        </h2>
        <Button variant="outline" onClick={() => setHolidayDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Holiday
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {holidaysLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : holidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarOff className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No holidays added</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {holidays.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <CalendarOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{format(new Date(h.date), 'EEEE, MMMM d, yyyy')}</p>
                    {h.remark && <p className="text-xs text-muted-foreground truncate">{h.remark}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => setDeleteHoliday(h.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Day Dialog */}
      <Dialog open={!!editDay} onOpenChange={(open) => !open && setEditDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editDay}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={editForm.slotDuration}
                onChange={(e) => setEditForm({ ...editForm, slotDuration: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDay(null)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={saveSchedule} disabled={saveScheduleMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={holidayDialog} onOpenChange={setHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Input value={holidayRemark} onChange={(e) => setHolidayRemark(e.target.value)} placeholder="e.g. National Holiday" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialog(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => addHolidayMutation.mutate()} disabled={addHolidayMutation.isPending}>
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation */}
      <AlertDialog open={!!deleteHoliday} onOpenChange={(open) => !open && setDeleteHoliday(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this holiday? You will be available for appointments on this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteHoliday && deleteHolidayMutation.mutate(deleteHoliday)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
