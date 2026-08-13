'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  BedDouble,
  Building2,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Bed,
  DollarSign,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Types ──────────────────────────────────────────────────────────────

interface WardItem {
  id: string
  hospitalId: string
  hospitalName: string
  name: string
  nameHi: string
  wardType: string
  floorNo: string
  totalBeds: number
  nurseRatio: number
  status: string
  bedCounts: {
    total: number
    occupied: number
    available: number
    reserved: number
    maintenance: number
  }
  nurseCount: number
  activeAdmissionCount: number
  createdAt: string
  updatedAt: string
}

interface WardDetail extends Omit<WardItem, 'bedCounts'> {
  bedCounts: {
    total: number
    occupied: number
    available: number
  }
  beds: BedItem[]
}

interface BedItem {
  id: string
  wardId: string
  bedNumber: string
  bedType: string
  dailyRate: number
  status: string
  admission: {
    id: string
    patientName: string
    admissionNo: string
    status: string
  } | null
  createdAt: string
  updatedAt: string
}

interface HospitalOption {
  id: string
  hospitalName: string
  city: string
}

const WARD_TYPES = ['ICU', 'General', 'Private', 'SemiPrivate', 'PostOp', 'Emergency', 'Maternity'] as const
const BED_TYPES = ['General', 'SemiPrivate', 'Private', 'ICU_Ventilator', 'ICU_NonVentilator'] as const
const BED_STATUSES = ['Available', 'Occupied', 'Reserved', 'Maintenance'] as const
const WARD_STATUSES = ['Active', 'Inactive', 'Maintenance'] as const

// ─── Helpers ────────────────────────────────────────────────────────────

const WARD_TYPE_COLORS: Record<string, string> = {
  ICU: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  General: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Private: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  SemiPrivate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  PostOp: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  Emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  Maternity: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
}

const BED_STATUS_COLORS: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Occupied: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  Reserved: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Maintenance: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const WARD_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Inactive: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
}

function formatBedType(t: string) {
  return t.replace(/_/g, ' ')
}

// ─── Component ──────────────────────────────────────────────────────────

