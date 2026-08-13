'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BedDouble,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Activity,
  AlertTriangle,
  Bed,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  X,
  Hospital,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  CalendarDays,
  Users,
  HeartPulse,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ============ Types ============

interface Admission {
  id: string
  admissionNo: string
  patientName: string
  age: number
  gender: string
  wardName: string
  wardType: string
  bedNumber: string
  bedType: string
  departmentName: string
  departmentShortCode: string
  attendingDoctorName: string
  status: string
  admissionDate: string
  admissionTime: string
  initialDiagnosis: string
}

interface Stats {
  totalAdmitted: number
  dischargedToday: number
  bedsOccupied: number
  totalBeds: number
  todayAdmissions: number
}

interface AvailableBed {
  id: string
  bedNumber: string
  bedType: string
  dailyRate: number
  wardId: string
  wardName: string
  wardType: string
  floorNo: string
}

interface WardGroup {
  wardId: string
  wardName: string
  wardType: string
  floorNo: string
  availableCount: number
  beds: { id: string; bedNumber: string; bedType: string; dailyRate: number }[]
}

interface Doctor {
  doctorId: string
  name: string
  profileImg: string | null
  specialization: string
  designation: string
  departmentId: string
  departmentName: string
  departmentShortCode: string
}

interface Ward {
  id: string
  name: string
  wardType: string
}

interface Department {
  id: string
  name: string
  shortCode: string
}

// ============ Status badge helper ============

