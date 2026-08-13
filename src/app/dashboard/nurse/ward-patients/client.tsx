'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BedDouble,
  User,
  AlertTriangle,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Droplets,
  Clock,
  Building2,
  CheckCircle2,
  Wrench,
  Lock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────

interface VitalAlert {
  parameter: string
  level: 'critical' | 'high' | 'medium' | 'normal'
  message: string
  value: number
}

interface LatestVital {
  temperature: number
  pulse: number
  spo2: number
  bpSystolic: number
  bpDiastolic: number
  respiratoryRate: number
  patientStatus: string
  recordedAt: string
}

interface PatientInfo {
  admissionId: string
  admissionNo: string
  patientName: string
  age: number
  gender: string
  diagnosis: string
  doctorName: string
  departmentName: string
  status: string
  admissionDate: string
}

interface BedData {
  id: string
  bedNumber: string
  bedType: string
  status: string
  dailyRate: number
  patient: PatientInfo | null
  latestVital: LatestVital | null
  vitalAlerts: VitalAlert[]
  hasCriticalAlert: boolean
}

interface WardData {
  id: string
  name: string
  wardType: string
  floorNo: string
  hospitalName: string
}

interface WardSummary {
  id: string
  name: string
  wardType: string
  floorNo: string
  totalBeds: number
  occupied: number
  available: number
}

interface WardResponse {
  hasWard: boolean
  hospitalName: string
  ward?: WardData
  beds?: BedData[]
  stats?: { totalBeds: number; occupied: number; available: number }
  wards?: WardSummary[]
}

// ─── Helpers ──────────────────────────────────────────────────────

function getWardTypeColor(type: string) {
  switch (type) {
    case 'ICU':
      return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
    case 'General':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400'
    case 'Private':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400'
    case 'SemiPrivate':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400'
    case 'PostOp':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
    case 'Emergency':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
    case 'Maternity':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400'
  }
}

function getBedTypeLabel(type: string) {
  switch (type) {
    case 'ICU_Ventilator': return 'ICU Vent'
    case 'ICU_NonVentilator': return 'ICU Non-Vent'
    default: return type
  }
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const recorded = new Date(dateStr)
  const diffMs = now.getTime() - recorded.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function getVitalTimeColor(dateStr: string) {
  const now = new Date()
  const recorded = new Date(dateStr)
  const diffHr = (now.getTime() - recorded.getTime()) / 3600000
  if (diffHr < 1) return 'text-emerald-500'
  if (diffHr < 2) return 'text-amber-500'
  return 'text-red-500'
}

function isAbnormal(param: string, value: number) {
  const thresholds = {
    spo2: { critical: 90, warning: 94 },
    bpSystolic: { criticalLow: 90, criticalHigh: 180, warningHigh: 160 },
    bpDiastolic: { criticalHigh: 120, warningHigh: 100 },
    pulse: { criticalLow: 50, criticalHigh: 130, warningHigh: 110 },
    temperature: { warningHigh: 102.2 },
    respiratoryRate: { criticalLow: 10, criticalHigh: 30 },
  } as const

  const t = thresholds[param as keyof typeof thresholds]
  if (!t) return false

  if (param === 'spo2') return value < t.warning
  if (param === 'bpSystolic') return value < (t as { criticalLow: number }).criticalLow || value > (t as { warningHigh: number }).warningHigh
  if (param === 'bpDiastolic') return value > (t as { warningHigh: number }).warningHigh
  if (param === 'pulse') return value < (t as { criticalLow: number }).criticalLow || value > (t as { warningHigh: number }).warningHigh
  if (param === 'temperature') return value > (t as { warningHigh: number }).warningHigh
  if (param === 'respiratoryRate') return value < (t as { criticalLow: number }).criticalLow || value > (t as { criticalHigh: number }).criticalHigh
  return false
}

// ─── Vital Mini Display ──────────────────────────────────────────

function VitalMini({ vital, alerts }: { vital: LatestVital; alerts: VitalAlert[] }) {
  const alertParams = new Set(alerts.map((a) => a.parameter))

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
      <VitalPill
        icon={<Thermometer className="h-3 w-3" />}
        label="Temp"
        value={vital.temperature > 0 ? `${vital.temperature.toFixed(1)}°F` : '—'}
        abnormal={isAbnormal('temperature', vital.temperature) || alertParams.has('Temperature')}
      />
      <VitalPill
        icon={<Heart className="h-3 w-3" />}
        label="Pulse"
        value={vital.pulse > 0 ? `${vital.pulse}` : '—'}
        unit="bpm"
        abnormal={isAbnormal('pulse', vital.pulse) || alertParams.has('Pulse')}
      />
      <VitalPill
        icon={<Droplets className="h-3 w-3" />}
        label="BP"
        value={vital.bpSystolic > 0 ? `${vital.bpSystolic}/${vital.bpDiastolic}` : '—'}
        unit="mmHg"
        abnormal={isAbnormal('bpSystolic', vital.bpSystolic) || alertParams.has('BP')}
      />
      <VitalPill
        icon={<Wind className="h-3 w-3" />}
        label="SpO2"
        value={vital.spo2 > 0 ? `${Math.round(vital.spo2)}` : '—'}
        unit="%"
        abnormal={isAbnormal('spo2', vital.spo2) || alertParams.has('SpO2')}
      />
    </div>
  )
}

