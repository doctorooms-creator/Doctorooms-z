'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  CalendarOff,
  CalendarRange,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  Layers,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ==================== TYPES ====================

interface ScheduleDay {
  day: string
  startTime: string
  endTime: string
  slotDuration: number
  timeSlots: string[]
}

interface Holiday {
  id: string
  date: string
  remark: string
}

interface ScheduleData {
  doctor: {
    id: string
    name: string
    profileImg: string
    specialization: string
  }
  schedules: (ScheduleDay | null)[]
  holidays: Holiday[]
  todayName: string
}

interface HolidayRow {
  date: Date | undefined
  remark: string
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ReceptionistSchedulePage() {
  const queryClient = useQueryClient()

  // Schedule query
  const { data, isLoading } = useQuery<ScheduleData>({
    queryKey: ['receptionist-schedule'],
    queryFn: () => fetch('/api/dashboard/receptionist/schedule').then(r => r.json()),
  })

  // Holidays query (separate, includes past + future)
  const { data: holidaysData } = useQuery<{ holidays: Holiday[] }>({
    queryKey: ['receptionist-holidays'],
    queryFn: () => fetch('/api/receptionist/holidays').then(r => r.json()),
  })

  // Booking days query
  const { data: bookingDaysData } = useQuery<{ bookingDays: number }>({
    queryKey: ['receptionist-booking-days'],
    queryFn: () => fetch('/api/receptionist/booking-days').then(r => r.json()),
  })

  // State
  const [addHolidayOpen, setAddHolidayOpen] = useState(false)
  const [batchHolidayOpen, setBatchHolidayOpen] = useState(false)
  const [bookingDaysOpen, setBookingDaysOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [remark, setRemark] = useState('')
  const [bookingDaysInput, setBookingDaysInput] = useState('')
  const [batchRows, setBatchRows] = useState<HolidayRow[]>([
    { date: undefined, remark: '' },
  ])

  // Add holiday mutation
  const addMutation = useMutation({
    mutationFn: async (payload: { date: string; remark: string }) => {
      const res = await fetch('/api/receptionist/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add holiday')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-holidays'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-schedule'] })
      toast.success('Holiday added successfully')
      setAddHolidayOpen(false)
      setSelectedDate(undefined)
      setRemark('')
    },
    onError: (err) => toast.error(err.message),
  })

  // Delete holiday mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/receptionist/holidays/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete holiday')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-holidays'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-schedule'] })
      toast.success('Holiday deleted')
      setDeleteId(null)
    },
    onError: (err) => toast.error(err.message),
  })

  // Update booking days mutation
  const updateBookingDaysMutation = useMutation({
    mutationFn: async (bookingDays: number) => {
      const res = await fetch('/api/receptionist/booking-days', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingDays }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-booking-days'] })
      toast.success(`Booking days updated to ${data.bookingDays}`)
      setBookingDaysOpen(false)
    },
    onError: (err) => toast.error(err.message),
  })

  // Handlers
  const handleAddHoliday = useCallback(() => {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    addMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      remark: remark.trim(),
    })
  }, [selectedDate, remark, addMutation])

  const handleSaveBookingDays = useCallback(() => {
    const val = parseInt(bookingDaysInput, 10)
    if (isNaN(val) || val < 1 || val > 365) {
      toast.error('Must be a number between 1 and 365')
      return
    }
    updateBookingDaysMutation.mutate(val)
  }, [bookingDaysInput, updateBookingDaysMutation])

  const handleBatchAdd = useCallback(() => {
    const validRows = batchRows.filter(r => r.date)
    if (validRows.length === 0) {
      toast.error('Add at least one holiday with a date')
      return
    }
    let successCount = 0
    let failCount = 0
    const promises = validRows.map(row => {
      return fetch('/api/receptionist/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: format(row.date!, 'yyyy-MM-dd'), remark: row.remark.trim() }),
      })
        .then(res => {
          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        })
        .catch(() => {
          failCount++
        })
    })
    Promise.all(promises).then(() => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-holidays'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-schedule'] })
      if (successCount > 0) toast.success(`${successCount} holiday${successCount > 1 ? 's' : ''} added`)
      if (failCount > 0) toast.error(`${failCount} holiday${failCount > 1 ? 's' : ''} failed (duplicate or past date)`)
      setBatchHolidayOpen(false)
      setBatchRows([{ date: undefined, remark: '' }])
    })
  }, [batchRows, queryClient])

  const addBatchRow = useCallback(() => {
    setBatchRows(prev => [...prev, { date: undefined, remark: '' }])
  }, [])

  const removeBatchRow = useCallback((index: number) => {
    setBatchRows(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateBatchRow = useCallback((index: number, field: keyof HolidayRow, value: Date | undefined | string) => {
    setBatchRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }, [])

  // Helpers
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const allHolidays = holidaysData?.holidays ?? []
  const futureHolidays = allHolidays.filter(h => {
    try { return new Date(h.date) >= new Date(todayStr) } catch { return false }
  })
  const pastHolidays = allHolidays.filter(h => {
    try { return new Date(h.date) < new Date(todayStr) } catch { return false }
  })
  const isPast = (dateStr: string) => { try { return new Date(dateStr) < new Date(todayStr) } catch { return false } }
  const bookingDays = bookingDaysData?.bookingDays ?? 180

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
          <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Doctor&apos;s Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Dr. {data.doctor.name}{data.doctor.specialization ? ` · ${data.doctor.specialization}` : ''}
          </p>
        </div>
      </div>

      {/* Booking Days Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-emerald-200/60 dark:border-emerald-900/30">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CalendarRange className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking Window</p>
                <p className="text-base font-semibold">
                  Patients can book up to <span className="text-emerald-600 dark:text-emerald-400">{bookingDays} days</span> in advance
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBookingDaysInput(String(bookingDays))
                setBookingDaysOpen(true)
              }}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Schedule Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.schedules.map((day, i) => {
          const dayName = dayNames[i]
          if (!day) {
            return (
              <motion.div
                key={dayName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-muted-foreground">{dayName}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Off
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/60">No schedule</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          }

          const isToday = day.day === data.todayName
          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                'h-full border-l-4 transition-shadow hover:shadow-md',
                isToday ? 'border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/10' : 'border-l-emerald-400'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        isToday ? 'bg-teal-500' : 'bg-emerald-500'
                      )} />
                      <p className={cn('text-sm font-semibold', isToday && 'text-teal-700 dark:text-teal-400')}>
                        {day.day}
                      </p>
                      {isToday && (
                        <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{day.startTime} - {day.endTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Slot duration: {day.slotDuration} min
                    </p>
                    {day.timeSlots.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">TIME SLOTS</p>
                        <div className="flex flex-wrap gap-1">
                          {day.timeSlots.map((slot) => (
                            <span
                              key={slot}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Holidays Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-red-500" />
            <h3 className="text-base font-semibold">Holidays</h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400">
              {futureHolidays.length} upcoming
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBatchRows([{ date: undefined, remark: '' }])
                setBatchHolidayOpen(true)
              }}
            >
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              Batch Add
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedDate(undefined)
                setRemark('')
                setAddHolidayOpen(true)
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Holiday
            </Button>
          </div>
        </div>

        {allHolidays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <CalendarOff className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No holidays scheduled</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Future holidays first */}
            {futureHolidays.map((holiday, i) => (
              <motion.div
                key={holiday.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="border-red-200/50 dark:border-red-900/30">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <CalendarDays className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {format(new Date(holiday.date), 'MMM d, yyyy')}
                        </p>
                        <Badge variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                          Upcoming
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{holiday.remark || 'No remark'}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8"
                      onClick={() => setDeleteId(holiday.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {/* Past holidays */}
            {pastHolidays.map((holiday, i) => (
              <motion.div
                key={holiday.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (futureHolidays.length + i) * 0.04 }}
              >
                <Card className="border-border/50 opacity-60">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-muted-foreground">
                          {format(new Date(holiday.date), 'MMM d, yyyy')}
                        </p>
                        <Badge variant="outline" className="shrink-0 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-[10px] px-1.5 py-0">
                          Past
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground/60 truncate">{holiday.remark || 'No remark'}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Holiday Dialog */}
      <Dialog open={addHolidayOpen} onOpenChange={setAddHolidayOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Select a date and optionally add a remark.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Remark (optional)</Label>
              <Input
                placeholder="e.g. Republic Day"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHolidayOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddHoliday}
              disabled={addMutation.isPending || !selectedDate}
            >
              {addMutation.isPending ? 'Adding...' : 'Add Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Add Holidays Dialog */}
      <Dialog open={batchHolidayOpen} onOpenChange={(open) => {
        if (!open) setBatchRows([{ date: undefined, remark: '' }])
        setBatchHolidayOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Add Holidays</DialogTitle>
            <DialogDescription>
              Add multiple holidays at once. Duplicate or past dates will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {batchRows.map((row, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-9 text-sm',
                          !row.date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarDays className="mr-2 h-3.5 w-3.5" />
                        {row.date ? format(row.date, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={row.date}
                        onSelect={(d) => updateBatchRow(index, 'date', d)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Remark</Label>
                  <Input
                    placeholder="Optional"
                    value={row.remark}
                    onChange={(e) => updateBatchRow(index, 'remark', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                {batchRows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 text-muted-foreground hover:text-red-500"
                    onClick={() => removeBatchRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={addBatchRow}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Row
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchHolidayOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBatchAdd}
              disabled={batchRows.every(r => !r.date)}
            >
              Save All ({batchRows.filter(r => r.date).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Days Edit Dialog */}
      <Dialog open={bookingDaysOpen} onOpenChange={setBookingDaysOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Booking Window</DialogTitle>
            <DialogDescription>
              Set how many days in advance patients can book appointments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Days (1 - 365)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={bookingDaysInput}
                onChange={(e) => setBookingDaysInput(e.target.value)}
                placeholder="e.g. 180"
              />
              <p className="text-xs text-muted-foreground">
                Current: {bookingDays} days
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDaysOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveBookingDays}
              disabled={updateBookingDaysMutation.isPending}
            >
              {updateBookingDaysMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
