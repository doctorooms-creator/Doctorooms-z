'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  ListClock,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SLOT_REGEX = /^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i

interface ScheduleItem {
  id: string
  day: string
  startTime: string
  endTime: string
  slotDuration: number
  timeSlots?: string
}

interface SlotScheduleItem {
  id: string
  day: string
  startTime: string
  endTime: string
  slotDuration: number
  timeSlots: string
  manualSlots: string[]
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

  // Manual slot management state per day
  const [newSlotInput, setNewSlotInput] = useState<Record<string, string>>({})
  const [useManualSlots, setUseManualSlots] = useState<Record<string, boolean>>({})

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery<{ schedules: ScheduleItem[] }>({
    queryKey: ['doctor-schedule'],
    queryFn: () => fetch('/api/dashboard/doctor/schedule').then((r) => r.json()),
  })

  const { data: slotsData, isLoading: slotsLoading } = useQuery<{ schedules: SlotScheduleItem[] }>({
    queryKey: ['doctor-slots'],
    queryFn: () => fetch('/api/dashboard/doctor/schedule/slots').then((r) => r.json()),
  })

  const { data: holidaysData, isLoading: holidaysLoading } = useQuery<{ holidays: Holiday[] }>({
    queryKey: ['doctor-holidays'],
    queryFn: () => fetch('/api/dashboard/doctor/holidays').then((r) => r.json()),
  })

  const saveScheduleMutation = useMutation({
    mutationFn: (schedules: { day: string; startTime: string; endTime: string; slotDuration: number; timeSlots?: string[] }[]) =>
      fetch('/api/dashboard/doctor/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] })
      toast.success('Schedule saved')
      setEditDay(null)
    },
    onError: () => toast.error('Failed to save schedule'),
  })

  const updateSlotsMutation = useMutation({
    mutationFn: ({ day, timeSlots }: { day: string; timeSlots: string[] }) =>
      fetch('/api/dashboard/doctor/schedule/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, timeSlots }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] })
      toast.success('Time slots updated')
    },
    onError: () => toast.error('Failed to update time slots'),
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
  const slotSchedules = slotsData?.schedules || []

  // Build map from slots data for manual slot info
  const slotMap = slotSchedules.reduce((acc, s) => {
    acc[s.day] = s
    return acc
  }, {} as Record<string, SlotScheduleItem>)

  const scheduleMap = schedules.reduce((acc, s) => {
    acc[s.day] = s
    return acc
  }, {} as Record<string, ScheduleItem>)

  // Auto-generate slots from startTime/endTime/slotDuration
  const autoGenerateSlots = useCallback((startTime: string, endTime: string, slotDuration: number): string[] => {
    const slots: string[] = []
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    let currentMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60)
      const m = currentMinutes % 60
      const period = h >= 12 ? 'PM' : 'AM'
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
      slots.push(`${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`)
      currentMinutes += slotDuration
    }
    return slots
  }, [])

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

  const handleAddSlot = (day: string) => {
    const raw = (newSlotInput[day] || '').trim().toUpperCase()
    if (!raw) return

    // Validate format
    if (!SLOT_REGEX.test(raw)) {
      toast.error('Invalid format. Use HH:MM AM/PM (e.g. 09:30 AM)')
      return
    }

    // Normalize format
    const formatted = raw.replace(/\s+/g, ' ')

    const current = slotMap[day]?.manualSlots || []
    if (current.includes(formatted)) {
      toast.error('This slot already exists')
      return
    }

    updateSlotsMutation.mutate({ day, timeSlots: [...current, formatted] })
    setNewSlotInput((prev) => ({ ...prev, [day]: '' }))
  }

  const handleRemoveSlot = (day: string, slot: string) => {
    const current = slotMap[day]?.manualSlots || []
    updateSlotsMutation.mutate({ day, timeSlots: current.filter((s) => s !== slot) })
  }

  const handleToggleManualSlots = (day: string, checked: boolean) => {
    setUseManualSlots((prev) => ({ ...prev, [day]: checked }))
    if (!checked) {
      // Turning off manual mode — clear the manual slots
      updateSlotsMutation.mutate({ day, timeSlots: [] })
    }
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day, i) => {
            const sched = scheduleMap[day]
            const slotData = slotMap[day]
            const manualSlots = slotData?.manualSlots || []
            const hasManualSlots = manualSlots.length > 0
            // Initialize toggle state: on if manual slots exist
            const isManualMode = useManualSlots[day] !== undefined ? useManualSlots[day] : hasManualSlots
            const autoSlots = sched
              ? autoGenerateSlots(sched.startTime, sched.endTime, sched.slotDuration)
              : []
            const activeSlots = isManualMode && hasManualSlots ? manualSlots : autoSlots

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
                  <CardContent className="space-y-3">
                    {sched ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {sched.startTime} — {sched.endTime}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {sched.slotDuration} min slots
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeSlots.length} slot{activeSlots.length !== 1 ? 's' : ''}/day
                        </div>

                        {/* Manual Slots Toggle */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <ListClock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            <Label htmlFor={`manual-${day}`} className="text-xs cursor-pointer select-none">
                              {isManualMode ? 'Manual slots' : 'Auto-generate'}
                            </Label>
                          </div>
                          <Switch
                            id={`manual-${day}`}
                            checked={isManualMode}
                            onCheckedChange={(checked) => handleToggleManualSlots(day, checked)}
                            className="data-[state=checked]:bg-teal-600"
                          />
                        </div>

                        {/* Manual Slot Management */}
                        {isManualMode && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            {/* Slot Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              <AnimatePresence mode="popLayout">
                                {manualSlots.length === 0 && !slotsLoading && (
                                  <motion.span
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-muted-foreground italic"
                                  >
                                    No manual slots yet
                                  </motion.span>
                                )}
                                {manualSlots.map((slot) => (
                                  <motion.div
                                    key={slot}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 gap-1 pr-1 cursor-default"
                                    >
                                      {slot}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSlot(day, slot)}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
                                        aria-label={`Remove ${slot}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>

                            {/* Add Slot Input */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="09:30 AM"
                                value={newSlotInput[day] || ''}
                                onChange={(e) => setNewSlotInput((prev) => ({ ...prev, [day]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddSlot(day)
                                  }
                                }}
                                className="h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
                                onClick={() => handleAddSlot(day)}
                                disabled={updateSlotsMutation.isPending}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {/* Auto slots preview (when not in manual mode) */}
                        {!isManualMode && sched && (
                          <div className="max-h-24 overflow-y-auto">
                            <div className="flex flex-wrap gap-1">
                              {autoSlots.map((slot) => (
                                <Badge
                                  key={slot}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 text-muted-foreground"
                                >
                                  {slot}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
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
