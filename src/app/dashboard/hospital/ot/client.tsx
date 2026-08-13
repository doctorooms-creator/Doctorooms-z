'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Cross,
  Plus,
  Clock,
  CalendarDays,
  User,
  Activity,
  Building2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface OT {
  id: string
  name: string
  otType: string
  floorNo: string
  status: string
  todayScheduleCount: number
}

interface Surgery {
  id: string
  scheduleNo: string
  patientName: string
  patientAge: number
  patientGender: string
  admissionNo: string
  surgeonName: string
  surgeryName: string
  surgeryType: string
  scheduledStartTime: string
  estimatedDuration: number
  actualStartTime: string
  actualEndTime: string
  status: string
  notes: string
}

interface OTBoard {
 id: string
 name: string
 otType: string
 floorNo: string
 status: string
 surgeries: Surgery[]
}

interface ScheduleItem {
 id: string
 scheduleNo: string
 otName: string
 otType: string
 otFloor: string
 patientName: string
 patientAge: number
 patientGender: string
 admissionNo: string
 surgeonName: string
 surgeryName: string
 surgeryType: string
 scheduledDate: string
 scheduledStartTime: string
 estimatedDuration: number
 status: string
}

const otStatusColors: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Occupied: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Maintenance: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

const surgeryStatusColors: Record<string, string> = {
  Scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  InProgress: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Postponed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
}

const otTypeColors: Record<string, string> = {
  Major: 'border-l-4 border-l-rose-500',
  Minor: 'border-l-4 border-l-amber-500',
  Emergency: 'border-l-4 border-l-red-600',
  DayCare: 'border-l-4 border-l-teal-500',
}

