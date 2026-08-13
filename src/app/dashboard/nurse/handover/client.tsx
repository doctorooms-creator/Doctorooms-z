'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  BedDouble,
  ClipboardList,
  Plus,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Inbox,
  Pill,
  TestTube2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────

interface PatientSummary {
  admissionId: string
  summary: string
}

interface PendingTask {
  task: string
  priority: 'High' | 'Medium' | 'Low'
}

interface LatestVital {
  id: string
  temperature: number
  pulse: number
  spo2: number
  bpSystolic: number
  bpDiastolic: number
  respiratoryRate: number
  patientStatus: string
  recordedAt: string
}

interface HandoverData {
  id: string
  shiftType: string
  shiftDate: string
  wardName: string
  fromNurseName: string
  toNurseName: string
  patientSummaries: PatientSummary[]
  wardNotes: string
  pendingTasks: PendingTask[]
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  createdAt: string
}

interface PatientData {
  assignmentId: string
  admissionId: string
  admissionNo: string
  patientName: string
  patientAge: number
  patientGender: string
  bedNumber: string
  initialDiagnosis: string
  latestVital: LatestVital | null
  pendingMedCount: number
  pendingSampleCount: number
}

interface NextShiftNurse {
  id: string
  name: string
  employeeId: string
  shift: string
}

interface HandoverResponse {
  currentShift: string
  wardName: string
  incomingHandovers: HandoverData[]
  outgoingHandovers: HandoverData[]
  patients: PatientData[]
  nextShiftNurses: NextShiftNurse[]
}

// ─── Priority helpers ─────────────────────────────────────────────

const priorityConfig = {
  High: { bg: 'bg-red-100 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900', icon: AlertTriangle },
  Medium: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900', icon: Clock },
  Low: { bg: 'bg-teal-100 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-900', icon: CheckCircle2 },
} as const

