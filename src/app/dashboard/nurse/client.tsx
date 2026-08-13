'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Pill,
  AlertTriangle,
  TestTube,
  Clock,
  Activity,
  BedDouble,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface NurseStats {
  myPatientCount: number
  pendingMedicines: number
  overdueMedicines: number
  pendingSamples: number
  todayAlerts: number
  wardName: string
  shift: string
  nurseName: string
  hospitalName: string
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

interface Patient {
  id: string
  admissionNo: string
  patientName: string
  age: number
  gender: string
  bedNumber: string
  wardName: string
  departmentName: string
  doctorName: string
  status: string
  initialDiagnosis: string
  latestVital: LatestVital | null
  hasCriticalAlert: boolean
  pendingMedicineCount: number
}

function getShiftBadge(shift: string) {
  switch (shift) {
    case 'Morning':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">
          ☀️ {shift}
        </Badge>
      )
    case 'Evening':
      return (
        <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400">
          🌅 {shift}
        </Badge>
      )
    case 'Night':
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-400">
          🌙 {shift}
        </Badge>
      )
    default:
      return <Badge variant="secondary">{shift}</Badge>
  }
}

function getVitalTimeColor(agoMinutes: number): string {
  if (agoMinutes < 60) return 'text-emerald-600 dark:text-emerald-400'
  if (agoMinutes < 120) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getVitalTimeLabel(agoMinutes: number): string {
  if (agoMinutes < 1) return 'Just now'
  if (agoMinutes < 60) return `${Math.floor(agoMinutes)} min ago`
  if (agoMinutes < 1440) return `${Math.floor(agoMinutes / 60)} hr ago`
  return `${Math.floor(agoMinutes / 1440)} day ago`
}

export default function NurseDashboardClient() {
  const router = useRouter()
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: stats, isLoading: statsLoading } = useQuery<NurseStats>({
    queryKey: ['nurse-stats'],
    queryFn: () => fetch('/api/dashboard/nurse').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: patientsData, isLoading: patientsLoading } = useQuery<{ patients: Patient[] }>({
    queryKey: ['nurse-patients'],
    queryFn: () => fetch('/api/dashboard/nurse/patients').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const patients = patientsData?.patients || []

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Nurse Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{stats?.nurseName || 'Loading...'}</span>
            {stats?.wardName && (
              <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                <BedDouble className="mr-1 h-3 w-3" />
                {stats.wardName}
              </Badge>
            )}
            {stats?.shift && getShiftBadge(stats.shift)}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
          <Clock className="h-4 w-4 text-teal-500" />
          <span className="font-mono text-lg font-semibold tabular-nums">
            {formatTime(clock)}
          </span>
        </div>
      </motion.div>

      {/* Stats Row */}
      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Patients"
            value={stats?.myPatientCount ?? 0}
            icon={Users}
            gradient="from-teal-500 to-teal-600"
            iconBg="bg-teal-100 dark:bg-teal-900/50"
          />
          <StatCard
            title="Pending Medicines"
            value={stats?.pendingMedicines ?? 0}
            icon={Pill}
            gradient="from-amber-500 to-amber-600"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
          />
          <StatCard
            title="Overdue"
            value={stats?.overdueMedicines ?? 0}
            icon={AlertTriangle}
            gradient="from-red-500 to-red-600"
            iconBg="bg-red-100 dark:bg-red-900/50"
          />
          <StatCard
            title="Pending Samples"
            value={stats?.pendingSamples ?? 0}
            icon={TestTube}
            gradient="from-sky-500 to-sky-600"
            iconBg="bg-sky-100 dark:bg-sky-900/50"
          />
        </div>
      )}

      {/* Patient Cards Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Patients</h2>
          <Badge variant="secondary" className="text-xs">
            {patients.length} assigned
          </Badge>
        </div>

        {patientsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No patients assigned for this shift</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {patients.map((patient, i) => (
                <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => router.push(`/dashboard/nurse/patients/${patient.id}`)}
                  className={cn(
                    'group relative cursor-pointer overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700',
                    patient.hasCriticalAlert && 'border-red-300 dark:border-red-700'
                  )}
                >
                  {/* Critical alert bar */}
                  {patient.hasCriticalAlert && (
                    <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-600" />
                  )}

                  <div className="p-4">
                    {/* Patient Name + Badges */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold">{patient.patientName}</h3>
                          {patient.hasCriticalAlert && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{patient.admissionNo}</p>
                      </div>
                      <Badge className="shrink-0 border-violet-300 bg-violet-100 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                        <BedDouble className="mr-1 h-3 w-3" />
                        {patient.bedNumber}
                      </Badge>
                    </div>

                    {/* Age/Gender + Department */}
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{patient.age}y</span>
                        <span>•</span>
                        <span>{patient.gender}</span>
                        {patient.departmentName && (
                          <>
                            <span>•</span>
                            <span>{patient.departmentName}</span>
                          </>
                        )}
                      </div>
                      {patient.initialDiagnosis && (
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {patient.initialDiagnosis}
                        </p>
                      )}
                    </div>

                    {/* Latest Vitals Mini Display */}
                    {patient.latestVital ? (
                      <div className="mb-3">
                        <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-muted/50 p-2">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Temp</p>
                            <p className={cn(
                              'text-xs font-semibold',
                              patient.latestVital.temperature > 102.2 ? 'text-red-600 dark:text-red-400' : ''
                            )}>
                              {patient.latestVital.temperature > 0 ? `${patient.latestVital.temperature}°` : '—'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Pulse</p>
                            <p className={cn(
                              'text-xs font-semibold',
                              patient.latestVital.pulse > 110 || patient.latestVital.pulse < 50 ? 'text-red-600 dark:text-red-400' : ''
                            )}>
                              {patient.latestVital.pulse > 0 ? patient.latestVital.pulse : '—'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">BP</p>
                            <p className={cn(
                              'text-xs font-semibold',
                              patient.latestVital.bpSystolic > 160 || patient.latestVital.bpSystolic < 90 ? 'text-red-600 dark:text-red-400' : ''
                            )}>
                              {patient.latestVital.bpSystolic > 0 ? `${patient.latestVital.bpSystolic}/${patient.latestVital.bpDiastolic}` : '—'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">SpO2</p>
                            <p className={cn(
                              'text-xs font-semibold',
                              patient.latestVital.spo2 < 94 ? 'text-red-600 dark:text-red-400' : ''
                            )}>
                              {patient.latestVital.spo2 > 0 ? `${patient.latestVital.spo2}%` : '—'}
                            </p>
                          </div>
                        </div>
                        {/* Last recorded time */}
                        <p className={cn(
                          'mt-1.5 flex items-center gap-1 text-[10px]',
                          getVitalTimeColor((Date.now() - new Date(patient.latestVital.recordedAt).getTime()) / 60000)
                        )}>
                          <Activity className="h-3 w-3" />
                          Last: {getVitalTimeLabel((Date.now() - new Date(patient.latestVital.recordedAt).getTime()) / 60000)}
                        </p>
                      </div>
                    ) : (
                      <p className="mb-3 text-xs text-muted-foreground italic">No vitals recorded yet</p>
                    )}

                    {/* Footer: Pending Meds + Arrow */}
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <div className="flex items-center gap-1.5">
                        {patient.pendingMedicineCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">
                            <Pill className="mr-1 h-3 w-3" />
                            {patient.pendingMedicineCount} pending
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            patient.status === 'Admitted' && 'border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400',
                            patient.status === 'Discharged' && 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400',
                            patient.status === 'DAMA' && 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'
                          )}
                        >
                          {patient.status}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