export default function OtBoardClient() {
  const queryClient = useQueryClient()
  const [showAddOt, setShowAddOt] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tab, setTab] = useState('board')

  // Add OT form
  const [otName, setOtName] = useState('')
  const [otType, setOtType] = useState('Major')
  const [otFloor, setOtFloor] = useState('')

  // Schedule form
  const [schedOtId, setSchedOtId] = useState('')
  const [schedAdmissionId, setSchedAdmissionId] = useState('')
  const [surgeryName, setSurgeryName] = useState('')
  const [surgeryType, setSurgeryType] = useState('Elective')
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0])
  const [schedTime, setSchedTime] = useState('09:00')
  const [estDuration, setEstDuration] = useState('60')
  const [schedNotes, setSchedNotes] = useState('')

  // OT List
  const { data: otsData, isLoading: otsLoading } = useQuery<{ operationTheaters: OT[] }>({
    queryKey: ['operation-theaters'],
    queryFn: () => fetch('/api/operation-theaters').then((r) => r.json()),
    refetchInterval: 30000,
  })

  // Today's OT Board
  const { data: boardData, isLoading: boardLoading } = useQuery<{ date: string; operationTheaters: OTBoard[] }>({
    queryKey: ['ot-today-board'],
    queryFn: () => fetch('/api/ot-schedules/today').then((r) => r.json()),
    refetchInterval: 30000,
  })

  // All schedules
  const { data: schedulesData, isLoading: schedLoading } = useQuery<{ schedules: ScheduleItem[] }>({
    queryKey: ['ot-schedules'],
    queryFn: () => fetch('/api/ot-schedules').then((r) => r.json()),
    enabled: tab === 'schedule',
  })

  // Add OT mutation
  const addOtMutation = useMutation({
    mutationFn: (data: { name: string; otType: string; floorNo: string }) =>
      fetch('/api/operation-theaters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Operation Theater added')
      setShowAddOt(false)
      setOtName('')
      setOtFloor('')
      setOtType('Major')
      queryClient.invalidateQueries({ queryKey: ['operation-theaters'] })
      queryClient.invalidateQueries({ queryKey: ['ot-today-board'] })
    },
    onError: () => toast.error('Failed to add OT'),
  })

  // Delete OT mutation
  const deleteOtMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/operation-theaters/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('OT deleted')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['operation-theaters'] })
      queryClient.invalidateQueries({ queryKey: ['ot-today-board'] })
    },
    onError: () => toast.error('Failed to delete OT'),
  })

  // Schedule surgery mutation
  const scheduleMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch('/api/ot-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Surgery scheduled')
      setShowSchedule(false)
      resetScheduleForm()
      queryClient.invalidateQueries({ queryKey: ['ot-today-board'] })
      queryClient.invalidateQueries({ queryKey: ['ot-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['operation-theaters'] })
    },
    onError: () => toast.error('Failed to schedule surgery'),
  })

  function resetScheduleForm() {
    setSchedOtId('')
    setSchedAdmissionId('')
    setSurgeryName('')
    setSurgeryType('Elective')
    setSchedDate(new Date().toISOString().split('T')[0])
    setSchedTime('09:00')
    setEstDuration('60')
    setSchedNotes('')
  }

  const ots = otsData?.operationTheaters ?? []
  const board = boardData?.operationTheaters ?? []
  const schedules = schedulesData?.schedules ?? []
  const totalTodaySurgeries = board.reduce((acc, ot) => acc + ot.surgeries.length, 0)
  const inProgressCount = board.reduce(
    (acc, ot) => acc + ot.surgeries.filter((s) => s.status === 'InProgress').length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total OTs</p>
                <p className="text-2xl font-bold">{ots.length}</p>
              </div>
              <div className="rounded-lg bg-teal-100 p-2.5 dark:bg-teal-900/40">
                <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{ots.filter((o) => o.status === 'Available').length}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/40">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Surgeries</p>
                <p className="text-2xl font-bold">{totalTodaySurgeries}</p>
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
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowAddOt(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add OT
        </Button>
        <Button variant="outline" onClick={() => setShowSchedule(true)}>
          <CalendarDays className="mr-2 h-4 w-4" /> Schedule Surgery
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="board">OT Board</TabsTrigger>
          <TabsTrigger value="schedule">All Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {boardLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-20 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : board.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Cross className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No operation theaters configured yet</p>
                <Button className="mt-3" onClick={() => setShowAddOt(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add OT
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {board.map((ot, i) => (
                <motion.div
                  key={ot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={cn(
                      'h-full transition-shadow hover:shadow-lg',
                      otTypeColors[ot.otType] || 'border-l-4 border-l-slate-400'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{ot.name}</CardTitle>
                        <Badge
                          className={cn(
                            'text-[10px]',
                            otStatusColors[ot.status] || 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {ot.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{ot.otType}</span>
                        {ot.floorNo && <span>Floor {ot.floorNo}</span>}
                        <span>{ot.surgeries.length} surgery</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {ot.surgeries.length === 0 ? (
                        <div className="flex flex-col items-center py-4 text-muted-foreground">
                          <Clock className="mb-1 h-8 w-8 opacity-50" />
                          <p className="text-xs">No surgeries today</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {ot.surgeries.map((s) => (
                            <div
                              key={s.id}
                              className={cn(
                                'rounded-lg border p-3 text-sm',
                                s.status === 'InProgress'
                                  ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30'
                                  : 'border-border'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium truncate">{s.surgeryName}</p>
                                <Badge
                                  className={cn(
                                    'shrink-0 text-[9px]',
                                    surgeryStatusColors[s.status] || ''
                                  )}
                                >
                                  {s.status}
                                </Badge>
                              </div>
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                <p>
                                  <User className="mr-1 inline h-3 w-3" />
                                  {s.patientName} ({s.patientGender}, {s.patientAge}y)
                                </p>
                                <p>
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  {s.scheduledStartTime} · {s.estimatedDuration}min
                                  {s.actualStartTime && ` · Started: ${s.actualStartTime}`}
                                </p>
                                <p>Surgeon: {s.surgeonName}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
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
                      <TableHead>Surgeon</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedLoading ? (
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
                          No surgeries scheduled
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedules.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.scheduleNo}</TableCell>
                          <TableCell>{s.otName}</TableCell>
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
                          <TableCell className="text-sm">{s.scheduledStartTime}</TableCell>
                          <TableCell className="text-sm">{s.estimatedDuration}min</TableCell>
                          <TableCell className="text-sm">{s.surgeonName}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', surgeryStatusColors[s.status] || '')}>
                              {s.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add OT Dialog */}
      <Dialog open={showAddOt} onOpenChange={setShowAddOt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Operation Theater</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>OT Name</Label>
              <Input
                placeholder="e.g., OT-1 Main"
                value={otName}
                onChange={(e) => setOtName(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={otType} onValueChange={setOtType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="DayCare">Day Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Floor No.</Label>
              <Input placeholder="e.g., 2nd Floor" value={otFloor} onChange={(e) => setOtFloor(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOt(false)}>Cancel</Button>
            <Button
              onClick={() => addOtMutation.mutate({ name: otName, otType, floorNo: otFloor })}
              disabled={!otName || addOtMutation.isPending}
            >
              {addOtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add OT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Surgery Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Surgery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Operation Theater</Label>
                <Select value={schedOtId} onValueChange={setSchedOtId}>
                  <SelectTrigger><SelectValue placeholder="Select OT" /></SelectTrigger>
                  <SelectContent>
                    {ots.map((ot) => (
                      <SelectItem key={ot.id} value={ot.id}>
                        {ot.name} ({ot.otType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Surgery Type</Label>
                <Select value={surgeryType} onValueChange={setSurgeryType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elective">Elective</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Admission ID</Label>
              <Input
                placeholder="Enter IPD admission ID"
                value={schedAdmissionId}
                onChange={(e) => setSchedAdmissionId(e.target.value)}
              />
            </div>
            <div>
              <Label>Surgery Name</Label>
              <Input
                placeholder="e.g., Appendectomy"
                value={surgeryName}
                onChange={(e) => setSurgeryName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={estDuration}
                  onChange={(e) => setEstDuration(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={schedNotes}
                onChange={(e) => setSchedNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button
              onClick={() =>
                scheduleMutation.mutate({
                  otId: schedOtId,
                  admissionId: schedAdmissionId,
                  surgeryName,
                  surgeryType,
                  scheduledDate: schedDate,
                  scheduledStartTime: schedTime,
                  estimatedDuration: parseInt(estDuration) || 60,
                  notes: schedNotes,
                })
              }
              disabled={!schedOtId || !schedAdmissionId || !surgeryName || scheduleMutation.isPending}
            >
              {scheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operation Theater?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. OTs with existing schedules cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteOtMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteOtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
