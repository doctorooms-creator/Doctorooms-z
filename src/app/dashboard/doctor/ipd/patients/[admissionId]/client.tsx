'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { VITAL_THRESHOLDS, FREQUENCY_OPTIONS, MEDICINE_ROUTES, SAMPLE_TYPES } from '@/lib/ipd-utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  BedDouble,
  Stethoscope,
  User,
  FileText,
  Loader2,
  Clock,
  Plus,
  Square,
  Eye,
  FlaskConical,
  RefreshCw,
  Save,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowDown,
  ArrowUp,
  LogOut,
  CalendarDays,
  Shield,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

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
  dischargeDate: string | null
  dischargeType: string
  mlcCase: boolean
  previousHospitalization: string
  mediClaimDetails: string
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
  status: string
  createdAt: string
  doctorName?: string
  stoppedReason?: string
}

interface MedicineAdmin {
  id: string
  status: string
  scheduledTime: string
  administeredTime: string | null
  remarks: string
  drugName: string
  dose: string
  route: string
  nurseName: string
}

interface SampleCollection {
  id: string
  testName: string
  sampleType: string
  status: string
  collectedAt: string | null
  sentToLabAt: string | null
  createdAt: string
}

interface InvestigationReport {
  id: string
  testName: string
  reportDate: string
  isAbnormal: boolean
  reviewedBy: string | null
  reviewedAt: string | null
  remarks: string
}

