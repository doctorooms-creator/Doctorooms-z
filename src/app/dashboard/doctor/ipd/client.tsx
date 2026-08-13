'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BedDouble,
  Users,
  LogOut,
  Pill,
  Search,
  Eye,
  Activity,
  ArrowDown,
  ArrowUp,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

// ============ TYPES ============

interface Patient {
  id: string
  admissionNo: string
  patientName: string
  patientAge: number
  patientGender: string
  wardName: string
  bedNumber: string
  departmentName: string
  status: string
  admissionDate: string
  initialDiagnosis: string
  latestVital: {
    bpSystolic: number
    bpDiastolic: number
    pulse: number
    spo2: number
    temperature: number
    recordedAt: string
  } | null
  activeOrderCount: number
  pendingMedicineCount: number
}

// ============ HELPERS ============

function getStatusBadge(status: string) {
  switch (status) {
    case 'Admitted':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Admitted</Badge>
    case 'Discharged':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Discharged</Badge>
    case 'DAMA':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400">DAMA</Badge>
    case 'Expired':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">Expired</Badge>
    case 'Transferred':
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400">Transferred</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getRouteBadge(route: string) {
  const colors: Record<string, string> = {
    Oral: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    IV: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    IM: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    SC: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
    Topical: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    PR: 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400',
    Nebulization: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
  }
  return colors[route] || 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400'
}

// ============ COMPONENT ============

export default function DoctorIpdClient() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['doctor-ipd-patients', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/dashboard/doctor/ipd?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json() as Promise<{ patients: Patient[]; stats: { totalPatients: number; admitted: number; dischargedToday: number; pendingMeds: number } }>
    },
    refetchInterval: 30000,
  })

  const patients = data?.patients || []
  const stats = data?.stats

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50">
            <BedDouble className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground md:text-2xl">IPD Patients</h1>
            <p className="text-sm text-muted-foreground">Your admitted inpatients</p>
          </div>
          {stats && (
            <Badge variant="outline" className="ml-2 text-teal-600 dark:text-teal-400">
              {stats.totalPatients} total
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-teal-200 dark:border-teal-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats?.totalPatients || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50">
                    <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Currently Admitted</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.admitted || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                    <BedDouble className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-emerald-200 dark:border-emerald-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Discharged Today</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.dischargedToday || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                    <LogOut className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-red-200 dark:border-red-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Medicines</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.pendingMeds || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
                    <Pill className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Admitted">Admitted</SelectItem>
            <SelectItem value="Discharged">Discharged</SelectItem>
            <SelectItem value="DAMA">DAMA</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Patient Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BedDouble className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-muted-foreground">No IPD Patients Found</h3>
            <p className="text-sm text-muted-foreground/70">
              {search || statusFilter
                ? 'Try adjusting your filters'
                : 'You have no admitted inpatients'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">Admission No</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Ward / Bed</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Vitals</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p, idx) => (
                  <TableRow
                    key={p.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      idx % 2 === 0 ? 'bg-muted/30' : ''
                    )}
                    onClick={() => router.push(`/dashboard/doctor/ipd/patients/${p.id}`)}
                  >
                    <TableCell>
                      <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400 font-mono text-xs">
                        {p.admissionNo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.patientAge}y / {p.patientGender}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{p.wardName}</span>
                      <span className="text-muted-foreground"> / {p.bedNumber}</span>
                    </TableCell>
                    <TableCell className="text-sm">{p.departmentName}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {p.initialDiagnosis || '—'}
                    </TableCell>
                    <TableCell>
                      {p.latestVital ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className={cn('font-mono', (p.latestVital.bpSystolic < 90 || p.latestVital.bpSystolic > 160) && 'text-red-600 font-bold')}>
                            {p.latestVital.bpSystolic}/{p.latestVital.bpDiastolic}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className={cn('font-mono', (p.latestVital.pulse < 50 || p.latestVital.pulse > 110) && 'text-red-600 font-bold')}>
                            {p.latestVital.pulse}<span className="text-muted-foreground">bpm</span>
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className={cn('font-mono', p.latestVital.spo2 < 94 && 'text-red-600 font-bold')}>
                            {p.latestVital.spo2}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No vitals</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-teal-600 dark:text-teal-400">
                        {p.activeOrderCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {p.pendingMedicineCount > 0 ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">
                          {p.pendingMedicineCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/doctor/ipd/patients/${p.id}`)
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {patients.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer border-l-4 border-l-teal-500"
                  onClick={() => router.push(`/dashboard/doctor/ipd/patients/${p.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400 font-mono text-xs">
                            {p.admissionNo}
                          </Badge>
                          {getStatusBadge(p.status)}
                        </div>
                        <h3 className="mt-2 font-semibold">{p.patientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {p.patientAge}y / {p.patientGender} · {p.wardName} / {p.bedNumber}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {p.initialDiagnosis || 'No diagnosis'}
                        </p>
                      </div>
                      <Eye className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    {/* Mini vitals */}
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      {p.latestVital ? (
                        <>
                          <div className="flex items-center gap-1 text-xs">
                            <Activity className="h-3 w-3 text-muted-foreground" />
                            <span className={cn('font-mono', (p.latestVital.bpSystolic < 90 || p.latestVital.bpSystolic > 160) && 'text-red-600 font-bold')}>
                              {p.latestVital.bpSystolic}/{p.latestVital.bpDiastolic}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className={cn('font-mono', (p.latestVital.pulse < 50 || p.latestVital.pulse > 110) && 'text-red-600 font-bold')}>
                              {p.latestVital.pulse} bpm
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className={cn('font-mono', p.latestVital.spo2 < 94 && 'text-red-600 font-bold')}>
                              SpO2 {p.latestVital.spo2}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No vitals recorded</span>
                      )}
                      {p.pendingMedicineCount > 0 && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 ml-auto text-xs">
                          {p.pendingMedicineCount} pending meds
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Admitted: {format(new Date(p.admissionDate), 'dd MMM yyyy')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