function VitalPill({
  icon,
  label,
  value,
  unit,
  abnormal,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  abnormal: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={cn('text-muted-foreground', abnormal && 'text-red-500 dark:text-red-400')}>
        {icon}
      </span>
      <span className="font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-semibold tabular-nums',
          abnormal ? 'text-red-600 dark:text-red-400' : 'text-foreground'
        )}
      >
        {value}
      </span>
      {unit && <span className="text-muted-foreground opacity-70">{unit}</span>}
    </div>
  )
}

// ─── Bed Card ─────────────────────────────────────────────────────

function BedCard({ bed }: { bed: BedData }) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (bed.status === 'Occupied' && bed.patient) {
      router.push(`/dashboard/nurse/patients/${bed.patient.admissionId}`)
    }
  }, [bed.status, bed.patient, router])

  // Status styling
  const isAvailable = bed.status === 'Available'
  const isOccupied = bed.status === 'Occupied'
  const isMaintenance = bed.status === 'Maintenance'
  const isReserved = bed.status === 'Reserved'
  const isCritical = bed.hasCriticalAlert

  const borderColor = cn(
    'rounded-xl border-2 transition-all duration-300',
    isAvailable && 'border-emerald-400/60 dark:border-emerald-600/40',
    isOccupied && !isCritical && 'border-teal-400/50 dark:border-teal-600/30',
    isOccupied && isCritical && 'border-red-500 dark:border-red-400',
    isMaintenance && 'border-amber-400/50 dark:border-amber-600/30 border-dashed',
    isReserved && 'border-slate-400/50 dark:border-slate-600/30'
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={isOccupied ? { y: -3, shadow: 'lg' } : undefined}
      onClick={isOccupied ? handleClick : undefined}
      className={cn(
        'relative overflow-hidden bg-card',
        borderColor,
        isOccupied && 'cursor-pointer hover:shadow-lg'
      )}
    >
      {/* Critical pulsing overlay */}
      {isCritical && (
        <div className="absolute inset-0 animate-pulse rounded-xl bg-red-500/5" />
      )}

      <CardContent className="relative p-4">
        {/* Top row: Bed number + status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                isAvailable && 'bg-emerald-100 dark:bg-emerald-900/40',
                isOccupied && !isCritical && 'bg-teal-100 dark:bg-teal-900/40',
                isOccupied && isCritical && 'bg-red-100 dark:bg-red-900/40',
                isMaintenance && 'bg-amber-100 dark:bg-amber-900/40',
                isReserved && 'bg-slate-100 dark:bg-slate-800/40'
              )}
            >
              <BedDouble
                className={cn(
                  'h-4.5 w-4.5',
                  isAvailable && 'text-emerald-600 dark:text-emerald-400',
                  isOccupied && !isCritical && 'text-teal-600 dark:text-teal-400',
                  isOccupied && isCritical && 'text-red-600 dark:text-red-400',
                  isMaintenance && 'text-amber-600 dark:text-amber-400',
                  isReserved && 'text-slate-500 dark:text-slate-400'
                )}
              />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{bed.bedNumber}</h3>
              <p className="text-[11px] text-muted-foreground">{getBedTypeLabel(bed.bedType)}</p>
            </div>
          </div>

          {/* Status badge + critical dot */}
          <div className="flex items-center gap-1.5">
            {isCritical && (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
            {isAvailable && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                Available
              </Badge>
            )}
            {isOccupied && (
              <Badge className={cn(
                'text-[10px] px-1.5 py-0',
                isCritical
                  ? 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400'
                  : 'bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400'
              )}>
                <User className="mr-0.5 h-2.5 w-2.5" />
                Occupied
              </Badge>
            )}
            {isMaintenance && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0 dark:bg-amber-950/50 dark:text-amber-400">
                <Wrench className="mr-0.5 h-2.5 w-2.5" />
                Maintenance
              </Badge>
            )}
            {isReserved && (
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px] px-1.5 py-0 dark:bg-slate-800/50 dark:text-slate-400">
                <Lock className="mr-0.5 h-2.5 w-2.5" />
                Reserved
              </Badge>
            )}
          </div>
        </div>

        {/* Occupied: Patient info */}
        {isOccupied && bed.patient && (
          <div className="mt-3 space-y-2">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold leading-tight truncate">{bed.patient.patientName}</p>
              <p className="text-xs text-muted-foreground">
                {bed.patient.age}y, {bed.patient.gender}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                {bed.patient.departmentName}
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{bed.patient.doctorName}</span>
            </div>

            {bed.patient.diagnosis && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 leading-tight">
                {bed.patient.diagnosis}
              </p>
            )}

            {/* Vitals mini display */}
            {bed.latestVital && (
              <>
                <VitalMini vital={bed.latestVital} alerts={bed.vitalAlerts} />
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  <span className={getVitalTimeColor(bed.latestVital.recordedAt)}>
                    {formatTimeAgo(bed.latestVital.recordedAt)}
                  </span>
                </div>
              </>
            )}

            {/* Critical alert banner */}
            {isCritical && (
              <div className="mt-1 flex items-start gap-1.5 rounded-md bg-red-50 p-1.5 dark:bg-red-950/30">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                <p className="text-[10px] leading-tight text-red-700 dark:text-red-400">
                  {bed.vitalAlerts.find((a) => a.level === 'critical')?.message || 'Critical alert'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Available: Empty state */}
        {isAvailable && (
          <div className="mt-4 flex flex-col items-center justify-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">Ready</p>
            <p className="text-[10px] text-muted-foreground">Available for admission</p>
          </div>
        )}

        {/* Maintenance */}
        {isMaintenance && (
          <div className="mt-4 flex flex-col items-center justify-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">Under Maintenance</p>
            <p className="text-[10px] text-muted-foreground">Not available</p>
          </div>
        )}

        {/* Reserved */}
        {isReserved && (
          <div className="mt-4 flex flex-col items-center justify-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/40">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Reserved</p>
            <p className="text-[10px] text-muted-foreground">Bed reserved</p>
          </div>
        )}
      </CardContent>
    </motion.div>
  )
}

// ─── Bed Card Skeleton ────────────────────────────────────────────

function BedCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  )
}