interface DoctorVisit {
  id: string
  visitDate: string
  visitTime: string
  examinationFindings: string
  currentDiagnosis: string
  advise: string
  isMobileVisit: boolean
  doctorName: string
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

function getAdminStatusBadge(status: string) {
  switch (status) {
    case 'Given': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Given</Badge>
    case 'Pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Pending</Badge>
    case 'Overdue': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Overdue</Badge>
    case 'Missed': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Missed</Badge>
    case 'Refused': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400">Refused</Badge>
    case 'Skipped': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-950/50 dark:text-slate-400">Skipped</Badge>
    case 'NotAvailable': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Not Avail</Badge>
    default: return <Badge variant="secondary">{status}</Badge>
  }
}

function getSampleStatusBadge(status: string) {
  switch (status) {
    case 'Ordered': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Ordered</Badge>
    case 'Collected': return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">Collected</Badge>
    case 'SentToLab': return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400">Sent to Lab</Badge>
    case 'Reported': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Reported</Badge>
    case 'Filed': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-950/50 dark:text-slate-400">Filed</Badge>
    default: return <Badge variant="secondary">{status}</Badge>
  }
}

function getRouteColor(route: string) {
  const colors: Record<string, string> = {
    Oral: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    IV: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    IM: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    SC: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
    Topical: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    PR: 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400',
    Nebulization: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
    Inhalation: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
  }
  return colors[route] || 'bg-slate-100 text-slate-700'
}

const SCHEDULED_TIMES = [
  '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM',
  '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM', '12AM',
]

// ============ SCHEDULED TIME OPTIONS FOR SELECT ============
const scheduledTimeOptions = SCHEDULED_TIMES.map(t => ({ value: t, label: t }))

function TrendArrow({ current, previous, param }: { current: number; previous: number; param: string }) {
  if (!previous || previous === 0) return null
  const diff = current - previous
  if (Math.abs(diff) === 0) return null
  // For SpO2: up is good, down is bad
  // For BP systolic/pulse/temp: up or down can be bad depending on thresholds
  const isWorse = (param === 'spo2' && diff < 0) || (param === 'spo2' && diff > 0) === false
  const isWorseActual = (param === 'spo2' && diff < 0) || (param !== 'spo2' && Math.abs(diff) > 0)
  return (
    <span className={cn('text-xs', isWorseActual && isAbnormal(param, current) ? 'text-red-500' : 'text-muted-foreground')}>
      {diff > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
    </span>
  )
}

// ============ COMPONENT ============

interface Props {
  admissionId: string
}

export default function DoctorIpdPatientClient({ admissionId: admissionIdProp }: Props) {
  const params = useParams()
  const admissionId = admissionIdProp || (params.admissionId as string)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('overview')
  const [showAddOrderDialog, setShowAddOrderDialog] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [stopOrderId, setStopOrderId] = useState('')
  const [stopReason, setStopReason] = useState('')
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false)
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [showDischargeDialog, setShowDischargeDialog] = useState(false)

  // Discharge form state
  const [dischargeForm, setDischargeForm] = useState({
    dischargeType: 'Normal' as 'Normal' | 'DAMA' | 'LAMA' | 'Expired',
    finalDiagnosis: '',
    dischargeSummary: '',
    roomRentDays: 0,
  })

  // Order form state
  const [orderForm, setOrderForm] = useState({ drugName: '', route: 'Oral', dose: '', frequency: 'OD', scheduledTime: '8AM', instructions: '', isPrn: false, isStat: false })

  // Investigation form state
  const [invForm, setInvForm] = useState({ testName: '', sampleType: 'Blood' })

  // Visit form state
  const [visitForm, setVisitForm] = useState({ examinationFindings: '', currentDiagnosis: '', advise: '' })

  // History form state
  const [historyForm, setHistoryForm] = useState({ chiefComplaints: '', informant: '', pastHistory: '', personalHistory: { Diabetes: false, Hypertension: false, Asthma: false, Thyroid: false }, habits: { Alcohol: false, Smoking: false, Tobacco: false, allergy: '' }, femaleHistory: { lmp: '', gravida: 0, para: 0, living: 0, abortion: 0 }, drugHistory: '' })

  // Examination form state
  const [examForm, setExamForm] = useState({ consciousnessLevel: 'Conscious', obeyingCommands: true, respondingToDPS: true, oriented: true, speech: 'Normal', examinationNotes: '', generalSigns: { Pallor: false, Clubbing: false, Icterus: false, Cyanosis: false, Lymphadenopathy: false } })

  // Fetch patient detail
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-ipd-patient', admissionId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json() as Promise<{
        admission: Admission
        latestVital: VitalRecord | null
        vitalAlerts: VitalAlert[]
        vitalRecords: VitalRecord[]
        doctorOrders: DoctorOrder[]
        medicineAdministrations: MedicineAdmin[]
        sampleCollections: SampleCollection[]
        investigationReports: InvestigationReport[]
        doctorVisits: DoctorVisit[]
      }>
    },
    refetchInterval: 30000,
  })

  // Fetch all orders (including stopped)
  const { data: allOrdersData } = useQuery({
    queryKey: ['doctor-ipd-orders-all', admissionId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/orders`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json() as Promise<{ orders: DoctorOrder[] }>
    },
    enabled: activeTab === 'orders',
  })

  const admission = data?.admission
  const latestVital = data?.latestVital
  const vitalAlerts = data?.vitalAlerts || []
  const vitalRecords = data?.vitalRecords || []
  const activeOrders = data?.doctorOrders || []
  const medAdmins = data?.medicineAdministrations || []
  const sampleCollections = data?.sampleCollections || []
  const invReports = data?.investigationReports || []
  const doctorVisits = data?.doctorVisits || []
  const allOrders = allOrdersData?.orders || []

  // Populate history form on data load
  useEffect(() => {
    if (admission) {
      setHistoryForm({
        chiefComplaints: admission.chiefComplaints || '',
        informant: admission.informant || '',
        pastHistory: admission.pastHistory || '',
        personalHistory: admission.personalHistory ? JSON.parse(admission.personalHistory) : { Diabetes: false, Hypertension: false, Asthma: false, Thyroid: false },
        habits: admission.habits ? JSON.parse(admission.habits) : { Alcohol: false, Smoking: false, Tobacco: false, allergy: '' },
        femaleHistory: admission.femaleHistory ? JSON.parse(admission.femaleHistory) : { lmp: '', gravida: 0, para: 0, living: 0, abortion: 0 },
        drugHistory: admission.drugHistory || '',
      })
      setExamForm({
        consciousnessLevel: admission.consciousnessLevel || 'Conscious',
        obeyingCommands: admission.obeyingCommands,
        respondingToDPS: admission.respondingToDPS,
        oriented: admission.oriented,
        speech: admission.speech || 'Normal',
        examinationNotes: admission.examinationNotes || '',
        generalSigns: admission.generalSigns ? JSON.parse(admission.generalSigns) : { Pallor: false, Clubbing: false, Icterus: false, Cyanosis: false, Lymphadenopathy: false },
      })
    }
  }, [admission])

  // Mutations
  const addOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Order added successfully')
      setShowAddOrderDialog(false)
      setOrderForm({ drugName: '', route: 'Oral', dose: '', frequency: 'OD', scheduledTime: '8AM', instructions: '', isPrn: false, isStat: false })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-orders-all', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patients'] })
    },
    onError: (e) => toast.error(e.message),
  })

  const stopOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/orders/${stopOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', reason: stopReason }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Order stopped')
      setShowStopDialog(false)
      setStopReason('')
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-orders-all', admissionId] })
    },
    onError: (e) => toast.error(e.message),
  })

  const saveHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaints: historyForm.chiefComplaints,
          informant: historyForm.informant,
          pastHistory: historyForm.pastHistory,
          personalHistory: JSON.stringify(historyForm.personalHistory),
          habits: JSON.stringify(historyForm.habits),
          femaleHistory: JSON.stringify(historyForm.femaleHistory),
          drugHistory: historyForm.drugHistory,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
    },
    onSuccess: () => {
      toast.success('History saved')
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
    },
    onError: () => toast.error('Failed to save history'),
  })

  const saveExamMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/examination`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consciousnessLevel: examForm.consciousnessLevel,
          obeyingCommands: examForm.obeyingCommands,
          respondingToDPS: examForm.respondingToDPS,
          oriented: examForm.oriented,
          speech: examForm.speech,
          examinationNotes: examForm.examinationNotes,
          generalSigns: JSON.stringify(examForm.generalSigns),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
    },
    onSuccess: () => {
      toast.success('Examination saved')
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
    },
    onError: () => toast.error('Failed to save examination'),
  })

  const orderInvestigationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/investigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invForm),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Investigation ordered')
      setShowInvestigationDialog(false)
      setInvForm({ testName: '', sampleType: 'Blood' })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
    },
    onError: (e) => toast.error(e.message),
  })

  const addVisitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitForm),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Visit note added')
      setShowVisitDialog(false)
      setVisitForm({ examinationFindings: '', currentDiagnosis: '', advise: '' })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
    },
    onError: (e) => toast.error(e.message),
  })

  const dischargeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/doctor/ipd/patients/${admissionId}/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dischargeForm),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to discharge') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Patient discharged successfully')
      setShowDischargeDialog(false)
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patient', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['doctor-ipd-patients'] })
      router.push('/dashboard/doctor/ipd')
    },
    onError: (e) => toast.error(e.message),
  })

  // Calculate room rent days from admission date
  const calculatedRoomDays = admission
    ? Math.max(1, Math.ceil((Date.now() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!admission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-medium">Patient not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/doctor/ipd')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to IPD Patients
        </Button>
      </div>
    )
  }

  const pendingMeds = medAdmins.filter(m => m.status === 'Pending').length

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/doctor/ipd')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold truncate md:text-xl">{admission.patientName}</h1>
            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400 font-mono text-xs">
              {admission.admissionNo}
            </Badge>
            {admission.status === 'Admitted' ? (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Admitted</Badge>
            ) : admission.status === 'Discharged' ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Discharged</Badge>
            ) : admission.status === 'DAMA' ? (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400">DAMA</Badge>
            ) : admission.status === 'Expired' ? (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Expired</Badge>
            ) : (
              <Badge variant="secondary">{admission.status}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {admission.patientAge}y / {admission.patientGender} · {admission.wardName} — Bed {admission.bedNumber} · {admission.departmentName}
          </p>
        </div>
        {admission.status === 'Admitted' && (
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 shrink-0"
            onClick={() => {
              setDischargeForm({
                dischargeType: 'Normal',
                finalDiagnosis: admission.initialDiagnosis || '',
                dischargeSummary: '',
                roomRentDays: calculatedRoomDays,
              })
              setShowDischargeDialog(true)
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Discharge</span>
          </Button>
        )}
      </div>

      {/* Critical Alerts */}
      {vitalAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div className="flex-1 flex flex-wrap gap-2">
                  {vitalAlerts.map((a, i) => (
                    <Badge key={i} className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">
                      {a.message}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Eye className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs sm:text-sm">
            <ClipboardList className="mr-1 h-3.5 w-3.5 hidden sm:inline" />
            Orders
            {activeOrders.length > 0 && <Badge className="ml-1.5 bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 text-xs px-1.5 py-0">{activeOrders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="vitals" className="text-xs sm:text-sm">
            <Activity className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Vitals
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="mr-1 h-3.5 w-3.5 hidden sm:inline" />History
          </TabsTrigger>
          <TabsTrigger value="examination" className="text-xs sm:text-sm">
            <Stethoscope className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Exam
          </TabsTrigger>
          <TabsTrigger value="investigations" className="text-xs sm:text-sm">
            <FlaskConical className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Investigations
          </TabsTrigger>
          <TabsTrigger value="visits" className="text-xs sm:text-sm">
            <Calendar className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Visits
          </TabsTrigger>
        </TabsList>

        {/* ====== OVERVIEW TAB ====== */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Patient Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-teal-600" />Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-muted-foreground">Name:</span><span className="font-medium">{admission.patientName}</span>
                  <span className="text-muted-foreground">Age/Gender:</span><span>{admission.patientAge}y / {admission.patientGender}</span>
                  <span className="text-muted-foreground">Blood Group:</span><span>{admission.bloodGroup || '—'}</span>
                  <span className="text-muted-foreground">Marital Status:</span><span>{admission.maritalStatus || '—'}</span>
                  <span className="text-muted-foreground">Mobile:</span><span>{admission.mobileNo || '—'}</span>
                  <span className="text-muted-foreground">Father:</span><span>{admission.fatherName || '—'}</span>
                  <span className="text-muted-foreground">Contact:</span><span>{admission.contactPersonName} ({admission.contactPersonRelation}) {admission.contactPersonMobile}</span>
                  <span className="text-muted-foreground">Address:</span><span className="col-span-1">{admission.address || '—'}</span>
                </div>
                {admission.mlcCase && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">MLC Case</Badge>
                )}
              </CardContent>
            </Card>

            {/* Admission Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-amber-600" />Admission Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-muted-foreground">Admission No:</span>
                  <span className="font-mono text-violet-600">{admission.admissionNo}</span>
                  <span className="text-muted-foreground">Date/Time:</span>
                  <span>{format(new Date(admission.admissionDate), 'dd MMM yyyy')} {admission.admissionTime}</span>
                  <span className="text-muted-foreground">Ward:</span><span>{admission.wardName} ({admission.wardType})</span>
                  <span className="text-muted-foreground">Bed:</span><span>{admission.bedNumber} — {admission.bedType}</span>
                  <span className="text-muted-foreground">Department:</span><span>{admission.departmentName}</span>
                  <span className="text-muted-foreground">Hospital:</span><span>{admission.hospitalName}</span>
                  <span className="text-muted-foreground">Initial Dx:</span><span className="font-medium">{admission.initialDiagnosis || '—'}</span>
                  {admission.referringDoctorName && (
                    <><span className="text-muted-foreground">Referred By:</span><span>{admission.referringDoctorName}</span></>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Vitals Large Display */}
          {latestVital && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600" />Latest Vitals
                  </div>
                  <span className="text-xs font-normal text-muted-foreground">
                    {formatDistanceToNow(new Date(latestVital.recordedAt), { addSuffix: true })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Temp', value: latestVital.temperature, unit: '°F', icon: Thermometer, param: 'temperature' },
                    { label: 'Pulse', value: latestVital.pulse, unit: 'bpm', icon: Heart, param: 'pulse' },
                    { label: 'BP', value: `${latestVital.bpSystolic}/${latestVital.bpDiastolic}`, unit: 'mmHg', icon: Droplets, param: 'bpSystolic', numVal: latestVital.bpSystolic },
                    { label: 'SpO2', value: latestVital.spo2, unit: '%', icon: Wind, param: 'spo2' },
                    { label: 'RR', value: latestVital.respiratoryRate, unit: '/min', icon: Activity, param: 'respiratoryRate' },
                    { label: 'RBS', value: latestVital.rbs, unit: 'mg/dl', icon: Droplets, param: 'rbs', numVal: latestVital.rbs },
                  ].map((v) => {
                    const numValue = v.numVal !== undefined ? v.numVal : typeof v.value === 'number' ? v.value : 0
                    const abnormal = v.param && v.param !== 'rbs' ? isAbnormal(v.param, numValue) : false
                    return (
                      <div key={v.label} className={cn('rounded-lg p-3 text-center', abnormal ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50' : 'bg-muted/50')}>
                        <v.icon className={cn('mx-auto h-5 w-5 mb-1', abnormal ? 'text-red-500' : 'text-muted-foreground')} />
                        <p className={cn('text-2xl font-bold', abnormal ? 'text-red-600' : 'text-foreground')}>{v.value}</p>
                        <p className="text-xs text-muted-foreground">{v.label} <span className="opacity-70">{v.unit}</span></p>
                      </div>
                    )
                  })}
                </div>
                {latestVital.remarks && (
                  <p className="mt-3 text-sm text-muted-foreground">Remarks: {latestVital.remarks}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Active Orders Summary + Med Admin Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-teal-600" />Active Orders ({activeOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active orders</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activeOrders.slice(0, 10).map((o) => (
                      <div key={o.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                        <Pill className="h-4 w-4 text-teal-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{o.drugName} {o.dose}</p>
                          <p className="text-xs text-muted-foreground">{o.route} · {o.frequency} · {o.scheduledTime}</p>
                        </div>
                        <Badge className={cn('text-xs shrink-0', getRouteColor(o.route))}>{o.route}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4 text-amber-600" />Today's Medicine Administration
                  {pendingMeds > 0 && (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 ml-auto">
                      {pendingMeds} pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medAdmins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medicine administrations today</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {medAdmins.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{m.drugName} {m.dose}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.route} · Scheduled: {format(new Date(m.scheduledTime), 'hh:mm a')}
                            {m.administeredTime && ` · Given: ${format(new Date(m.administeredTime), 'hh:mm a')}`}
                            {m.nurseName && ` · R. ${m.nurseName}`}
                          </p>
                        </div>
                        {getAdminStatusBadge(m.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====== ORDERS TAB ====== */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Order Sheet (Form 5)</h2>
            <Dialog open={showAddOrderDialog} onOpenChange={setShowAddOrderDialog}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />Add Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Doctor Order</DialogTitle>
                  <DialogDescription>Add a new medication order for this patient.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Drug Name *</Label>
                    <Input value={orderForm.drugName} onChange={(e) => setOrderForm({ ...orderForm, drugName: e.target.value })} placeholder="e.g. Tab. Paracetamol" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Route *</Label>
                      <Select value={orderForm.route} onValueChange={(v) => setOrderForm({ ...orderForm, route: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MEDICINE_ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Dose *</Label>
                      <Input value={orderForm.dose} onChange={(e) => setOrderForm({ ...orderForm, dose: e.target.value })} placeholder="e.g. 500mg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequency *</Label>
                      <Select value={orderForm.frequency} onValueChange={(v) => setOrderForm({ ...orderForm, frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label} — {f.desc}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Scheduled Time *</Label>
                      <Select value={orderForm.scheduledTime} onValueChange={(v) => setOrderForm({ ...orderForm, scheduledTime: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {scheduledTimeOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Instructions (optional)</Label>
                    <Input value={orderForm.instructions} onChange={(e) => setOrderForm({ ...orderForm, instructions: e.target.value })} placeholder="e.g. After food, Slow IV push" />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={orderForm.isPrn} onCheckedChange={(c) => setOrderForm({ ...orderForm, isPrn: c })} />
                      <Label className="text-sm">PRN (SOS)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={orderForm.isStat} onCheckedChange={(c) => setOrderForm({ ...orderForm, isStat: c })} />
                      <Label className="text-sm">STAT</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddOrderDialog(false)}>Cancel</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => addOrderMutation.mutate()} disabled={addOrderMutation.isPending || !orderForm.drugName || !orderForm.dose}>
                    {addOrderMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Orders Table */}
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders yet. Click &quot;Add Order&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  allOrders.map((o) => (
                    <TableRow key={o.id} className={cn(o.status === 'Stopped' && 'opacity-60')}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{o.drugName}</p>
                          <div className="flex gap-1 mt-0.5">
                            {o.isStat && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs px-1.5 py-0">STAT</Badge>}
                            {o.isPrn && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs px-1.5 py-0">PRN</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={cn('text-xs', getRouteColor(o.route))}>{o.route}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{o.dose}</TableCell>
                      <TableCell className="text-sm">{o.frequency}</TableCell>
                      <TableCell className="text-sm">{o.scheduledTime}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{o.instructions || '—'}</TableCell>
                      <TableCell>
                        {o.status === 'Active' ? (
                          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Stopped</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setStopOrderId(o.id)
                              setShowStopDialog(true)
                            }}
                          >
                            <Square className="mr-1 h-3.5 w-3.5" />Stop
                          </Button>
                        )}
                        {o.status === 'Stopped' && o.stoppedReason && (
                          <span className="text-xs text-muted-foreground" title={o.stoppedReason}>
                            {o.stoppedReason.length > 20 ? o.stoppedReason.slice(0, 20) + '...' : o.stoppedReason}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stop Order Confirmation */}
          <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Stop Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to stop this order? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <Label>Reason for stopping *</Label>
                <Input value={stopReason} onChange={(e) => setStopReason(e.target.value)} placeholder="e.g. No longer needed, Side effects..." />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => stopOrderMutation.mutate()}
                  disabled={stopOrderMutation.isPending || !stopReason}
                >
                  {stopOrderMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Stop Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ====== VITALS TAB ====== */}
        <TabsContent value="vitals" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vitals — Last 24 Hours</h2>
          </div>

          {vitalRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3">No vitals recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky left-0 bg-card z-10">Time</TableHead>
                    <TableHead>Temp (°F)</TableHead>
                    <TableHead>Pulse</TableHead>
                    <TableHead>BP (mmHg)</TableHead>
                    <TableHead>SpO2 (%)</TableHead>
                    <TableHead>RR</TableHead>
                    <TableHead>I/O (ml)</TableHead>
                    <TableHead>O₂</TableHead>
                    <TableHead>RBS</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitalRecords.map((v, idx) => {
                    const prev = vitalRecords[idx + 1]
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="sticky left-0 bg-card z-10 font-mono text-xs whitespace-nowrap">
                          {format(new Date(v.recordedAt), 'dd MMM hh:mm a')}
                        </TableCell>
                        <TableCell className={cn('font-mono', isAbnormal('temperature', v.temperature) && 'text-red-600 font-bold')}>
                          {v.temperature || '—'}
                          <TrendArrow current={v.temperature} previous={prev?.temperature || 0} param="temperature" />
                        </TableCell>
                        <TableCell className={cn('font-mono', isAbnormal('pulse', v.pulse) && 'text-red-600 font-bold')}>
                          {v.pulse || '—'}
                          <TrendArrow current={v.pulse} previous={prev?.pulse || 0} param="pulse" />
                        </TableCell>
                        <TableCell className={cn('font-mono', isAbnormal('bpSystolic', v.bpSystolic) && 'text-red-600 font-bold')}>
                          {v.bpSystolic || 0}/{v.bpDiastolic || 0}
                          <TrendArrow current={v.bpSystolic} previous={prev?.bpSystolic || 0} param="bpSystolic" />
                        </TableCell>
                        <TableCell className={cn('font-mono', isAbnormal('spo2', v.spo2) && 'text-red-600 font-bold')}>
                          {v.spo2 || '—'}
                          <TrendArrow current={v.spo2} previous={prev?.spo2 || 0} param="spo2" />
                        </TableCell>
                        <TableCell className={cn('font-mono', isAbnormal('respiratoryRate', v.respiratoryRate) && 'text-red-600 font-bold')}>
                          {v.respiratoryRate || '—'}
                          <TrendArrow current={v.respiratoryRate} previous={prev?.respiratoryRate || 0} param="respiratoryRate" />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <span className="text-teal-600">{v.inputMl || 0}↓</span> / <span className="text-amber-600">{(v.urineMl || 0) + (v.outputMl || 0)}↑</span>
                        </TableCell>
                        <TableCell className="text-sm">{v.oxygenLiters > 0 ? `${v.oxygenLiters}L` : '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{v.rbs || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{v.remarks || '—'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ====== HISTORY TAB ====== */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">History Sheet (Form 2)</h2>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => saveHistoryMutation.mutate()} disabled={saveHistoryMutation.isPending}>
              {saveHistoryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save History
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Chief Complaints</Label>
                  <Textarea value={historyForm.chiefComplaints} onChange={(e) => setHistoryForm({ ...historyForm, chiefComplaints: e.target.value })} rows={3} placeholder="e.g. Fever x 5 days, cough with expectoration, breathlessness..." />
                </div>
                <div>
                  <Label>Informant</Label>
                  <Input value={historyForm.informant} onChange={(e) => setHistoryForm({ ...historyForm, informant: e.target.value })} placeholder="e.g. Patient, Father, Wife" />
                </div>
                <div>
                  <Label>Past History</Label>
                  <Textarea value={historyForm.pastHistory} onChange={(e) => setHistoryForm({ ...historyForm, pastHistory: e.target.value })} rows={3} placeholder="Previous medical/surgical history..." />
                </div>
                <div>
                  <Label>Drug History</Label>
                  <Textarea value={historyForm.drugHistory} onChange={(e) => setHistoryForm({ ...historyForm, drugHistory: e.target.value })} rows={2} placeholder="Current medications, drug allergies..." />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Personal History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(['Diabetes', 'Hypertension', 'Asthma', 'Thyroid'] as const).map((condition) => (
                    <div key={condition} className="flex items-center gap-2">
                      <Checkbox checked={historyForm.personalHistory[condition] || false} onCheckedChange={(c) => setHistoryForm({ ...historyForm, personalHistory: { ...historyForm.personalHistory, [condition]: !!c } })} />
                      <Label className="text-sm">{condition}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Habits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(['Alcohol', 'Smoking', 'Tobacco'] as const).map((h) => (
                    <div key={h} className="flex items-center gap-2">
                      <Checkbox checked={historyForm.habits[h] || false} onCheckedChange={(c) => setHistoryForm({ ...historyForm, habits: { ...historyForm.habits, [h]: !!c } })} />
                      <Label className="text-sm">{h}</Label>
                    </div>
                  ))}
                  <div>
                    <Label className="text-sm">Allergies</Label>
                    <Input value={historyForm.habits.allergy || ''} onChange={(e) => setHistoryForm({ ...historyForm, habits: { ...historyForm.habits, allergy: e.target.value } })} placeholder="e.g. Penicillin, Sulfa" />
                  </div>
                </CardContent>
              </Card>

              {admission.patientGender === 'Female' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Female History (Obstetric)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">LMP Date</Label>
                        <Input type="date" value={historyForm.femaleHistory.lmp} onChange={(e) => setHistoryForm({ ...historyForm, femaleHistory: { ...historyForm.femaleHistory, lmp: e.target.value } })} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(['gravida', 'para', 'living', 'abortion'] as const).map((f) => (
                          <div key={f}>
                            <Label className="text-xs capitalize">{f}</Label>
                            <Input type="number" min={0} value={historyForm.femaleHistory[f]} onChange={(e) => setHistoryForm({ ...historyForm, femaleHistory: { ...historyForm.femaleHistory, [f]: parseInt(e.target.value) || 0 } })} className="h-8" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ====== EXAMINATION TAB ====== */}
        <TabsContent value="examination" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Physical Examination (Form 6)</h2>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => saveExamMutation.mutate()} disabled={saveExamMutation.isPending}>
              {saveExamMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Examination
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Consciousness Level</Label>
                  <Select value={examForm.consciousnessLevel} onValueChange={(v) => setExamForm({ ...examForm, consciousnessLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conscious">Conscious</SelectItem>
                      <SelectItem value="Semiconscious">Semiconscious</SelectItem>
                      <SelectItem value="Unconscious">Unconscious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Speech</Label>
                  <Select value={examForm.speech} onValueChange={(v) => setExamForm({ ...examForm, speech: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Aphasia">Aphasia</SelectItem>
                      <SelectItem value="Slurred">Slurred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  {([
                    ['obeyingCommands', 'Obeying Commands'],
                    ['respondingToDPS', 'Responding to DPS'],
                    ['oriented', 'Oriented (Time/Place/Person)'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm">{label}</Label>
                      <Switch checked={examForm[key]} onCheckedChange={(c) => setExamForm({ ...examForm, [key]: !!c })} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">General Signs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(['Pallor', 'Clubbing', 'Icterus', 'Cyanosis', 'Lymphadenopathy'] as const).map((sign) => (
                    <div key={sign} className="flex items-center gap-2">
                      <Checkbox checked={examForm.generalSigns[sign] || false} onCheckedChange={(c) => setExamForm({ ...examForm, generalSigns: { ...examForm.generalSigns, [sign]: !!c } })} />
                      <Label className="text-sm">{sign}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label>Examination Notes (RS, CVS, P/A, CNS)</Label>
                  <Textarea value={examForm.examinationNotes} onChange={(e) => setExamForm({ ...examForm, examinationNotes: e.target.value })} rows={6} placeholder="RS: Air entry bilateral, CVS: S1 S2 normal, P/A: Soft, non-tender, CNS: Conscious, oriented..." className="mt-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ====== INVESTIGATIONS TAB ====== */}
        <TabsContent value="investigations" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Investigations</h2>
            <Dialog open={showInvestigationDialog} onOpenChange={setShowInvestigationDialog}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-600">
                  <Plus className="mr-2 h-4 w-4" />Order Investigation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Order New Investigation</DialogTitle>
                  <DialogDescription>Order a lab test for this patient.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Test Name *</Label>
                    <Input value={invForm.testName} onChange={(e) => setInvForm({ ...invForm, testName: e.target.value })} placeholder="e.g. CBC, RBS, LFT, RFT, X-Ray Chest PA" />
                  </div>
                  <div>
                    <Label>Sample Type *</Label>
                    <Select value={invForm.sampleType} onValueChange={(v) => setInvForm({ ...invForm, sampleType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SAMPLE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInvestigationDialog(false)}>Cancel</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => orderInvestigationMutation.mutate()} disabled={orderInvestigationMutation.isPending || !invForm.testName}>
                    {orderInvestigationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {sampleCollections.length === 0 && invReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3">No investigations ordered yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Test Name</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Sent to Lab</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleCollections.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.testName}</TableCell>
                      <TableCell>{s.sampleType}</TableCell>
                      <TableCell>{getSampleStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(s.createdAt), 'dd MMM hh:mm a')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.collectedAt ? format(new Date(s.collectedAt), 'dd MMM hh:mm a') : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.sentToLabAt ? format(new Date(s.sentToLabAt), 'dd MMM hh:mm a') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Investigation Reports */}
          {invReports.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reports ({invReports.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invReports.map((r) => (
                    <div key={r.id} className={cn('flex items-center gap-3 p-3 rounded-lg', r.isAbnormal ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50' : 'bg-muted/30')}>
                      <FileText className={cn('h-4 w-4 shrink-0', r.isAbnormal ? 'text-red-500' : 'text-teal-600')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium text-sm', r.isAbnormal && 'text-red-700')}>{r.testName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.reportDate), 'dd MMM yyyy')}
                          {r.reviewedBy && ` · Reviewed by ${r.reviewedBy}`}
                        </p>
                      </div>
                      {r.isAbnormal && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 shrink-0">Abnormal</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ====== VISITS TAB ====== */}
        <TabsContent value="visits" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Doctor Visits</h2>
            <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />Add Visit Note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Visit Note</DialogTitle>
                  <DialogDescription>Document your clinical findings and advise.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Examination Findings</Label>
                    <Textarea value={visitForm.examinationFindings} onChange={(e) => setVisitForm({ ...visitForm, examinationFindings: e.target.value })} rows={3} placeholder="On examination..." />
                  </div>
                  <div>
                    <Label>Current Diagnosis</Label>
                    <Input value={visitForm.currentDiagnosis} onChange={(e) => setVisitForm({ ...visitForm, currentDiagnosis: e.target.value })} placeholder="Updated diagnosis" />
                  </div>
                  <div>
                    <Label>Advise / Plan</Label>
                    <Textarea value={visitForm.advise} onChange={(e) => setVisitForm({ ...visitForm, advise: e.target.value })} rows={2} placeholder="Continue current treatment, investigate..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowVisitDialog(false)}>Cancel</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => addVisitMutation.mutate()} disabled={addVisitMutation.isPending || (!visitForm.examinationFindings && !visitForm.currentDiagnosis && !visitForm.advise)}>
                    {addVisitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Visit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {doctorVisits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3">No visit notes yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {doctorVisits.map((v) => (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-teal-600" />
                        <span className="font-medium text-sm">{v.doctorName || 'You'}</span>
                        {v.isMobileVisit && <Badge variant="outline" className="text-xs">Mobile Visit</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(v.visitDate), 'dd MMM yyyy')} {v.visitTime}
                      </span>
                    </div>
                    {v.examinationFindings && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Findings:</p>
                        <p className="text-sm whitespace-pre-wrap">{v.examinationFindings}</p>
                      </div>
                    )}
                    {v.currentDiagnosis && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Diagnosis:</p>
                        <p className="text-sm font-medium">{v.currentDiagnosis}</p>
                      </div>
                    )}
                    {v.advise && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Advise:</p>
                        <p className="text-sm whitespace-pre-wrap">{v.advise}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== DISCHARGE DIALOG ====== */}
      <Dialog open={showDischargeDialog} onOpenChange={setShowDischargeDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Discharge Patient
            </DialogTitle>
            <DialogDescription>
              Complete the discharge process for {admission?.patientName}. This will stop all active orders and free the bed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning alerts based on discharge type */}
            {dischargeForm.dischargeType === 'DAMA' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Alert className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">Discharge Against Medical Advice</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    The patient is leaving against medical advice. Ensure the risk acknowledgement form is signed and documented. This may have legal and insurance implications.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {dischargeForm.dischargeType === 'Expired' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Alert className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800 dark:text-red-300">Patient Expired</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    Record the time and cause of death. Notify the family and complete all mandatory documentation including death summary. MLC procedures may apply.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {dischargeForm.dischargeType === 'LAMA' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Alert className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800 dark:text-orange-300">Left Against Medical Advice</AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-400">
                    The patient has left the hospital without formal discharge. Document the circumstances and attempts made to contact the patient.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Discharge Type */}
            <div className="space-y-2">
              <Label htmlFor="dischargeType">Discharge Type <span className="text-red-500">*</span></Label>
              <Select
                value={dischargeForm.dischargeType}
                onValueChange={(val) => setDischargeForm({ ...dischargeForm, dischargeType: val as typeof dischargeForm.dischargeType })}
              >
                <SelectTrigger id="dischargeType" className={cn(
                  dischargeForm.dischargeType === 'Normal' && 'border-emerald-300 dark:border-emerald-700',
                  dischargeForm.dischargeType === 'DAMA' && 'border-amber-300 dark:border-amber-700',
                  dischargeForm.dischargeType === 'LAMA' && 'border-orange-300 dark:border-orange-700',
                  dischargeForm.dischargeType === 'Expired' && 'border-red-300 dark:border-red-700',
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Normal Discharge
                    </span>
                  </SelectItem>
                  <SelectItem value="DAMA">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      DAMA (Against Medical Advice)
                    </span>
                  </SelectItem>
                  <SelectItem value="LAMA">
                    <span className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-orange-600" />
                      LAMA (Left Against Medical Advice)
                    </span>
                  </SelectItem>
                  <SelectItem value="Expired">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                      Expired
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Room Rent Days */}
            <div className="space-y-2">
              <Label htmlFor="roomRentDays" className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Room Rent Days
              </Label>
              <Input
                id="roomRentDays"
                type="number"
                min={1}
                value={dischargeForm.roomRentDays}
                onChange={(e) => setDischargeForm({ ...dischargeForm, roomRentDays: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from admission date ({format(new Date(admission!.admissionDate), 'dd MMM yyyy')}). Edit if needed.
              </p>
            </div>

            {/* Final Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="finalDiagnosis">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Final Diagnosis <span className="text-red-500">*</span>
                </span>
              </Label>
              <Textarea
                id="finalDiagnosis"
                value={dischargeForm.finalDiagnosis}
                onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
                rows={3}
                placeholder="Enter the confirmed final diagnosis..."
              />
            </div>

            {/* Discharge Summary */}
            <div className="space-y-2">
              <Label htmlFor="dischargeSummary">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Discharge Summary <span className="text-red-500">*</span>
                </span>
              </Label>
              <Textarea
                id="dischargeSummary"
                value={dischargeForm.dischargeSummary}
                onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeSummary: e.target.value })}
                rows={5}
                placeholder="Include condition at discharge, treatment given, investigations, medications prescribed, follow-up advice..."
              />
            </div>

            {/* Summary of what will happen */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Upon confirming, the following will happen:
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                    Patient status will be set to <strong className={cn(
                      dischargeForm.dischargeType === 'Expired' ? 'text-red-600' : dischargeForm.dischargeType === 'DAMA' ? 'text-amber-600' : 'text-teal-600'
                    )}>{dischargeForm.dischargeType === 'Expired' ? 'Expired' : dischargeForm.dischargeType === 'DAMA' ? 'DAMA' : dischargeForm.dischargeType === 'LAMA' ? 'DAMA' : 'Discharged'}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    All active doctor orders will be stopped
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Bed {admission?.bedNumber} ({admission?.wardName}) will be marked as Available
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    Active nurse assignments will be completed
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowDischargeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => dischargeMutation.mutate()}
              disabled={dischargeMutation.isPending || !dischargeForm.finalDiagnosis.trim() || !dischargeForm.dischargeSummary.trim()}
              className={cn(
                dischargeForm.dischargeType === 'Normal' && 'bg-teal-600 hover:bg-teal-700 text-white',
                dischargeForm.dischargeType === 'DAMA' && 'bg-amber-600 hover:bg-amber-700 text-white',
                dischargeForm.dischargeType === 'LAMA' && 'bg-orange-600 hover:bg-orange-700 text-white',
                dischargeForm.dischargeType === 'Expired' && 'bg-red-600 hover:bg-red-700 text-white',
              )}
            >
              {dischargeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Confirm Discharge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
