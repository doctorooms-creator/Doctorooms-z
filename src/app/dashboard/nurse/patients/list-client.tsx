'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  BedDouble,
  Pill,
  AlertTriangle,
  Activity,
  ChevronRight,
  Search,
  Thermometer,
  Heart,
  Wind,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getCurrentShift } from '@/lib/ipd-utils'

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

function getTimeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 60000
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${Math.floor(diff)}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export default function NursePatientsListClient() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const shift = getCurrentShift()

  const { data: patientsData, isLoading } = useQuery<{ patients: Patient[] }>({
    queryKey: ['nurse-patients-list'],
    queryFn: () => fetch('/api/dashboard/nurse/patients').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const patients = patientsData?.patients || []

  const filtered = useMemo(() => {
    if (!search) return patients
    const q = search.toLowerCase()
    return patients.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.admissionNo.toLowerCase().includes(q) ||
        p.bedNumber.toLowerCase().includes(q) ||
        p.initialDiagnosis.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q)
    )
  }, [patients, search])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My Patients</h1>
          <p className="text-sm text-muted-foreground">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} assigned for {shift} shift
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Table View */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No patients match your search' : 'No patients assigned for this shift'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Vitals</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filtered.map((patient, i) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            'cursor-pointer border-b transition-colors hover:bg-muted/50',
                            patient.hasCriticalAlert && 'bg-red-50/50 dark:bg-red-950/10'
                          )}
                          onClick={() => router.push(`/dashboard/nurse/patients/${patient.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{patient.patientName}</span>
                                  {patient.hasCriticalAlert && (
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{patient.admissionNo} · {patient.age}y · {patient.gender}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="border-violet-300 bg-violet-100 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                              <BedDouble className="mr-1 h-3 w-3" />{patient.bedNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{patient.departmentName || '—'}</TableCell>
                          <TableCell className="text-sm">{patient.doctorName || '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {patient.initialDiagnosis || '—'}
                          </TableCell>
                          <TableCell>
                            {patient.latestVital ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs">
                                  <Thermometer className={cn('h-3 w-3', patient.latestVital.temperature > 102.2 ? 'text-red-500' : 'text-muted-foreground')} />
                                  <span className={cn(patient.latestVital.temperature > 102.2 && 'text-red-600 font-semibold')}>
                                    {patient.latestVital.temperature > 0 ? `${patient.latestVital.temperature}°` : '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Heart className={cn('h-3 w-3', (patient.latestVital.pulse > 110 || patient.latestVital.pulse < 50) ? 'text-red-500' : 'text-muted-foreground')} />
                                  <span className={cn((patient.latestVital.pulse > 110 || patient.latestVital.pulse < 50) && 'text-red-600 font-semibold')}>
                                    {patient.latestVital.pulse > 0 ? patient.latestVital.pulse : '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Wind className={cn('h-3 w-3', patient.latestVital.spo2 < 94 ? 'text-red-500' : 'text-muted-foreground')} />
                                  <span className={cn(patient.latestVital.spo2 < 94 && 'text-red-600 font-semibold')}>
                                    {patient.latestVital.spo2 > 0 ? `${patient.latestVital.spo2}%` : '—'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {getTimeAgo(patient.latestVital.recordedAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No vitals</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {patient.pendingMedicineCount > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">
                                  <Pill className="mr-1 h-3 w-3" />{patient.pendingMedicineCount}
                                </Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            <AnimatePresence mode="popLayout">
              {filtered.map((patient, i) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/dashboard/nurse/patients/${patient.id}`)}
                  className={cn(
                    'cursor-pointer rounded-xl border bg-card p-4 transition-all hover:shadow-md active:scale-[0.98]',
                    patient.hasCriticalAlert
                      ? 'border-red-300 dark:border-red-700'
                      : 'hover:border-teal-300 dark:hover:border-teal-700'
                  )}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{patient.patientName}</h3>
                      {patient.hasCriticalAlert && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      <BedDouble className="mr-1 h-3 w-3" />{patient.bedNumber}
                    </Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {patient.age}y · {patient.gender} · {patient.departmentName}
                  </p>
                  {patient.initialDiagnosis && (
                    <p className="mb-2 truncate text-xs font-medium text-muted-foreground">{patient.initialDiagnosis}</p>
                  )}
                  {patient.latestVital && (
                    <div className="mb-2 grid grid-cols-4 gap-1 rounded-lg bg-muted/50 p-2">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Temp</p>
                        <p className="text-xs font-semibold">{patient.latestVital.temperature > 0 ? `${patient.latestVital.temperature}°` : '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Pulse</p>
                        <p className="text-xs font-semibold">{patient.latestVital.pulse > 0 ? patient.latestVital.pulse : '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">BP</p>
                        <p className="text-xs font-semibold">{patient.latestVital.bpSystolic > 0 ? `${patient.latestVital.bpSystolic}/${patient.latestVital.bpDiastolic}` : '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">SpO2</p>
                        <p className="text-xs font-semibold">{patient.latestVital.spo2 > 0 ? `${patient.latestVital.spo2}%` : '—'}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-[10px] text-muted-foreground">Dr. {patient.doctorName}</span>
                    {patient.pendingMedicineCount > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 text-[10px]">
                        <Pill className="mr-1 h-3 w-3" />{patient.pendingMedicineCount} pending
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
