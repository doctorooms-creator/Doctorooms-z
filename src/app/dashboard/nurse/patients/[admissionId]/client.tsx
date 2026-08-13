'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { VITAL_THRESHOLDS, SAMPLE_TYPES } from '@/lib/ipd-utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Thermometer,
  Heart,
  Wind,
  Droplets,
  Activity,
  Pill,
  ClipboardList,
  History,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  BedDouble,
  Stethoscope,
  Building2,
  User,
  FileText,
  Loader2,
  Clock,
  TestTube,
  FlaskConical,
  Send,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import VitalTrendCharts from './vital-charts'

// ============ TYPES ============

interface Admission {
  id: string
  admissionNo: string
  admissionDate: string
  admissionTime: string
  status: string
  patientName: string
  patientAge: number
  patientGender: string
  bloodGroup: string
  mobileNo: string
  fatherName: string
  contactPersonName: string
  contactPersonMobile: string
  contactPersonRelation: string
  maritalStatus: string
  occupation: string
  address: string
  initialDiagnosis: string
  finalDiagnosis: string
  wardName: string
  wardType: string
  bedNumber: string
  bedType: string
  departmentName: string
  attendingDoctorName: string
  attendingDoctorMobile: string
  referringDoctorName: string
  hospitalName: string
  chiefComplaints: string
  informant: string
  pastHistory: string
  personalHistory: string
  habits: string
  femaleHistory: string
  drugHistory: string
  consciousnessLevel: string
  obeyingCommands: boolean
  respondingToDPS: boolean
  oriented: boolean
  speech: string
  examinationNotes: string
  generalSigns: string
}

interface VitalAlert {
  parameter: string
  level: string
  message: string
  value: number
}

interface VitalRecord {
  id: string
  temperature: number
  pulse: number
  spo2: number
  bpSystolic: number
  bpDiastolic: number
  respiratoryRate: number
  inputMl: number
  urineMl: number
  outputMl: number
  patientStatus: string
  ventilatorOn: boolean
  oxygenLiters: number
  infusionPump: string
  rbs: number | null
  remarks: string
  recordedAt: string
  recordedByName?: string
}

interface DoctorOrder {
  id: string
  drugName: string
  route: string
  dose: string
  frequency: string
  scheduledTime: string
  instructions: string
  isPrn: boolean
  isStat: boolean
  doctorName: string
  status: 'Given' | 'Pending' | 'Overdue' | 'Missed' | 'Refused' | 'Skipped' | 'NotAvailable'
  latestAdmin: {
    id: string
    status: string
    administeredTime: string | null
    remarks: string
  } | null
}

// ============ HELPERS ============

function isAbnormal(param: string, value: number): boolean {
  const T = VITAL_THRESHOLDS as Record<string, Record<string, number>>
  const t = T[param]
  if (!t) return false
  if (param === 'spo2') return value < t.warning
  if (param === 'bpSystolic') return value < (t.criticalLow ?? 999) || value > (t.warningHigh ?? 999)
  if (param === 'bpDiastolic') return value > (t.warningHigh ?? 999)
  if (param === 'pulse') return value < (t.criticalLow ?? 999) || value > (t.warningHigh ?? 999)
  if (param === 'temperature') return value > (t.warningHigh ?? 999)
  if (param === 'respiratoryRate') return value < (t.criticalLow ?? 999) || value > (t.criticalHigh ?? 999)
  return false
}