function statusBadge(status: string) {
  switch (status) {
    case 'Admitted':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    case 'Discharged':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    case 'DAMA':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    case 'Expired':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    case 'Transferred':
      return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function formatDate(isoString: string) {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ============ Animation variants ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ============ Main Component ============

export default function IpdAdmissionClient() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [wardFilter, setWardFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showAdmitDialog, setShowAdmitDialog] = useState(false)

  // ── Form state ──
  const [form, setForm] = useState({
    // Section 1: Ward & Bed
    departmentId: '',
    wardId: '',
    bedId: '',
    attendingDoctorId: '',
    // Section 2: Patient Info
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    bloodGroup: '',
    maritalStatus: '',
    mobileNo: '',
    aadharNo: '',
    // Section 3: Family & Emergency
    fatherName: '',
    motherName: '',
    husbandWifeName: '',
    contactPersonName: '',
    contactPersonMobile: '',
    contactPersonRelation: '',
    // Section 4: Address
    address: '',
    village: '',
    taluka: '',
    district: '',
    state: '',
    pinCode: '',
    // Section 5: Medical
    mlcCase: false,
    previousHospitalization: '',
    mediClaimDetails: '',
    initialDiagnosis: '',
  })

  const updateForm = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Cascade: when ward changes, reset bed
      if (field === 'wardId') {
        next.bedId = ''
      }
      // Cascade: when department changes, reset doctor
      if (field === 'departmentId') {
        next.attendingDoctorId = ''
      }
      return next
    })
  }, [])

  // ── Queries ──

  const admissionsQuery = useQuery({
    queryKey: ['ipd-admissions', page, statusFilter, wardFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (wardFilter !== 'all') params.set('wardId', wardFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/dashboard/receptionist/ipd?${params}`)
      if (!res.ok) throw new Error('Failed to load admissions')
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  const availableBedsQuery = useQuery({
    queryKey: ['ipd-available-beds', form.wardId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (form.wardId) params.set('wardId', form.wardId)
      const res = await fetch(`/api/dashboard/receptionist/ipd/available-beds?${params}`)
      if (!res.ok) throw new Error('Failed to load beds')
      return res.json() as Promise<{ beds: AvailableBed[]; wardGroups: WardGroup[] }>
    },
    enabled: showAdmitDialog,
    staleTime: 10 * 1000,
  })

  const doctorsQuery = useQuery({
    queryKey: ['ipd-doctors', form.departmentId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (form.departmentId) params.set('departmentId', form.departmentId)
      const res = await fetch(`/api/dashboard/receptionist/ipd/doctors?${params}`)
      if (!res.ok) throw new Error('Failed to load doctors')
      return res.json() as Promise<{ doctors: Doctor[] }>
    },
    enabled: showAdmitDialog,
    staleTime: 10 * 1000,
  })

  // ── Derived data ──

  const admissions: Admission[] = admissionsQuery.data?.admissions || []
  const stats: Stats | undefined = admissionsQuery.data?.stats
  const pagination = admissionsQuery.data?.pagination
  const beds: AvailableBed[] = availableBedsQuery.data?.beds || []
  const wardGroups: WardGroup[] = availableBedsQuery.data?.wardGroups || []
  const doctors: Doctor[] = doctorsQuery.data?.doctors || []

  // Get unique wards from admissions for filter
  const uniqueWards = useMemo(() => {
    const wardMap = new Map<string, { id: string; name: string }>()
    admissionsQuery.data?.admissions?.forEach((a: Admission) => {
      if (!wardMap.has(a.wardName)) {
        wardMap.set(a.wardName, { id: '', name: a.wardName })
      }
    })
    // Also get wards from bed data
    wardGroups.forEach((wg) => {
      if (!wardMap.has(wg.wardName)) {
        wardMap.set(wg.wardName, { id: wg.wardId, name: wg.wardName })
      }
    })
    return Array.from(wardMap.values())
  }, [admissionsQuery.data, wardGroups])

  // Get unique departments from doctors
  const uniqueDepartments = useMemo(() => {
    const deptMap = new Map<string, { id: string; name: string; shortCode: string }>()
    doctors.forEach((d) => {
      if (!deptMap.has(d.departmentId)) {
        deptMap.set(d.departmentId, {
          id: d.departmentId,
          name: d.departmentName,
          shortCode: d.departmentShortCode,
        })
      }
    })
    return Array.from(deptMap.values())
  }, [doctors])

  // Filtered beds for selected ward
  const filteredBeds = useMemo(() => {
    if (!form.wardId) return beds
    return beds.filter((b) => b.wardId === form.wardId)
  }, [beds, form.wardId])

  // ── Admit mutation ──

  const admitMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const res = await fetch('/api/dashboard/receptionist/ipd/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patientAge: parseInt(formData.patientAge, 10) || 0,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to admit patient')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Patient Admitted Successfully!`, {
        description: `Admission No: ${data.admission.admissionNo}`,
      })
      setShowAdmitDialog(false)
      // Reset form
      setForm({
        departmentId: '',
        wardId: '',
        bedId: '',
        attendingDoctorId: '',
        patientName: '',
        patientAge: '',
        patientGender: 'Male',
        bloodGroup: '',
        maritalStatus: '',
        mobileNo: '',
        aadharNo: '',
        fatherName: '',
        motherName: '',
        husbandWifeName: '',
        contactPersonName: '',
        contactPersonMobile: '',
        contactPersonRelation: '',
        address: '',
        village: '',
        taluka: '',
        district: '',
        state: '',
        pinCode: '',
        mlcCase: false,
        previousHospitalization: '',
        mediClaimDetails: '',
        initialDiagnosis: '',
      })
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] })
      queryClient.invalidateQueries({ queryKey: ['ipd-available-beds'] })
    },
    onError: (error: Error) => {
      toast.error('Admission Failed', {
        description: error.message,
      })
    },
  })

  const handleAdmit = useCallback(() => {
    if (!form.wardId || !form.bedId || !form.departmentId || !form.attendingDoctorId) {
      toast.error('Missing Required Fields', {
        description: 'Please select ward, bed, department, and attending doctor.',
      })
      return
    }
    if (!form.patientName.trim()) {
      toast.error('Missing Patient Name', {
        description: 'Patient name is required.',
      })
      return
    }
    if (!form.patientAge || parseInt(form.patientAge, 10) <= 0) {
      toast.error('Invalid Age', {
        description: 'Please enter a valid patient age.',
      })
      return
    }
    admitMutation.mutate(form)
  }, [form, admitMutation])

  const handleSearch = useCallback(() => {
    setSearch(searchInput)
    setPage(1)
  }, [searchInput])

  // ── Render ──

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/10">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                <BedDouble className="size-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  IPD Admissions
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 text-xs">
                    <Hospital className="size-3 mr-1" />
                    Your Hospital
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowAdmitDialog(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2"
            >
              <UserPlus className="size-4" />
              Admit Patient
            </Button>
          </div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <BedDouble className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Currently Admitted</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {admissionsQuery.isLoading ? <Skeleton className="h-7 w-12" /> : stats?.totalAdmitted ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Activity className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Discharged Today</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {admissionsQuery.isLoading ? <Skeleton className="h-7 w-12" /> : stats?.dischargedToday ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Bed className="size-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Beds Occupied</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300">
                      {admissionsQuery.isLoading ? (
                        <Skeleton className="h-7 w-16" />
                      ) : (
                        <span>
                          {stats?.bedsOccupied ?? 0}
                          <span className="text-sm font-normal text-muted-foreground"> / {stats?.totalBeds ?? 0}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <CalendarDays className="size-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Today's Admissions</p>
                    <p className="text-xl font-bold text-teal-700 dark:text-teal-300">
                      {admissionsQuery.isLoading ? <Skeleton className="h-7 w-12" /> : stats?.todayAdmissions ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ── Filters Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground flex-shrink-0" />
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Admitted">Admitted</SelectItem>
                      <SelectItem value="Discharged">Discharged</SelectItem>
                      <SelectItem value="DAMA">DAMA</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="Transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ward filter */}
                <Select value={wardFilter} onValueChange={(v) => { setWardFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="All Wards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {uniqueWards.map((w) => (
                      <SelectItem key={w.id || w.name} value={w.id || w.name}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or admission no..."
                      className="pl-9 h-9"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    />
                  </div>
                  <Button size="sm" variant="outline" className="h-9 px-3" onClick={handleSearch}>
                    <Search className="size-4" />
                  </Button>
                </div>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => {
                    admissionsQuery.refetch()
                  }}
                >
                  <RefreshCw className={`size-4 ${admissionsQuery.isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Admissions Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              {/* Loading */}
              {admissionsQuery.isLoading && (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!admissionsQuery.isLoading && admissions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BedDouble className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No IPD Admissions Found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {search || statusFilter !== 'all' || wardFilter !== 'all'
                      ? 'Try adjusting your filters or search query.'
                      : 'No patients have been admitted yet. Click "Admit Patient" to start.'}
                  </p>
                  {!search && statusFilter === 'all' && wardFilter === 'all' && (
                    <Button
                      onClick={() => setShowAdmitDialog(true)}
                      className="mt-4 bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                      <UserPlus className="size-4" />
                      Admit Patient
                    </Button>
                  )}
                </div>
              )}

              {/* Table */}
              {!admissionsQuery.isLoading && admissions.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[130px]">Admission No</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead className="w-[80px]">Age/Gender</TableHead>
                          <TableHead className="w-[120px]">Ward / Bed</TableHead>
                          <TableHead className="w-[100px]">Department</TableHead>
                          <TableHead className="w-[130px]">Doctor</TableHead>
                          <TableHead className="w-[140px] hidden lg:table-cell">Diagnosis</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[90px]">Date</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {admissions.map((a, index) => (
                            <motion.tr
                              key={a.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="group border-b transition-colors hover:bg-muted/30"
                            >
                              <TableCell>
                                <Badge className="bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800 font-mono text-xs">
                                  {a.admissionNo}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium">{a.patientName}</p>
                                {a.mobileNo && (
                                  <p className="text-xs text-muted-foreground mt-0.5">Mobile: {a.mobileNo}</p>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {a.age}Y / {a.gender?.charAt(0) || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Bed className="size-3.5 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium">{a.wardName}</p>
                                    <p className="text-xs text-muted-foreground">{a.bedNumber}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{a.departmentName}</span>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm truncate max-w-[120px]">{a.attendingDoctorName}</p>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <p className="text-sm text-muted-foreground truncate max-w-[140px]">
                                  {a.initialDiagnosis || '-'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs ${statusBadge(a.status)}`}>
                                  {a.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(a.admissionDate)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="size-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i
                          if (pageNum > pagination.totalPages) return null
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          className="h-8 px-2"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Admission Form Dialog ── */}
      <Dialog open={showAdmitDialog} onOpenChange={setShowAdmitDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <ClipboardList className="size-5 text-teal-600" />
              IPD Admission — Form 1: Admission Sheet
            </DialogTitle>
            <DialogDescription>
              Fill all required sections to admit a patient to IPD.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] px-6 pb-6">
            <div className="space-y-6 pt-4">
              {/* ── Section 1: Ward & Bed Selection ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold">
                    1
                  </div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="size-4 text-teal-600" />
                    Ward & Bed Selection
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.departmentId}
                      onValueChange={(v) => updateForm('departmentId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueDepartments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} ({d.shortCode})
                          </SelectItem>
                        ))}
                        {uniqueDepartments.length === 0 && (
                          <SelectItem value="_loading" disabled>
                            {doctorsQuery.isLoading ? 'Loading...' : 'No departments found'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ward */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Ward <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.wardId}
                      onValueChange={(v) => updateForm('wardId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wardGroups.map((wg) => (
                          <SelectItem key={wg.wardId} value={wg.wardId}>
                            {wg.wardName} ({wg.wardType}) — {wg.availableCount} available
                          </SelectItem>
                        ))}
                        {wardGroups.length === 0 && (
                          <SelectItem value="_loading" disabled>
                            {availableBedsQuery.isLoading ? 'Loading...' : 'No wards found'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bed */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Bed <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.bedId}
                      onValueChange={(v) => updateForm('bedId', v)}
                      disabled={!form.wardId || filteredBeds.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.wardId ? (filteredBeds.length === 0 ? 'No available beds' : 'Select Bed') : 'Select ward first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBeds.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.bedNumber} ({b.bedType}) — ₹{b.dailyRate}/day
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Attending Doctor */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Attending Doctor <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.attendingDoctorId}
                      onValueChange={(v) => updateForm('attendingDoctorId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Group by department */}
                        {(() => {
                          const grouped: Record<string, Doctor[]> = {}
                          doctors.forEach((d) => {
                            if (!grouped[d.departmentName]) grouped[d.departmentName] = []
                            grouped[d.departmentName].push(d)
                          })
                          return Object.entries(grouped).map(([deptName, docs]) => (
                            <div key={deptName}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                {deptName}
                              </div>
                              {docs.map((d) => (
                                <SelectItem key={d.doctorId} value={d.doctorId}>
                                  {d.name} {d.specialization ? `(${d.specialization})` : ''} {d.designation ? `— ${d.designation}` : ''}
                                </SelectItem>
                              ))}
                            </div>
                          ))
                        })()}
                        {doctors.length === 0 && (
                          <SelectItem value="_loading" disabled>
                            {doctorsQuery.isLoading ? 'Loading...' : 'No doctors found'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Section 2: Patient Information ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    2
                  </div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <HeartPulse className="size-4 text-amber-600" />
                    Patient Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Patient Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Full name"
                      value={form.patientName}
                      onChange={(e) => updateForm('patientName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Age <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="Age in years"
                      value={form.patientAge}
                      onChange={(e) => updateForm('patientAge', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.patientGender}
                      onValueChange={(v) => updateForm('patientGender', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Blood Group</Label>
                    <Select
                      value={form.bloodGroup}
                      onValueChange={(v) => updateForm('bloodGroup', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Marital Status</Label>
                    <Select
                      value={form.maritalStatus}
                      onValueChange={(v) => updateForm('maritalStatus', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Mobile No</Label>
                    <Input
                      placeholder="Mobile number"
                      value={form.mobileNo}
                      onChange={(e) => updateForm('mobileNo', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-sm font-medium">Aadhar No</Label>
                    <Input
                      placeholder="Aadhar card number"
                      value={form.aadharNo}
                      onChange={(e) => updateForm('aadharNo', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Section 3: Family & Emergency Contact ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
                    3
                  </div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Users className="size-4 text-rose-600" />
                    Family & Emergency Contact
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Father&apos;s Name</Label>
                    <Input
                      placeholder="Father's name"
                      value={form.fatherName}
                      onChange={(e) => updateForm('fatherName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Mother&apos;s Name</Label>
                    <Input
                      placeholder="Mother's name"
                      value={form.motherName}
                      onChange={(e) => updateForm('motherName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Husband/Wife Name</Label>
                    <Input
                      placeholder="Husband/Wife name"
                      value={form.husbandWifeName}
                      onChange={(e) => updateForm('husbandWifeName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Contact Person Name</Label>
                    <Input
                      placeholder="Emergency contact name"
                      value={form.contactPersonName}
                      onChange={(e) => updateForm('contactPersonName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Contact Person Mobile</Label>
                    <Input
                      placeholder="Emergency contact mobile"
                      value={form.contactPersonMobile}
                      onChange={(e) => updateForm('contactPersonMobile', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Relation</Label>
                    <Input
                      placeholder="Relation to patient"
                      value={form.contactPersonRelation}
                      onChange={(e) => updateForm('contactPersonRelation', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Section 4: Address ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-bold">
                    4
                  </div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="size-4 text-sky-600" />
                    Address
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-sm font-medium">Address</Label>
                    <Textarea
                      placeholder="Full address"
                      value={form.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Village</Label>
                    <Input
                      placeholder="Village"
                      value={form.village}
                      onChange={(e) => updateForm('village', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Taluka</Label>
                    <Input
                      placeholder="Taluka"
                      value={form.taluka}
                      onChange={(e) => updateForm('taluka', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">District</Label>
                    <Input
                      placeholder="District"
                      value={form.district}
                      onChange={(e) => updateForm('district', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">State</Label>
                    <Input
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => updateForm('state', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Pin Code</Label>
                    <Input
                      placeholder="Pin code"
                      value={form.pinCode}
                      onChange={(e) => updateForm('pinCode', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Section 5: Medical Information ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold">
                    5
                  </div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <FileText className="size-4 text-violet-600" />
                    Medical Information
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* MLC Case checkbox */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="mlcCase"
                      checked={form.mlcCase}
                      onCheckedChange={(checked) => updateForm('mlcCase', !!checked)}
                    />
                    <div>
                      <Label htmlFor="mlcCase" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <ShieldCheck className="size-4 text-red-500" />
                        MLC Case (Medico-Legal Case)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mark if this admission is related to a medico-legal case
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Previous Hospitalization</Label>
                      <Textarea
                        placeholder="Details of previous hospitalizations (if any)"
                        value={form.previousHospitalization}
                        onChange={(e) => updateForm('previousHospitalization', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Medi-claim Details</Label>
                      <Textarea
                        placeholder="Insurance / Medi-claim details"
                        value={form.mediClaimDetails}
                        onChange={(e) => updateForm('mediClaimDetails', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Initial Diagnosis</Label>
                    <Textarea
                      placeholder="Provisional / initial diagnosis"
                      value={form.initialDiagnosis}
                      onChange={(e) => updateForm('initialDiagnosis', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </section>

              {/* ── Submit ── */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdmitDialog(false)}
                  className="gap-2"
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAdmit}
                  disabled={admitMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 min-w-[160px]"
                >
                  {admitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Admitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Admit Patient
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}