// ─── No Ward Assigned View ───────────────────────────────────────

function NoWardView({ hospitalName, wards }: { hospitalName: string; wards: WardSummary[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
          <Building2 className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No Ward Assigned</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          You are not currently assigned to any ward. Contact your nursing supervisor to get assigned.
        </p>
        {hospitalName && (
          <p className="mt-2 text-xs text-muted-foreground">{hospitalName}</p>
        )}
      </div>

      {wards && wards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            <Building2 className="mr-1.5 inline-block h-4 w-4" />
            Hospital Wards Overview
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wards.map((ward, i) => (
              <motion.div
                key={ward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-400" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{ward.name}</h4>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className={cn('text-[10px] px-1.5 py-0', getWardTypeColor(ward.wardType))}>
                            {ward.wardType}
                          </Badge>
                          {ward.floorNo && (
                            <span className="text-[11px] text-muted-foreground">{ward.floorNo}</span>
                          )}
                        </div>
                      </div>
                      <BedDouble className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="font-medium">{ward.totalBeds} beds</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{ward.available} free</span>
                      <span className="text-teal-600 dark:text-teal-400">{ward.occupied} occupied</span>
                    </div>
                    {/* Mini bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                        style={{ width: ward.totalBeds > 0 ? `${(ward.occupied / ward.totalBeds) * 100}%` : '0%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────────

export default function NurseWardPatientsClient() {
  const router = useRouter()

  const { data, isLoading, error } = useQuery<WardResponse>({
    queryKey: ['nurse-ward-patients'],
    queryFn: () => fetch('/api/dashboard/nurse/ward-patients').then((r) => r.json()),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <h3 className="mt-4 text-lg font-semibold">Failed to load ward data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message || 'An unexpected error occurred.'}
        </p>
      </div>
    )
  }

  // No ward assigned
  if (!data.hasWard) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <NoWardView hospitalName={data.hospitalName} wards={data.wards} />
      </div>
    )
  }

  // Ward assigned — show bed map
  const { ward, beds, stats } = data
  const criticalCount = beds?.filter((b) => b.hasCriticalAlert).length || 0

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20">
              <BedDouble className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">{ward?.name}</h1>
                <Badge className={cn('text-[10px] px-2 py-0', getWardTypeColor(ward?.wardType || ''))}>
                  {ward?.wardType}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{ward?.hospitalName}</span>
                {ward?.floorNo && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{ward.floorNo}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 animate-pulse text-teal-500" />
            <span>Live · 30s refresh</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <BedDouble className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{stats?.totalBeds || 0}</p>
              <p className="text-[11px] text-muted-foreground">Total Beds</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{stats?.occupied || 0}</p>
              <p className="text-[11px] text-muted-foreground">Occupied</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{stats?.available || 0}</p>
              <p className="text-[11px] text-muted-foreground">Available</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-card p-3.5',
              criticalCount > 0
                ? 'border-red-300 dark:border-red-800/50'
                : 'border-border'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                criticalCount > 0
                  ? 'bg-red-100 dark:bg-red-900/40'
                  : 'bg-emerald-100 dark:bg-emerald-900/40'
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-4 w-4',
                  criticalCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}
              />
            </div>
            <div>
              <p className={cn('text-lg font-bold tabular-nums', criticalCount > 0 && 'text-red-600 dark:text-red-400')}>
                {criticalCount}
              </p>
              <p className="text-[11px] text-muted-foreground">Critical Alerts</p>
            </div>
          </motion.div>
        </div>

        {/* Occupancy bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-red-500 transition-all duration-700"
              style={{
                width: stats && stats.totalBeds > 0
                  ? `${(stats.occupied / stats.totalBeds) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {stats && stats.totalBeds > 0
              ? `${Math.round((stats.occupied / stats.totalBeds) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Bed grid */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Bed Map
          </h2>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-emerald-400" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-teal-400" />
              Occupied
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-red-500" />
              Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-amber-400" />
              Maintenance
            </span>
          </div>
        </div>

        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
          >
            {beds?.map((bed, i) => (
              <BedCard key={bed.id} bed={bed} />
            ))}
          </motion.div>
        </AnimatePresence>

        {beds?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <BedDouble className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-medium">No beds in this ward</h3>
            <p className="mt-1 text-xs text-muted-foreground">Beds will appear here once configured by admin.</p>
          </div>
        )}
      </div>
    </div>
  )
}