function getMedStatusBadge(status: string) {
  switch (status) {
    case 'Given':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Given</Badge>
    case 'Pending':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Pending</Badge>
    case 'Overdue':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Overdue</Badge>
    case 'Missed':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Missed</Badge>
    case 'Refused':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400">Refused</Badge>
    case 'Skipped':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400">Skipped</Badge>
    case 'NotAvailable':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Not Available</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getRouteBadge(route: string) {
  const colors: Record<string, string> = {
    Oral: 'border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400',
    IV: 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400',
    IM: 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400',
    SC: 'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400',
    Topical: 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400',
    Nebulization: 'border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400',
  }
  return (
    <Badge variant="outline" className={cn('text-[10px]', colors[route] || '')}>
      {route}
    </Badge>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null | boolean }) {
  if (value === undefined || value === null || value === '' || value === '0') return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  )
}

// ============ MAIN COMPONENT ============

interface Props {
  admissionId: string
}

export default function NursePatientDetailClient({ admissionId }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [administerTarget, setAdministerTarget] = useState<{ orderId: string; status: string } | null>(null)

  // Fetch patient detail
  const { data, isLoading } = useQuery({
    queryKey: ['nurse-patient', admissionId],
    queryFn: () => fetch(`/api/dashboard/nurse/patients/${admissionId}`).then((r) => r.json()),
  })

  const admission: Admission | null = data?.admission || null
  const latestVital: VitalRecord | null = data?.latestVital || null
  const vitalAlerts: VitalAlert[] = data?.vitalAlerts || []
  const doctorOrders: DoctorOrder[] = data?.doctorOrders || []
  const vitalRecords: VitalRecord[] = data?.vitalRecords || []
  const sampleCollections = data?.sampleCollections || []

  // Administer mutation
  const administerMutation = useMutation({
    mutationFn: async ({ orderId, status, remarks }: { orderId: string; status: string; remarks?: string }) => {
      const res = await fetch(`/api/dashboard/nurse/patients/${admissionId}/medicines/${orderId}/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurse-patient', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['nurse-patients'] })
      queryClient.invalidateQueries({ queryKey: ['nurse-stats'] })
      toast.success('Medicine status updated')
      setAdministerTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) return <DetailSkeleton />
  if (!admission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Admission not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/nurse')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/dashboard/nurse')}>
          <ArrowLeft className="mr-1 h-4 w-4" />Back
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{admission.patientName}</h1>
              <Badge variant="outline" className="border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                <BedDouble className="mr-1 h-3 w-3" />{admission.bedNumber}
              </Badge>
              <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                {admission.admissionNo}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{admission.patientAge}y</span>
              <span>•</span>
              <span>{admission.patientGender}</span>
              <span>•</span>
              <span>{admission.departmentName}</span>
              <span>•</span>
              <span>{admission.wardName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {admission.bloodGroup && (
              <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-400">
                🩸 {admission.bloodGroup}
              </Badge>
            )}
            <Badge
              className={cn(
                admission.status === 'Admitted' && 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
              )}
            >
              {admission.status}
            </Badge>
          </div>
        </div>

        {/* Critical alerts banner */}
        {vitalAlerts.length > 0 && (
          <div className={cn(
            'mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm',
            vitalAlerts.some((a) => a.level === 'critical')
              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
              : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
          )}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{vitalAlerts.some((a) => a.level === 'critical') ? 'Critical Alerts' : 'Vital Warnings'}</p>
              <ul className="mt-1 list-disc pl-4 text-xs">
                {vitalAlerts.map((a, i) => <li key={i}>{a.message}</li>)}
              </ul>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />Overview
          </TabsTrigger>
          <TabsTrigger value="vitals" className="gap-1.5 text-xs sm:text-sm">
            <Activity className="h-4 w-4" />Vitals
          </TabsTrigger>
          <TabsTrigger value="medicines" className="gap-1.5 text-xs sm:text-sm">
            <Pill className="h-4 w-4" />Medicines
          </TabsTrigger>
          <TabsTrigger value="investigations" className="gap-1.5 text-xs sm:text-sm">
            <TestTube className="h-4 w-4" />Investigations
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <History className="h-4 w-4" />History
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Patient Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-teal-500" />Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Age / Gender" value={`${admission.patientAge}y / ${admission.patientGender}`} />
                <InfoRow label="Blood Group" value={admission.bloodGroup} />
                <InfoRow label="Mobile" value={admission.mobileNo} />
                <InfoRow label="Father/Husband" value={admission.fatherName} />
                <InfoRow label="Contact Person" value={admission.contactPersonName} />
                {admission.contactPersonName && <InfoRow label="CP Mobile" value={admission.contactPersonMobile} />}
                {admission.contactPersonName && <InfoRow label="CP Relation" value={admission.contactPersonRelation} />}
                <InfoRow label="Marital Status" value={admission.maritalStatus} />
                <InfoRow label="Occupation" value={admission.occupation} />
                <InfoRow label="Address" value={admission.address} />
              </CardContent>
            </Card>

            {/* Admission Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-teal-500" />Admission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Admission No" value={admission.admissionNo} />
                <InfoRow label="Date" value={admission.admissionDate ? format(new Date(admission.admissionDate), 'dd MMM yyyy') : ''} />
                <InfoRow label="Time" value={admission.admissionTime} />
                <InfoRow label="Ward" value={`${admission.wardName} (${admission.wardType})`} />
                <InfoRow label="Bed" value={`${admission.bedNumber} — ${admission.bedType}`} />
                <InfoRow label="Department" value={admission.departmentName} />
                <InfoRow label="Attending Doctor" value={admission.attendingDoctorName} />
                <InfoRow label="Referring Doctor" value={admission.referringDoctorName} />
                <InfoRow label="Initial Diagnosis" value={admission.initialDiagnosis} />
                <InfoRow label="Final Diagnosis" value={admission.finalDiagnosis} />
              </CardContent>
            </Card>
          </div>

          {/* Latest Vitals Display */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-teal-500" />Latest Vitals</CardTitle>
                {latestVital && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(latestVital.recordedAt), 'dd MMM yyyy, HH:mm')}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {latestVital ? (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                  {[
                    { label: 'Temp', value: latestVital.temperature, unit: '°F', param: 'temperature', icon: Thermometer },
                    { label: 'Pulse', value: latestVital.pulse, unit: 'bpm', param: 'pulse', icon: Heart },
                    { label: 'SpO2', value: latestVital.spo2, unit: '%', param: 'spo2', icon: Wind },
                    { label: 'BP', value: `${latestVital.bpSystolic}/${latestVital.bpDiastolic}`, unit: 'mmHg', param: 'bpSystolic', raw: latestVital.bpSystolic, icon: Droplets },
                    { label: 'RR', value: latestVital.respiratoryRate, unit: '/min', param: 'respiratoryRate', icon: Activity },
                  ].map((v) => (
                    <div key={v.label} className="text-center">
                      <v.icon className={cn('mx-auto mb-1 h-5 w-5', isAbnormal(v.param, v.raw ?? v.value) ? 'text-red-500' : 'text-teal-500')} />
                      <p className="text-[10px] text-muted-foreground">{v.label}</p>
                      <p className={cn('text-sm font-bold', isAbnormal(v.param, v.raw ?? v.value) ? 'text-red-600 dark:text-red-400' : '')}>
                        {v.value} <span className="font-normal text-muted-foreground">{v.unit}</span>
                      </p>
                    </div>
                  ))}
                  <div className="col-span-full flex flex-wrap gap-3 border-t pt-3 text-xs text-muted-foreground">
                    <span>Status: <strong className={latestVital.patientStatus !== 'Conscious' ? 'text-amber-600 dark:text-amber-400' : ''}>{latestVital.patientStatus}</strong></span>
                    {latestVital.ventilatorOn && <Badge variant="outline" className="border-red-300 text-red-700">Ventilator ON</Badge>}
                    {latestVital.oxygenLiters > 0 && <span>O₂: {latestVital.oxygenLiters}L</span>}
                    {latestVital.rbs && <span>RBS: {latestVital.rbs}</span>}
                    <span>I: {latestVital.inputMl}ml</span>
                    <span>U: {latestVital.urineMl}ml</span>
                    <span>O: {latestVital.outputMl}ml</span>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No vitals recorded yet</p>
              )}
            </CardContent>
          </Card>

          {/* Orders Summary + Pending Samples */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-teal-500" />Active Orders ({doctorOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {doctorOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active doctor orders</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {doctorOrders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{order.drugName}</p>
                          <p className="text-xs text-muted-foreground">{order.dose} • {order.route} • {order.frequency} • {order.scheduledTime}</p>
                        </div>
                        {getMedStatusBadge(order.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4 text-teal-500" />Sample Collections ({sampleCollections.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sampleCollections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sample collections</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {sampleCollections.map((s: { id: string; testName: string; sampleType: string; status: string; createdAt: string }) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-2.5">
                        <div>
                          <p className="text-sm font-medium">{s.testName}</p>
                          <p className="text-xs text-muted-foreground">{s.sampleType} • {format(new Date(s.createdAt), 'dd MMM, HH:mm')}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          s.status === 'Ordered' && 'border-amber-300 text-amber-700',
                          s.status === 'Collected' && 'border-teal-300 text-teal-700',
                          s.status === 'SentToLab' && 'border-sky-300 text-sky-700',
                          s.status === 'Reported' && 'border-emerald-300 text-emerald-700'
                        )}>
                          {s.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VITALS TAB */}
        <TabsContent value="vitals" className="space-y-4">
          <VitalForm admissionId={admissionId} />
          <VitalTrendCharts vitals={vitalRecords} />
          <VitalsHistoryTable vitalRecords={vitalRecords} />
        </TabsContent>

        {/* MEDICINES TAB */}
        <TabsContent value="medicines" className="space-y-4">
          <MedicinesTab
            admissionId={admissionId}
            orders={doctorOrders}
            onAdminister={(orderId, status) => setAdministerTarget({ orderId, status })}
          />
        </TabsContent>

        {/* INVESTIGATIONS TAB */}
        <TabsContent value="investigations" className="space-y-4">
          <InvestigationsTab admissionId={admissionId} />
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-teal-500" />History Sheet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Chief Complaints</h4>
                  <p className="whitespace-pre-wrap text-sm">{admission.chiefComplaints || 'Not recorded'}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Past History</h4>
                  <p className="whitespace-pre-wrap text-sm">{admission.pastHistory || 'Not recorded'}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Personal History</h4>
                  <p className="whitespace-pre-wrap text-sm">
                    {admission.personalHistory && admission.personalHistory !== '{}' ? (typeof admission.personalHistory === 'string' ? admission.personalHistory : 'Recorded (see doctor view)') : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Drug History</h4>
                  <p className="whitespace-pre-wrap text-sm">{admission.drugHistory || 'Not recorded'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4 text-teal-500" />Physical Examination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="Consciousness" value={admission.consciousnessLevel} />
                  <InfoRow label="Obeys Commands" value={admission.obeyingCommands ? 'Yes' : 'No'} />
                  <InfoRow label="Responds to DPS" value={admission.respondingToDPS ? 'Yes' : 'No'} />
                  <InfoRow label="Oriented" value={admission.oriented ? 'Yes' : 'No'} />
                  <InfoRow label="Speech" value={admission.speech} />
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Examination Notes</h4>
                  <p className="whitespace-pre-wrap text-sm">{admission.examinationNotes || 'Not recorded'}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">General Signs</h4>
                  <p className="whitespace-pre-wrap text-sm">
                    {admission.generalSigns && admission.generalSigns !== '{}' ? (typeof admission.generalSigns === 'string' ? admission.generalSigns : 'Recorded (see doctor view)') : 'Not recorded'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Administer Confirm Dialog */}
      <AlertDialog open={!!administerTarget} onOpenChange={(open) => !open && setAdministerTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {administerTarget?.status === 'Given' ? 'Confirm Medicine Given' : `Mark as ${administerTarget?.status}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {administerTarget?.status === 'Given'
                ? 'Confirm that this medicine has been administered to the patient.'
                : `Are you sure you want to mark this medicine as ${administerTarget?.status}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (administerTarget) {
                  administerMutation.mutate({ orderId: administerTarget.orderId, status: administerTarget.status })
                }
              }}
              disabled={administerMutation.isPending}
            >
              {administerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============ VITAL FORM SUB-COMPONENT ============

function VitalForm({ admissionId }: { admissionId: string }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    temperature: '',
    pulse: '',
    spo2: '',
    bpSystolic: '',
    bpDiastolic: '',
    respiratoryRate: '',
    patientStatus: 'Conscious',
    ventilatorOn: false,
    oxygenLiters: '',
    inputMl: '',
    urineMl: '',
    outputMl: '',
    infusionPump: '',
    rbs: '',
    remarks: '',
  })

  const update = useCallback((key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/nurse/patients/${admissionId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save vitals')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nurse-patient', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['nurse-patients'] })
      queryClient.invalidateQueries({ queryKey: ['nurse-stats'] })
      toast.success('Vitals recorded successfully')
      if (data.criticalCount > 0) {
        toast.error(`⚠️ ${data.criticalCount} critical alert(s) sent to doctor!`)
      }
      // Reset form
      setForm({
        temperature: '', pulse: '', spo2: '', bpSystolic: '', bpDiastolic: '',
        respiratoryRate: '', patientStatus: 'Conscious', ventilatorOn: false,
        oxygenLiters: '', inputMl: '', urineMl: '', outputMl: '',
        infusionPump: '', rbs: '', remarks: '',
      })
    },
    onError: () => toast.error('Failed to record vitals'),
  })

  const inputCls = 'h-9'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-teal-500" />Record New Vitals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Temp, Pulse, SpO2, RR */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Temperature (°F)</Label>
            <Input className={inputCls} type="number" step="0.1" placeholder="98.6" value={form.temperature} onChange={(e) => update('temperature', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Pulse (bpm)</Label>
            <Input className={inputCls} type="number" placeholder="72" value={form.pulse} onChange={(e) => update('pulse', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SpO2 (%)</Label>
            <Input className={inputCls} type="number" step="0.1" placeholder="98" value={form.spo2} onChange={(e) => update('spo2', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Resp. Rate (/min)</Label>
            <Input className={inputCls} type="number" placeholder="18" value={form.respiratoryRate} onChange={(e) => update('respiratoryRate', e.target.value)} />
          </div>
        </div>

        {/* Row 2: BP */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">BP Systolic</Label>
            <Input className={inputCls} type="number" placeholder="120" value={form.bpSystolic} onChange={(e) => update('bpSystolic', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">BP Diastolic</Label>
            <Input className={inputCls} type="number" placeholder="80" value={form.bpDiastolic} onChange={(e) => update('bpDiastolic', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Patient Status</Label>
            <Select value={form.patientStatus} onValueChange={(v) => update('patientStatus', v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Conscious">Conscious</SelectItem>
                <SelectItem value="Semiconscious">Semiconscious</SelectItem>
                <SelectItem value="Unconscious">Unconscious</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2 pb-1">
              <Switch checked={form.ventilatorOn} onCheckedChange={(v) => update('ventilatorOn', v)} />
              <Label className="text-xs">Ventilator</Label>
            </div>
          </div>
        </div>

        {/* Row 3: O2, Input, Urine, Output */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">O₂ Liters</Label>
            <Input className={inputCls} type="number" step="0.5" placeholder="0" value={form.oxygenLiters} onChange={(e) => update('oxygenLiters', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Input (ml)</Label>
            <Input className={inputCls} type="number" placeholder="0" value={form.inputMl} onChange={(e) => update('inputMl', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Urine (ml)</Label>
            <Input className={inputCls} type="number" placeholder="0" value={form.urineMl} onChange={(e) => update('urineMl', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Output (ml)</Label>
            <Input className={inputCls} type="number" placeholder="0" value={form.outputMl} onChange={(e) => update('outputMl', e.target.value)} />
          </div>
        </div>

        {/* Row 4: Infusion Pump, RBS, Remarks */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Infusion Pump</Label>
            <Input className={inputCls} placeholder="Details..." value={form.infusionPump} onChange={(e) => update('infusionPump', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">RBS (optional)</Label>
            <Input className={inputCls} type="number" step="1" placeholder="mg/dL" value={form.rbs} onChange={(e) => update('rbs', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Remarks</Label>
            <Input className={inputCls} placeholder="Any notes..." value={form.remarks} onChange={(e) => update('remarks', e.target.value)} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Vitals
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ VITALS HISTORY TABLE ============

function VitalsHistoryTable({ vitalRecords }: { vitalRecords: VitalRecord[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-teal-500" />Vitals History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Temp</TableHead>
                <TableHead className="text-xs">Pulse</TableHead>
                <TableHead className="text-xs">SpO2</TableHead>
                <TableHead className="text-xs">BP</TableHead>
                <TableHead className="text-xs">RR</TableHead>
                <TableHead className="text-xs">I/O</TableHead>
                <TableHead className="text-xs">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vitalRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No vitals recorded yet</TableCell>
                </TableRow>
              )}
              {vitalRecords.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(v.recordedAt), 'dd MMM HH:mm')}
                  </TableCell>
                  <TableCell className={cn('text-xs font-medium', v.temperature > 0 && isAbnormal('temperature', v.temperature) ? 'text-red-600 dark:text-red-400' : '')}>
                    {v.temperature > 0 ? `${v.temperature}°F` : '—'}
                  </TableCell>
                  <TableCell className={cn('text-xs font-medium', v.pulse > 0 && isAbnormal('pulse', v.pulse) ? 'text-red-600 dark:text-red-400' : '')}>
                    {v.pulse > 0 ? v.pulse : '—'}
                  </TableCell>
                  <TableCell className={cn('text-xs font-medium', v.spo2 > 0 && isAbnormal('spo2', v.spo2) ? 'text-red-600 dark:text-red-400' : '')}>
                    {v.spo2 > 0 ? `${v.spo2}%` : '—'}
                  </TableCell>
                  <TableCell className={cn('text-xs font-medium', v.bpSystolic > 0 && isAbnormal('bpSystolic', v.bpSystolic) ? 'text-red-600 dark:text-red-400' : '')}>
                    {v.bpSystolic > 0 ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}
                  </TableCell>
                  <TableCell className={cn('text-xs font-medium', v.respiratoryRate > 0 && isAbnormal('respiratoryRate', v.respiratoryRate) ? 'text-red-600 dark:text-red-400' : '')}>
                    {v.respiratoryRate > 0 ? v.respiratoryRate : '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.inputMl > 0 || v.urineMl > 0 ? (
                      <span>I:{v.inputMl} U:{v.urineMl}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">{v.remarks || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============ MEDICINES TAB ============

function MedicinesTab({
  admissionId,
  orders,
  onAdminister,
}: {
  admissionId: string
  orders: DoctorOrder[]
  onAdminister: (orderId: string, status: string) => void
}) {
  const { data: medData } = useQuery({
    queryKey: ['nurse-medicines', admissionId],
    queryFn: () => fetch(`/api/dashboard/nurse/patients/${admissionId}/medicines`).then((r) => r.json()),
  })

  const groupedOrders = medData?.grouped || {}
  const timeSlots = Object.keys(groupedOrders).sort()

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <Pill className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No active medicine orders for this patient</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {timeSlots.map((time) => (
        <Card key={time}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-teal-500" />
              Scheduled: {time}
              <Badge variant="secondary" className="text-[10px]">
                {groupedOrders[time].length} order(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedOrders[time].map((order: DoctorOrder) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{order.drugName}</p>
                    {order.isStat && <Badge className="bg-red-100 text-red-700 text-[10px]">STAT</Badge>}
                    {order.isPrn && <Badge variant="outline" className="text-[10px]">PRN</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {getRouteBadge(order.route)}
                    <span>{order.dose}</span>
                    <span>•</span>
                    <span>{order.frequency}</span>
                    {order.instructions && (
                      <>
                        <span>•</span>
                        <span className="italic">{order.instructions}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">by {order.doctorName}</p>
                </div>

                <div className="flex items-center gap-2">
                  {getMedStatusBadge(order.status)}
                  {(order.status === 'Pending' || order.status === 'Overdue') && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-7 bg-emerald-600 text-xs hover:bg-emerald-700"
                        onClick={() => onAdminister(order.id, 'Given')}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Mark Given
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAdminister(order.id, 'Missed')}>Missed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAdminister(order.id, 'Refused')}>Refused</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAdminister(order.id, 'Skipped')}>Skipped</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAdminister(order.id, 'NotAvailable')}>Not Available</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============ INVESTIGATIONS TAB ============

interface InvestigationSample {
  id: string
  testName: string
  sampleType: string
  status: string
  collectedAt: string | null
  sentToLabAt: string | null
  remarks: string
  createdAt: string
  doctorName: string
  nurseName: string
  report: {
    id: string
    testName: string
    reportDate: string
    resultData: string
    normalRange: string
    isAbnormal: boolean
    remarks: string
  } | null
}

function getSampleStatusBadge(status: string) {
  switch (status) {
    case 'Ordered':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Ordered</Badge>
    case 'Collected':
      return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">Collected</Badge>
    case 'SentToLab':
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400">Sent to Lab</Badge>
    case 'Reported':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Reported</Badge>
    case 'Filed':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400">Filed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function parseResultSummary(resultData: string): string {
  try {
    const data = JSON.parse(resultData)
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    }
    return String(data)
  } catch {
    return resultData || 'No data'
  }
}

function InvestigationsTab({ admissionId }: { admissionId: string }) {
  const queryClient = useQueryClient()
  const [showCollectDialog, setShowCollectDialog] = useState(false)
  const [collectForm, setCollectForm] = useState({ testName: '', sampleType: SAMPLE_TYPES[0] as string, remarks: '' })

  // Fetch investigations
  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['nurse-investigations', admissionId],
    queryFn: () => fetch(`/api/dashboard/nurse/patients/${admissionId}/investigations`).then((r) => r.json()),
  })

  const samples: InvestigationSample[] = invData?.samples || []

  // POST: Collect sample
  const collectMutation = useMutation({
    mutationFn: async (data: { testName: string; sampleType: string; remarks?: string }) => {
      const res = await fetch(`/api/dashboard/nurse/patients/${admissionId}/investigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to collect sample')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurse-investigations', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['nurse-patient', admissionId] })
      toast.success('Sample collected successfully')
      setShowCollectDialog(false)
      setCollectForm({ testName: '', sampleType: SAMPLE_TYPES[0] as string, remarks: '' })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // PATCH: Update sample status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ sampleId, status, remarks }: { sampleId: string; status: string; remarks?: string }) => {
      const res = await fetch(`/api/dashboard/nurse/patients/${admissionId}/investigations/${sampleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to update status')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurse-investigations', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['nurse-patient', admissionId] })
      toast.success('Sample status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Categorize samples
  const pendingSamples = samples.filter((s) => s.status === 'Ordered' || s.status === 'Collected')
  const inProgressSamples = samples.filter((s) => s.status === 'SentToLab')
  const reportedSamples = samples.filter((s) => s.status === 'Reported' || s.status === 'Filed')

  if (invLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-teal-500" />
          <h3 className="text-base font-semibold">Investigations & Sample Collection</h3>
          {pendingSamples.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
              {pendingSamples.length} pending
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setShowCollectDialog(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Collect Sample
        </Button>
      </div>

      {/* Pending Samples */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Samples ({pendingSamples.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSamples.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No pending samples</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {pendingSamples.map((sample, idx) => (
                <motion.div
                  key={sample.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TestTube className={cn('h-4 w-4 shrink-0', sample.sampleType === 'Blood' ? 'text-red-500' : 'text-teal-500')} />
                      <p className="truncate text-sm font-semibold">{sample.testName}</p>
                      {getSampleStatusBadge(sample.status)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{sample.sampleType}</Badge>
                      <span>Ordered by {sample.doctorName}</span>
                      {sample.createdAt && <span>• {format(new Date(sample.createdAt), 'dd MMM, HH:mm')}</span>}
                    </div>
                    {sample.remarks && <p className="mt-1 text-xs text-muted-foreground italic">{sample.remarks}</p>}
                  </div>
                  <div className="flex gap-2">
                    {sample.status === 'Ordered' && (
                      <Button
                        size="sm"
                        className="h-7 bg-teal-600 text-xs hover:bg-teal-700"
                        disabled={collectMutation.isPending}
                        onClick={() => {
                          collectMutation.mutate({
                            testName: sample.testName,
                            sampleType: sample.sampleType,
                          })
                        }}
                      >
                        {collectMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                        Collect
                      </Button>
                    )}
                    {sample.status === 'Collected' && (
                      <Button
                        size="sm"
                        className="h-7 bg-sky-600 text-xs hover:bg-sky-700"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => {
                          updateStatusMutation.mutate({
                            sampleId: sample.id,
                            status: 'SentToLab',
                          })
                        }}
                      >
                        {updateStatusMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                        Send to Lab
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Progress (Sent to Lab) */}
      {inProgressSamples.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-sky-500" />
              In Progress — Awaiting Report ({inProgressSamples.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {inProgressSamples.map((sample, idx) => (
                <motion.div
                  key={sample.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-sky-500" />
                      <p className="truncate text-sm font-medium">{sample.testName}</p>
                      {getSampleStatusBadge(sample.status)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{sample.sampleType}</Badge>
                      <span>Collected by {sample.nurseName}</span>
                      {sample.sentToLabAt && <span>• Sent {format(new Date(sample.sentToLabAt), 'dd MMM, HH:mm')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Awaiting lab</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Ready */}
      {reportedSamples.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Reports Ready ({reportedSamples.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {reportedSamples.map((sample, idx) => (
                <motion.div
                  key={sample.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'rounded-lg border p-3',
                    sample.report?.isAbnormal && 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                  )}
                >
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-emerald-500" />
                        <p className="truncate text-sm font-semibold">{sample.testName}</p>
                        {getSampleStatusBadge(sample.status)}
                        {sample.report?.isAbnormal && (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Abnormal
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {sample.sampleType}
                        {sample.report?.reportDate && (
                          <span> • Reported {format(new Date(sample.report.reportDate), 'dd MMM yyyy, HH:mm')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {sample.report && (
                    <div className="mt-2 rounded-md bg-background p-2 text-xs">
                      <p className="font-medium">Result:</p>
                      <p className={cn('mt-0.5', sample.report.isAbnormal ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
                        {parseResultSummary(sample.report.resultData)}
                      </p>
                      {sample.report.remarks && (
                        <p className="mt-1 text-muted-foreground italic">{sample.report.remarks}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All History Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-teal-500" />
            All Investigation History ({samples.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Test Name</TableHead>
                  <TableHead className="text-xs">Sample</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Doctor</TableHead>
                  <TableHead className="text-xs">Collected</TableHead>
                  <TableHead className="text-xs">Sent</TableHead>
                  <TableHead className="text-xs">Abnormal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No investigations recorded yet
                    </TableCell>
                  </TableRow>
                )}
                {samples.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-medium">{s.testName}</TableCell>
                    <TableCell className="text-xs">{s.sampleType}</TableCell>
                    <TableCell>{getSampleStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.doctorName}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {s.collectedAt ? format(new Date(s.collectedAt), 'dd MMM, HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {s.sentToLabAt ? format(new Date(s.sentToLabAt), 'dd MMM, HH:mm') : '—'}
                    </TableCell>
                    <TableCell>
                      {s.report?.isAbnormal ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px] dark:bg-red-950/50 dark:text-red-400">
                          <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                          Yes
                        </Badge>
                      ) : s.report ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-950/50 dark:text-emerald-400">
                          Normal
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Collect Sample Dialog */}
      <Dialog open={showCollectDialog} onOpenChange={setShowCollectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-teal-500" />
              Collect New Sample
            </DialogTitle>
            <DialogDescription>
              Record a new sample collection for this patient. The sample will be marked as collected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Test Name *</Label>
              <Input
                placeholder="e.g. Complete Blood Count"
                value={collectForm.testName}
                onChange={(e) => setCollectForm((p) => ({ ...p, testName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sample Type *</Label>
              <Select
                value={collectForm.sampleType}
                onValueChange={(v) => setCollectForm((p) => ({ ...p, sampleType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Textarea
                placeholder="Any notes about the collection..."
                value={collectForm.remarks}
                onChange={(e) => setCollectForm((p) => ({ ...p, remarks: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCollectDialog(false)}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!collectForm.testName || !collectForm.sampleType || collectMutation.isPending}
              onClick={() => {
                collectMutation.mutate({
                  testName: collectForm.testName,
                  sampleType: collectForm.sampleType,
                  remarks: collectForm.remarks || undefined,
                })
              }}
            >
              {collectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Collect Sample
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ SKELETON ============

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