const shiftBadgeConfig: Record<string, { bg: string; text: string }> = {
  Morning: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
  Evening: { bg: 'bg-sky-100 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-400' },
  Night: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400' },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Main Component ───────────────────────────────────────────────

export default function HandoverClient() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('incoming')

  // Form state for Write Handover
  const [patientSummaries, setPatientSummaries] = useState<Record<string, string>>({})
  const [wardNotes, setWardNotes] = useState('')
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
  const [toNurseId, setToNurseId] = useState('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // ─── Data fetching ──────────────────────────────────────────────

  const { data, isLoading, error, refetch } = useQuery<HandoverResponse>({
    queryKey: ['nurse-handover'],
    queryFn: () => fetch('/api/dashboard/nurse/handover').then((r) => r.json()),
    refetchInterval: 30_000,
  })

  // ─── Mutations ──────────────────────────────────────────────────

  const acknowledgeMutation = useMutation({
    mutationFn: (handoverId: string) =>
      fetch('/api/dashboard/nurse/handover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoverId }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Handover acknowledged successfully')
      queryClient.invalidateQueries({ queryKey: ['nurse-handover'] })
    },
    onError: () => toast.error('Failed to acknowledge handover'),
  })

  const submitMutation = useMutation({
    mutationFn: () => {
      // Build patient summaries array from form state
      const summaries = (data?.patients || [])
        .filter((p) => patientSummaries[p.admissionId]?.trim())
        .map((p) => ({
          admissionId: p.admissionId,
          summary: patientSummaries[p.admissionId].trim(),
        }))

      return fetch('/api/dashboard/nurse/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toNurseId,
          patientSummaries: summaries,
          wardNotes,
          pendingTasks: pendingTasks.filter((t) => t.task.trim()),
        }),
      }).then((r) => r.json())
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Shift handover submitted successfully!')
      setPatientSummaries({})
      setWardNotes('')
      setPendingTasks([])
      setToNurseId('')
      queryClient.invalidateQueries({ queryKey: ['nurse-handover'] })
      setActiveTab('incoming')
    },
    onError: () => toast.error('Failed to submit handover'),
  })

  // ─── Helpers ────────────────────────────────────────────────────

  const toggleCard = useCallback((id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const addPendingTask = useCallback(() => {
    setPendingTasks((prev) => [...prev, { task: '', priority: 'Medium' }])
  }, [])

  const removePendingTask = useCallback((idx: number) => {
    setPendingTasks((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const updatePendingTask = useCallback((idx: number, field: keyof PendingTask, value: string) => {
    setPendingTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    )
  }, [])

  const isSubmitting = submitMutation.isPending
  const hasPatients = (data?.patients || []).length > 0
  const hasIncoming = (data?.incomingHandovers || []).length > 0
  const hasOutgoing = (data?.outgoingHandovers || []).length > 0
  const unacknowledgedIncoming = (data?.incomingHandovers || []).filter((h) => !h.acknowledgedAt)

  // ─── Loading state ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24 ml-auto" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <div className="rounded-full bg-red-100 dark:bg-red-950/40 p-4">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Failed to load handover data</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          There was an error fetching your shift handover information. Please try again.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/50">
            <ArrowRightLeft className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Shift Handover</h1>
            <p className="text-sm text-muted-foreground">
              {data?.wardName || 'Ward'} &middot;{' '}
              <span
                className={cn(
                  'font-medium',
                  shiftBadgeConfig[data?.currentShift || 'Morning']?.text
                )}
              >
                {data?.currentShift} Shift
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {unacknowledgedIncoming.length > 0 && (
            <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {unacknowledgedIncoming.length} unacknowledged
            </Badge>
          )}
          {hasPatients && (
            <Badge variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-400">
              <User className="h-3 w-3 mr-1" />
              {data?.patients.length} patients
            </Badge>
          )}
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="h-4 w-4" />
            Incoming
            {unacknowledgedIncoming.length > 0 && (
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold bg-red-500 text-white">
                {unacknowledgedIncoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="write" className="gap-2">
            <Send className="h-4 w-4" />
            Write Handover
          </TabsTrigger>
          {hasOutgoing && (
            <TabsTrigger value="outgoing" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Sent
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">
                {data?.outgoingHandovers.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══════ TAB 1: Incoming Handover ═══════ */}
        <TabsContent value="incoming" className="mt-6">
          <AnimatePresence mode="wait">
            {!hasIncoming ? (
              <motion.div
                key="empty-incoming"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="rounded-full bg-teal-100 dark:bg-teal-950/40 p-6">
                  <Inbox className="h-10 w-10 text-teal-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">No Incoming Handover</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    There is no shift handover waiting for you from the previous shift nurse.
                    All clear!
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="incoming-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {data!.incomingHandovers.map((handover, idx) => (
                  <IncomingHandoverCard
                    key={handover.id}
                    handover={handover}
                    index={idx}
                    isExpanded={expandedCards.has(handover.id)}
                    onToggle={() => toggleCard(handover.id)}
                    onAcknowledge={() => acknowledgeMutation.mutate(handover.id)}
                    isAcknowledging={acknowledgeMutation.isPending}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══════ TAB 2: Write Handover ═══════ */}
        <TabsContent value="write" className="mt-6">
          <AnimatePresence mode="wait">
            {!hasPatients ? (
              <motion.div
                key="empty-write"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                  <ClipboardList className="h-10 w-10 text-slate-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">No Patients Assigned</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    You have no active patient assignments for the current shift.
                    Nothing to hand over.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="write-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* ─── Patient Summaries ──────────────────────────── */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      Patient Summaries
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {data!.patients.length} patients
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data!.patients.map((patient, idx) => (
                      <motion.div
                        key={patient.admissionId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-lg border border-border p-4 space-y-3"
                      >
                        {/* Patient header row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-950/50 shrink-0">
                              <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {patient.patientName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {patient.patientAge}y, {patient.patientGender}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className="text-xs bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-400"
                            >
                              <BedDouble className="h-3 w-3 mr-1" />
                              {patient.bedNumber}
                            </Badge>
                            {patient.pendingMedCount > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400"
                              >
                                <Pill className="h-3 w-3 mr-1" />
                                {patient.pendingMedCount}
                              </Badge>
                            )}
                            {patient.pendingSampleCount > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-400"
                              >
                                <TestTube2 className="h-3 w-3 mr-1" />
                                {patient.pendingSampleCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Diagnosis */}
                        {patient.initialDiagnosis && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {patient.initialDiagnosis}
                          </p>
                        )}

                        {/* Latest vitals mini display */}
                        {patient.latestVital && (
                          <div className="grid grid-cols-4 gap-2">
                            <VitalMini label="Temp" value={`${patient.latestVital.temperature}°F`} />
                            <VitalMini label="Pulse" value={`${patient.latestVital.pulse} bpm`} />
                            <VitalMini
                              label="BP"
                              value={`${patient.latestVital.bpSystolic}/${patient.latestVital.bpDiastolic}`}
                            />
                            <VitalMini label="SpO2" value={`${patient.latestVital.spo2}%`} />
                          </div>
                        )}

                        {/* Summary textarea */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Shift Summary (vital trends, medicines given, incidents, doctor&apos;s instructions, pending items)
                          </Label>
                          <Textarea
                            placeholder={`Write shift summary for ${patient.patientName}...`}
                            value={patientSummaries[patient.admissionId] || ''}
                            onChange={(e) =>
                              setPatientSummaries((prev) => ({
                                ...prev,
                                [patient.admissionId]: e.target.value,
                              }))
                            }
                            className="min-h-[80px] resize-y text-sm"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* ─── Ward Notes ─────────────────────────────────── */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      Ward Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="General ward notes — equipment status, supplies, environment concerns, special instructions..."
                      value={wardNotes}
                      onChange={(e) => setWardNotes(e.target.value)}
                      className="min-h-[80px] resize-y text-sm"
                    />
                  </CardContent>
                </Card>

                {/* ─── Pending Tasks ──────────────────────────────── */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Pending Tasks
                        {pendingTasks.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {pendingTasks.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPendingTask}
                        className="gap-1.5 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Task
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence>
                      {pendingTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No pending tasks. Click &quot;Add Task&quot; to add items that need follow-up.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {pendingTasks.map((task, idx) => {
                            const config = priorityConfig[task.priority]
                            const Icon = config.icon
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-start gap-2 p-3 rounded-lg border border-border"
                              >
                                <Icon
                                  className={cn('h-4 w-4 mt-2.5 shrink-0', config.text)}
                                />
                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Describe the pending task..."
                                    value={task.task}
                                    onChange={(e) =>
                                      updatePendingTask(idx, 'task', e.target.value)
                                    }
                                    className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  />
                                  <Select
                                    value={task.priority}
                                    onValueChange={(v) =>
                                      updatePendingTask(idx, 'priority', v)
                                    }
                                  >
                            <SelectTrigger className="w-full sm:w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-red-500" />
                                  High
                                </span>
                              </SelectItem>
                              <SelectItem value="Medium">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  Medium
                                </span>
                              </SelectItem>
                              <SelectItem value="Low">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                                  Low
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePendingTask(idx)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* ─── Hand Over To + Submit ──────────────────────── */}
                <Card className="border-teal-200 dark:border-teal-900">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hand Over To</Label>
                      {(data?.nextShiftNurses || []).length === 0 ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                          <AlertTriangle className="h-4 w-4 inline mr-1.5" />
                          No nurses found for the next shift in your ward.
                        </p>
                      ) : (
                        <Select value={toNurseId} onValueChange={setToNurseId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the next shift nurse..." />
                          </SelectTrigger>
                          <SelectContent>
                            {data!.nextShiftNurses.map((nurse) => (
                              <SelectItem key={nurse.id} value={nurse.id}>
                                <span className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{nurse.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({nurse.employeeId})
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px] px-1.5 py-0',
                                      shiftBadgeConfig[nurse.shift]?.bg,
                                      shiftBadgeConfig[nurse.shift]?.text
                                    )}
                                  >
                                    {nurse.shift}
                                  </Badge>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <Button
                      onClick={() => submitMutation.mutate()}
                      disabled={isSubmitting || !toNurseId}
                      className="w-full sm:w-auto gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Shift Handover
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══════ TAB 3: Outgoing / Sent ═══════ */}
        <TabsContent value="outgoing" className="mt-6">
          <AnimatePresence mode="wait">
            {!hasOutgoing ? (
              <motion.div
                key="empty-outgoing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                  <Send className="h-10 w-10 text-slate-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">No Handovers Sent</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    You haven&apos;t submitted any shift handovers today.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="outgoing-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {data!.outgoingHandovers.map((handover, idx) => (
                  <OutgoingHandoverCard
                    key={handover.id}
                    handover={handover}
                    index={idx}
                    isExpanded={expandedCards.has(handover.id)}
                    onToggle={() => toggleCard(handover.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function VitalMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
      <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
      <p className="text-xs font-medium text-foreground leading-tight">{value}</p>
    </div>
  )
}

function IncomingHandoverCard({
  handover,
  index,
  isExpanded,
  onToggle,
  onAcknowledge,
  isAcknowledging,
}: {
  handover: HandoverData
  index: number
  isExpanded: boolean
  onToggle: () => void
  onAcknowledge: () => void
  isAcknowledging: boolean
}) {
  const isAcknowledged = !!handover.acknowledgedAt
  const shiftConfig = shiftBadgeConfig[handover.shiftType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={cn(
          'transition-all duration-200',
          isAcknowledged
            ? 'opacity-70'
            : !isAcknowledged
              ? 'border-teal-300 dark:border-teal-700 shadow-sm'
              : ''
        )}
      >
        {/* Card header */}
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-xl shrink-0',
                  isAcknowledged
                    ? 'bg-emerald-100 dark:bg-emerald-950/40'
                    : 'bg-teal-100 dark:bg-teal-950/50'
                )}
              >
                <ArrowRightLeft
                  className={cn(
                    'h-5 w-5',
                    isAcknowledged
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-teal-600 dark:text-teal-400'
                  )}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-foreground">
                    {handover.fromNurseName}
                  </h3>
                  <span className="text-muted-foreground text-xs">→</span>
                  <h3 className="font-semibold text-sm text-teal-600 dark:text-teal-400">
                    You
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      shiftConfig?.bg,
                      shiftConfig?.text
                    )}
                  >
                    {handover.shiftType} Shift
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {handover.wardName}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(handover.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              {isAcknowledged ? (
                <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Acknowledged
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={onAcknowledge}
                  disabled={isAcknowledging}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                >
                  {isAcknowledging ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Acknowledge
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expandable details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-4">
                {/* Patient Summaries */}
                {handover.patientSummaries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <User className="h-3.5 w-3.5 text-teal-500" />
                      Patient Summaries ({handover.patientSummaries.length})
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {handover.patientSummaries.map((ps, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <p className="text-sm font-medium text-foreground">
                            Patient #{i + 1}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {ps.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ward Notes */}
                {handover.wardNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
                      Ward Notes
                    </h4>
                    <div className="rounded-lg border border-border bg-amber-50/50 dark:bg-amber-950/20 p-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {handover.wardNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending Tasks */}
                {handover.pendingTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      Pending Tasks ({handover.pendingTasks.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {handover.pendingTasks.map((task, i) => {
                        const config = priorityConfig[task.priority]
                        const Icon = config.icon
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex items-start gap-2 rounded-lg border p-3',
                              config.bg,
                              config.border
                            )}
                          >
                            <Icon
                              className={cn('h-4 w-4 mt-0.5 shrink-0', config.text)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{task.task}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] shrink-0',
                                config.bg,
                                config.text,
                                config.border
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {handover.patientSummaries.length === 0 &&
                  !handover.wardNotes &&
                  handover.pendingTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No details provided in this handover.
                    </p>
                  )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

function OutgoingHandoverCard({
  handover,
  index,
  isExpanded,
  onToggle,
}: {
  handover: HandoverData
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const shiftConfig = shiftBadgeConfig[handover.shiftType]
  const isAckedByReceiver = !!handover.acknowledgedAt

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn('transition-all', isAckedByReceiver ? 'opacity-80' : '')}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/50 shrink-0">
                <Send className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-foreground">You</h3>
                  <span className="text-muted-foreground text-xs">→</span>
                  <h3 className="font-semibold text-sm text-teal-600 dark:text-teal-400">
                    {handover.toNurseName}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      shiftConfig?.bg,
                      shiftConfig?.text
                    )}
                  >
                    {handover.shiftType} Shift
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {handover.wardName}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(handover.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              {isAckedByReceiver ? (
                <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Received
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 gap-1">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-4">
                {handover.patientSummaries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <User className="h-3.5 w-3.5 text-teal-500" />
                      Patient Summaries ({handover.patientSummaries.length})
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {handover.patientSummaries.map((ps, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {ps.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {handover.wardNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
                      Ward Notes
                    </h4>
                    <div className="rounded-lg border border-border bg-amber-50/50 dark:bg-amber-950/20 p-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {handover.wardNotes}
                      </p>
                    </div>
                  </div>
                )}
                {handover.pendingTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      Pending Tasks ({handover.pendingTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {handover.pendingTasks.map((task, i) => {
                        const config = priorityConfig[task.priority]
                        const Icon = config.icon
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex items-start gap-2 rounded-lg border p-3',
                              config.bg,
                              config.border
                            )}
                          >
                            <Icon
                              className={cn('h-4 w-4 mt-0.5 shrink-0', config.text)}
                            />
                            <p className="flex-1 text-sm text-foreground">{task.task}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] shrink-0',
                                config.bg,
                                config.text,
                                config.border
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