export default function WardsClient() {
  const queryClient = useQueryClient()
  const [selectedHospital, setSelectedHospital] = useState<string>('all')

  // Dialogs
  const [viewWard, setViewWard] = useState<WardDetail | null>(null)
  const [wardDialog, setWardDialog] = useState<{ open: boolean; edit: WardItem | null }>({ open: false, edit: null })
  const [deleteWard, setDeleteWard] = useState<WardItem | null>(null)
  const [bedDialog, setBedDialog] = useState<{ open: boolean; edit: BedItem | null; wardId: string }>({ open: false, edit: null, wardId: '' })
  const [deleteBed, setDeleteBed] = useState<BedItem | null>(null)

  // Ward form
  const [wardForm, setWardForm] = useState({ hospitalId: '', name: '', nameHi: '', wardType: 'General', floorNo: '', totalBeds: '0', nurseRatio: '6' })
  // Bed form
  const [bedForm, setBedForm] = useState({ bedNumber: '', bedType: 'General', dailyRate: '' })

  // ─── Queries ──────────────────────────────────────────────────────

  const { data: hospitalsData } = useQuery<{ hospitals: HospitalOption[] }>({
    queryKey: ['admin-hospitals-list'],
    queryFn: () => fetch('/api/dashboard/admin/hospitals').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const hospitals = hospitalsData?.hospitals || []

  const { data: wardsData, isLoading } = useQuery<{ wards: WardItem[]; total: number }>({
    queryKey: ['admin-wards', selectedHospital],
    queryFn: () => {
      const params = selectedHospital !== 'all' ? `?hospitalId=${selectedHospital}` : ''
      return fetch(`/api/dashboard/admin/wards${params}`).then((r) => r.json())
    },
  })

  const wards = wardsData?.wards || []

  const { data: wardDetail, isLoading: isDetailLoading } = useQuery<{ ward: WardDetail }>({
    queryKey: ['admin-ward-detail', viewWard?.id],
    queryFn: () => fetch(`/api/dashboard/admin/wards/${viewWard!.id}`).then((r) => r.json()),
    enabled: !!viewWard?.id,
  })

  // When detail loads, update viewWard with full data
  const detailWard = wardDetail?.ward || viewWard

  // ─── Mutations ────────────────────────────────────────────────────

  const createWard = useMutation({
    mutationFn: (data: typeof wardForm) =>
      fetch('/api/dashboard/admin/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: data.hospitalId,
          name: data.name,
          nameHi: data.nameHi,
          wardType: data.wardType,
          floorNo: data.floorNo,
          totalBeds: parseInt(data.totalBeds) || 0,
          nurseRatio: parseInt(data.nurseRatio) || 6,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] })
      setWardDialog({ open: false, edit: null })
      toast.success('Ward created successfully')
    },
    onError: (err) => toast.error(err.message || 'Failed to create ward'),
  })

  const updateWard = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof wardForm> }) =>
      fetch(`/api/dashboard/admin/wards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.nameHi !== undefined && { nameHi: data.nameHi }),
          ...(data.wardType !== undefined && { wardType: data.wardType }),
          ...(data.floorNo !== undefined && { floorNo: data.floorNo }),
          ...(data.totalBeds !== undefined && { totalBeds: parseInt(data.totalBeds) || 0 }),
          ...(data.nurseRatio !== undefined && { nurseRatio: parseInt(data.nurseRatio) || 6 }),
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ward-detail'] })
      setWardDialog({ open: false, edit: null })
      toast.success('Ward updated successfully')
    },
    onError: (err) => toast.error(err.message || 'Failed to update ward'),
  })

  const deleteWardMut = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/admin/wards/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] })
      setDeleteWard(null)
      setViewWard(null)
      toast.success('Ward deleted successfully')
    },
    onError: (err) => toast.error(err.error || 'Failed to delete ward'),
  })

  const createBed = useMutation({
    mutationFn: ({ wardId, data }: { wardId: string; data: typeof bedForm }) =>
      fetch(`/api/dashboard/admin/wards/${wardId}/beds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedNumber: data.bedNumber,
          bedType: data.bedType,
          dailyRate: parseFloat(data.dailyRate) || 0,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ward-detail'] })
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] })
      setBedDialog({ open: false, edit: null, wardId: '' })
      toast.success('Bed added successfully')
    },
    onError: (err) => toast.error(err.error || 'Failed to add bed'),
  })

  const updateBed = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof bedForm> & { status?: string } }) =>
      fetch(`/api/dashboard/admin/wards/beds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ward-detail'] })
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] })
      setBedDialog({ open: false, edit: null, wardId: '' })
      toast.success('Bed updated successfully')
    },
    onError: (err) => toast.error(err.error || 'Failed to update bed'),
  })

  const deleteBedMut = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/admin/wards/beds/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ward-detail'] })
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] })
      setDeleteBed(null)
      toast.success('Bed deleted successfully')
    },
    onError: (err) => toast.error(err.error || 'Failed to delete bed'),
  })

  // ─── Handlers ─────────────────────────────────────────────────────

  const openCreateWard = () => {
    setWardForm({
      hospitalId: selectedHospital !== 'all' ? selectedHospital : (hospitals[0]?.id || ''),
      name: '',
      nameHi: '',
      wardType: 'General',
      floorNo: '',
      totalBeds: '0',
      nurseRatio: '6',
    })
    setWardDialog({ open: true, edit: null })
  }

  const openEditWard = (w: WardItem) => {
    setWardForm({
      hospitalId: w.hospitalId,
      name: w.name,
      nameHi: w.nameHi,
      wardType: w.wardType,
      floorNo: w.floorNo,
      totalBeds: String(w.totalBeds),
      nurseRatio: String(w.nurseRatio),
    })
    setWardDialog({ open: true, edit: w })
  }

  const openAddBed = (wardId: string) => {
    setBedForm({ bedNumber: '', bedType: 'General', dailyRate: '' })
    setBedDialog({ open: true, edit: null, wardId })
  }

  const openEditBed = (b: BedItem) => {
    setBedForm({ bedNumber: b.bedNumber, bedType: b.bedType, dailyRate: String(b.dailyRate) })
    setBedDialog({ open: true, edit: b, wardId: b.wardId })
  }

  const handleWardSubmit = () => {
    if (!wardForm.name.trim() || !wardForm.hospitalId) {
      toast.error('Hospital and ward name are required')
      return
    }
    if (wardDialog.edit) {
      updateWard.mutate({ id: wardDialog.edit.id, data: wardForm })
    } else {
      createWard.mutate(wardForm)
    }
  }

  const handleBedSubmit = () => {
    if (!bedForm.bedNumber.trim()) {
      toast.error('Bed number is required')
      return
    }
    if (bedDialog.edit) {
      updateBed.mutate({ id: bedDialog.edit.id, data: bedForm })
    } else {
      createBed.mutate({ wardId: bedDialog.wardId, data: bedForm })
    }
  }

  // ─── Computed stats ───────────────────────────────────────────────

  const totalBeds = wards.reduce((s, w) => s + (w.bedCounts?.total || 0), 0)
  const totalOccupied = wards.reduce((s, w) => s + (w.bedCounts?.occupied || 0), 0)
  const totalAvailable = wards.reduce((s, w) => s + (w.bedCounts?.available || 0), 0)
  const totalNurses = wards.reduce((s, w) => s + w.nurseCount, 0)

  return (
    <div className="space-y-6">
      {/* Header with hospital selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
              <BedDouble className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-lg font-semibold">Wards Management</h1>
          </div>
          <Select value={selectedHospital} onValueChange={setSelectedHospital}>
            <SelectTrigger className="w-full sm:w-56">
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Hospitals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hospitals</SelectItem>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.hospitalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateWard} className="gap-2 bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4" />
          Add Ward
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <BedDouble className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{wards.length}</p>
                <p className="text-xs text-muted-foreground">Total Wards</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <Bed className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBeds}</p>
                <p className="text-xs text-muted-foreground">Total Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  <span className="text-emerald-600">{totalAvailable}</span>
                  <span className="text-muted-foreground text-sm"> / {totalOccupied} occ.</span>
                </p>
                <p className="text-xs text-muted-foreground">Available / Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNurses}</p>
                <p className="text-xs text-muted-foreground">Nurses Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wards grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BedDouble className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No wards found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Create a ward to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {wards.map((ward, i) => (
              <motion.div
                key={ward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="group cursor-pointer transition-all hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800"
                  onClick={() => {
                    setViewWard(ward)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold">{ward.name}</h3>
                          <Badge variant="outline" className={WARD_STATUS_COLORS[ward.status] || ''}>
                            {ward.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{ward.hospitalName}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditWard(ward) }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); setDeleteWard(ward) }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className={WARD_TYPE_COLORS[ward.wardType] || ''}>{ward.wardType}</Badge>
                      {ward.floorNo && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {ward.floorNo}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-border/60 p-2.5">
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">{ward.bedCounts?.available || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Available</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">{ward.bedCounts?.occupied || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Occupied</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{ward.bedCounts?.total || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Total Beds</p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {ward.nurseCount} nurses
                      </span>
                      <span>1:{ward.nurseRatio} ratio</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Ward Detail Dialog ─────────────────────────────────────── */}
      <Dialog open={!!viewWard} onOpenChange={(open) => { if (!open) setViewWard(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-teal-600" />
              {detailWard?.name || 'Ward Details'}
              {detailWard?.wardType && (
                <Badge className={WARD_TYPE_COLORS[detailWard.wardType] || ''}>{detailWard.wardType}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="space-y-4 py-4">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="h-40 animate-pulse rounded bg-muted" />
            </div>
          ) : detailWard ? (
            <div className="space-y-5">
              {/* Ward info row */}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4" /> {detailWard.hospitalName}
                </span>
                {detailWard.floorNo && (
                  <span className="text-muted-foreground">Floor: {detailWard.floorNo}</span>
                )}
                <Badge variant="outline" className={WARD_STATUS_COLORS[detailWard.status] || ''}>
                  {detailWard.status}
                </Badge>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" /> {detailWard.nurseCount} nurses
                </span>
              </div>

              {/* Bed stats bar */}
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">Beds:</span>
                <span className="flex items-center gap-1 text-sm">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {detailWard.bedCounts?.available || 0} Available
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                  {detailWard.bedCounts?.occupied || 0} Occupied
                </span>
                <span className="text-sm text-muted-foreground">
                  / {detailWard.bedCounts?.total || 0} Total
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400"
                  onClick={() => openAddBed(detailWard.id)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Bed
                </Button>
              </div>

              {/* Beds table */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Bed #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Daily Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Patient</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailWard.beds?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center">
                          <Bed className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No beds configured</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 gap-1.5"
                            onClick={() => openAddBed(detailWard.id)}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add First Bed
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                    {detailWard.beds?.map((bed) => (
                      <TableRow key={bed.id}>
                        <TableCell className="font-medium">{bed.bedNumber}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{formatBedType(bed.bedType)}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            {bed.dailyRate > 0 ? bed.dailyRate.toLocaleString() : '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={BED_STATUS_COLORS[bed.status] || ''}>{bed.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {bed.admission ? (
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                              {bed.admission.patientName}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditBed(bed)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {bed.status === 'Available' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-700"
                                onClick={() => setDeleteBed(bed)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── Create/Edit Ward Dialog ────────────────────────────────── */}
      <Dialog open={wardDialog.open} onOpenChange={(open) => { if (!open) setWardDialog({ open: false, edit: null }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{wardDialog.edit ? 'Edit Ward' : 'Create New Ward'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select
                value={wardForm.hospitalId}
                onValueChange={(v) => setWardForm((f) => ({ ...f, hospitalId: v }))}
                disabled={!!wardDialog.edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.hospitalName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ward Name *</Label>
              <Input
                placeholder="e.g. ICU Ward, General Ward"
                value={wardForm.name}
                onChange={(e) => setWardForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ward Name (Hindi)</Label>
              <Input
                placeholder="हिंदी में नाम"
                value={wardForm.nameHi}
                onChange={(e) => setWardForm((f) => ({ ...f, nameHi: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ward Type</Label>
                <Select
                  value={wardForm.wardType}
                  onValueChange={(v) => setWardForm((f) => ({ ...f, wardType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WARD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input
                  placeholder="e.g. Floor 1"
                  value={wardForm.floorNo}
                  onChange={(e) => setWardForm((f) => ({ ...f, floorNo: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Beds</Label>
                <Input
                  type="number"
                  min="0"
                  value={wardForm.totalBeds}
                  onChange={(e) => setWardForm((f) => ({ ...f, totalBeds: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nurse Ratio (1:N)</Label>
                <Input
                  type="number"
                  min="1"
                  value={wardForm.nurseRatio}
                  onChange={(e) => setWardForm((f) => ({ ...f, nurseRatio: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWardDialog({ open: false, edit: null })}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleWardSubmit}
              disabled={createWard.isPending || updateWard.isPending}
            >
              {(createWard.isPending || updateWard.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {wardDialog.edit ? 'Update Ward' : 'Create Ward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Bed Dialog ────────────────────────────────────── */}
      <Dialog open={bedDialog.open} onOpenChange={(open) => { if (!open) setBedDialog({ open: false, edit: null, wardId: '' }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bedDialog.edit ? 'Edit Bed' : 'Add New Bed'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Bed Number *</Label>
              <Input
                placeholder="e.g. Bed 1, ICU-01, PR-201"
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm((f) => ({ ...f, bedNumber: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bed Type</Label>
                <Select
                  value={bedForm.bedType}
                  onValueChange={(v) => setBedForm((f) => ({ ...f, bedType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{formatBedType(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Daily Rate (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={bedForm.dailyRate}
                  onChange={(e) => setBedForm((f) => ({ ...f, dailyRate: e.target.value }))}
                />
              </div>
            </div>
            {bedDialog.edit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={bedDialog.edit.status}
                  onValueChange={(v) => {
                    updateBed.mutate({ id: bedDialog.edit!.id, data: { status: v } })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBedDialog({ open: false, edit: null, wardId: '' })}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleBedSubmit}
              disabled={createBed.isPending || updateBed.isPending}
            >
              {(createBed.isPending || updateBed.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bedDialog.edit ? 'Update Bed' : 'Add Bed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Ward Alert ──────────────────────────────────────── */}
      <AlertDialog open={!!deleteWard} onOpenChange={(open) => { if (!open) setDeleteWard(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Ward
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteWard?.name}</strong>? This will also delete all beds in this ward.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteWard.id && deleteWardMut.mutate(deleteWard.id)}
              disabled={deleteWardMut.isPending}
            >
              {deleteWardMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Ward
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Bed Alert ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteBed} onOpenChange={(open) => { if (!open) setDeleteBed(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Bed
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete bed <strong>{deleteBed?.bedNumber}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteBed?.id && deleteBedMut.mutate(deleteBed.id)}
              disabled={deleteBedMut.isPending}
            >
              {deleteBedMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Bed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
