'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Stethoscope,
  GraduationCap,
  Sun,
  Moon,
  CloudSun,
  RotateCw,
  Phone,
  UserCheck,
  Building2,
  ShieldCheck,
  Users,
  ChevronDown,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface NurseItem {
  id: string
  userId: string
  hospitalId: string
  hospitalName: string
  wardId: string | null
  wardName: string
  employeeId: string
  qualification: string
  designation: string
  shift: string
  phoneNo: string
  address: string
  assignmentCount: number
  user: {
    id: string
    name: string
    email: string
    gender: string
    status: string
    mobileNo: string
  }
  createdAt: string
  updatedAt: string
}

interface HospitalOption {
  id: string
  hospitalName: string
}

interface WardOption {
  id: string
  name: string
}

// ─── Shift badge color helper ────────────────────────────────────────────

function getShiftColor(shift: string) {
  switch (shift) {
    case 'Morning':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Evening':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'Night':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Rotating':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function getShiftIcon(shift: string) {
  switch (shift) {
    case 'Morning':
      return <Sun className="h-3 w-3" />
    case 'Evening':
      return <CloudSun className="h-3 w-3" />
    case 'Night':
      return <Moon className="h-3 w-3" />
    case 'Rotating':
      return <RotateCw className="h-3 w-3" />
    default:
      return null
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Block':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function NursesClient() {
  const queryClient = useQueryClient()

  // Filter states
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('')
  const [selectedWardId, setSelectedWardId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedNurse, setSelectedNurse] = useState<NurseItem | null>(null)

  // Form states
  const [formHospitalId, setFormHospitalId] = useState<string>('')
  const [formWardId, setFormWardId] = useState<string>('')
  const [formName, setFormName] = useState<string>('')
  const [formEmail, setFormEmail] = useState<string>('')
  const [formEmployeeId, setFormEmployeeId] = useState<string>('')
  const [formQualification, setFormQualification] = useState<string>('GNM')
  const [formDesignation, setFormDesignation] = useState<string>('Staff Nurse')
  const [formShift, setFormShift] = useState<string>('Morning')
  const [formPhoneNo, setFormPhoneNo] = useState<string>('')
  const [formAddress, setFormAddress] = useState<string>('')

  // ─── Queries ──────────────────────────────────────────────────────────

  const { data: hospitalsData } = useQuery<HospitalOption[]>({
    queryKey: ['admin-hospitals-list'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin/hospitals')
      const data = await res.json()
      return data.hospitals || []
    },
  })

  const { data: wardsData } = useQuery<WardOption[]>({
    queryKey: ['admin-wards-list', selectedHospitalId],
    queryFn: async () => {
      if (!selectedHospitalId) return []
      const res = await fetch(`/api/dashboard/admin/wards?hospitalId=${selectedHospitalId}`)
      const data = await res.json()
      return data.wards || []
    },
    enabled: !!selectedHospitalId,
  })

  // Wards for form (when adding/editing)
  const { data: formWardsData } = useQuery<WardOption[]>({
    queryKey: ['admin-wards-form', formHospitalId],
    queryFn: async () => {
      if (!formHospitalId) return []
      const res = await fetch(`/api/dashboard/admin/wards?hospitalId=${formHospitalId}`)
      const data = await res.json()
      return data.wards || []
    },
    enabled: !!formHospitalId,
  })

  const { data: nursesData, isLoading: nursesLoading } = useQuery<{ nurses: NurseItem[]; total: number }>({
    queryKey: ['admin-nurses', selectedHospitalId, selectedWardId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedHospitalId) params.set('hospitalId', selectedHospitalId)
      if (selectedWardId) params.set('wardId', selectedWardId)
      const res = await fetch(`/api/dashboard/admin/nurses?${params.toString()}`)
      const data = await res.json()
      return data
    },
  })

  // ─── Mutations ───────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const res = await fetch('/api/dashboard/admin/nurses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create nurse')
      return data.nurse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nurses'] })
      toast.success('Nurse created successfully')
      closeAddDialog()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, string> }) => {
      const res = await fetch(`/api/dashboard/admin/nurses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update nurse')
      return data.nurse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nurses'] })
      toast.success('Nurse updated successfully')
      closeEditDialog()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/admin/nurses/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete nurse')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nurses'] })
      toast.success('Nurse deleted successfully')
      setIsDeleteOpen(false)
      setSelectedNurse(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // ─── Filtered nurses ──────────────────────────────────────────────────

  const nursesList = nursesData?.nurses ?? []

  const filteredNurses = useMemo(() => {
    if (!nursesList.length) return []
    if (!searchQuery) return nursesList
    const q = searchQuery.toLowerCase()
    return nursesList.filter(
      (n) =>
        n.user.name.toLowerCase().includes(q) ||
        n.employeeId.toLowerCase().includes(q) ||
        n.qualification.toLowerCase().includes(q) ||
        n.designation.toLowerCase().includes(q) ||
        n.wardName.toLowerCase().includes(q) ||
        n.phoneNo.toLowerCase().includes(q)
    )
  }, [nursesList, searchQuery])

  // ─── Form Handlers ──────────────────────────────────────────────────

  function openAddDialog() {
    setFormHospitalId(selectedHospitalId)
    setFormWardId(selectedWardId)
    setFormName('')
    setFormEmail('')
    setFormEmployeeId('')
    setFormQualification('GNM')
    setFormDesignation('Staff Nurse')
    setFormShift('Morning')
    setFormPhoneNo('')
    setFormAddress('')
    setIsAddOpen(true)
  }

  function closeAddDialog() {
    setIsAddOpen(false)
    setFormHospitalId('')
    setFormWardId('')
    setFormName('')
    setFormEmail('')
    setFormEmployeeId('')
    setFormQualification('GNM')
    setFormDesignation('Staff Nurse')
    setFormShift('Morning')
    setFormPhoneNo('')
    setFormAddress('')
  }

  function openEditDialog(nurse: NurseItem) {
    setSelectedNurse(nurse)
    setFormHospitalId(nurse.hospitalId)
    setFormWardId(nurse.wardId || '')
    setFormName(nurse.user.name)
    setFormEmail(nurse.user.email)
    setFormEmployeeId(nurse.employeeId)
    setFormQualification(nurse.qualification)
    setFormDesignation(nurse.designation)
    setFormShift(nurse.shift)
    setFormPhoneNo(nurse.phoneNo)
    setFormAddress(nurse.address)
    setIsEditOpen(true)
  }

  function closeEditDialog() {
    setIsEditOpen(false)
    setSelectedNurse(null)
  }

  function handleAdd() {
    if (!formHospitalId || !formName || !formEmail || !formEmployeeId) {
      toast.error('Hospital, Name, Email, and Employee ID are required')
      return
    }
    createMutation.mutate({
      hospitalId: formHospitalId,
      wardId: formWardId || undefined,
      name: formName,
      email: formEmail,
      employeeId: formEmployeeId,
      qualification: formQualification,
      designation: formDesignation,
      shift: formShift,
      phoneNo: formPhoneNo,
      address: formAddress,
    })
  }

  function handleEdit() {
    if (!selectedNurse || !formName || !formEmployeeId) {
      toast.error('Name and Employee ID are required')
      return
    }
    updateMutation.mutate({
      id: selectedNurse.id,
      payload: {
        wardId: formWardId || '',
        name: formName,
        employeeId: formEmployeeId,
        qualification: formQualification,
        designation: formDesignation,
        shift: formShift,
        phoneNo: formPhoneNo,
        address: formAddress,
      },
    })
  }

  function handleDelete() {
    if (!selectedNurse) return
    deleteMutation.mutate(selectedNurse.id)
  }

  // ─── Stat cards data ──────────────────────────────────────────────────

  const stats = useMemo(() => {
    const nurses = nursesData?.nurses || []
    const total = nurses.length
    const active = nurses.filter((n) => n.user.status === 'Active').length
    const morning = nurses.filter((n) => n.shift === 'Morning').length
    const rotating = nurses.filter((n) => n.shift === 'Rotating').length
    return { total, active, morning, rotating }
  }, [nursesData?.nurses])

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-teal-600" />
            Staff Nurses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage nursing staff across hospitals and wards
          </p>
        </div>
        <Button onClick={openAddDialog} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Nurse
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-xs">
          <Select
            value={selectedHospitalId}
            onValueChange={(val) => {
              setSelectedHospitalId(val === 'all' ? '' : val)
              setSelectedWardId('')
            }}
          >
            <SelectTrigger className="w-full">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Hospitals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hospitals</SelectItem>
              {hospitalsData?.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.hospitalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <Select
            value={selectedWardId || 'all'}
            onValueChange={(val) => setSelectedWardId(val === 'all' ? '' : val)}
            disabled={!selectedHospitalId}
          >
            <SelectTrigger className="w-full">
              <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wardsData?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nurses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <Users className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Nurses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Sun className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.morning}</p>
                  <p className="text-xs text-muted-foreground">Morning Shift</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <RotateCw className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rotating}</p>
                  <p className="text-xs text-muted-foreground">Rotating Shift</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Nurses Table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            Nursing Staff
            {nursesData && (
              <Badge variant="outline" className="ml-2 font-normal text-xs">
                {nursesData.total} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nursesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredNurses.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground font-medium">No nurses found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Add nurses using the button above'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="w-[100px]">Emp. ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Qualification</TableHead>
                    <TableHead className="hidden lg:table-cell">Designation</TableHead>
                    <TableHead className="hidden sm:table-cell">Ward</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredNurses.map((nurse, index) => (
                      <motion.tr
                        key={nurse.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs">{nurse.employeeId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{nurse.user.name}</p>
                            <p className="text-xs text-muted-foreground">{nurse.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs font-normal">
                            {nurse.qualification}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {nurse.designation}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {nurse.wardName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs gap-1 ${getShiftColor(nurse.shift)}`}
                          >
                            {getShiftIcon(nurse.shift)}
                            {nurse.shift}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {nurse.phoneNo || '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(nurse.user.status)}`}
                          >
                            {nurse.user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(nurse)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedNurse(nurse)
                                  setIsDeleteOpen(true)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add Nurse Dialog ─────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Add New Nurse
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-hospital">Hospital *</Label>
                <Select value={formHospitalId} onValueChange={(val) => { setFormHospitalId(val); setFormWardId('') }}>
                  <SelectTrigger id="add-hospital">
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalsData?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.hospitalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-ward">Ward</Label>
                <Select value={formWardId || 'unassigned'} onValueChange={(val) => setFormWardId(val === 'unassigned' ? '' : val)}>
                  <SelectTrigger id="add-ward">
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {formWardsData?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name *</Label>
                <Input
                  id="add-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nurse full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nurse@hospital.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-employeeId">Employee ID *</Label>
                <Input
                  id="add-employeeId"
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  placeholder="NUR-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone Number</Label>
                <Input
                  id="add-phone"
                  value={formPhoneNo}
                  onChange={(e) => setFormPhoneNo(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-qualification">Qualification</Label>
                <Select value={formQualification} onValueChange={setFormQualification}>
                  <SelectTrigger id="add-qualification">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GNM">GNM</SelectItem>
                    <SelectItem value="BSc Nursing">BSc Nursing</SelectItem>
                    <SelectItem value="ANM">ANM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-designation">Designation</Label>
                <Select value={formDesignation} onValueChange={setFormDesignation}>
                  <SelectTrigger id="add-designation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff Nurse">Staff Nurse</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                    <SelectItem value="Nursing Incharge">Nursing Incharge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-shift">Shift</Label>
                <Select value={formShift} onValueChange={setFormShift}>
                  <SelectTrigger id="add-shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Rotating">Rotating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Textarea
                id="add-address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Nurse address"
                rows={2}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Default password will be set to &quot;nurse123&quot;.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Nurse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Nurse Dialog ────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-teal-600" />
              Edit Nurse
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hospital">Hospital</Label>
                <Select value={formHospitalId} disabled>
                  <SelectTrigger id="edit-hospital">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalsData?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.hospitalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ward">Ward</Label>
                <Select value={formWardId || 'unassigned'} onValueChange={(val) => setFormWardId(val === 'unassigned' ? '' : val)}>
                  <SelectTrigger id="edit-ward">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {formWardsData?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nurse full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={formEmail}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employeeId">Employee ID *</Label>
                <Input
                  id="edit-employeeId"
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  placeholder="NUR-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formPhoneNo}
                  onChange={(e) => setFormPhoneNo(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-qualification">Qualification</Label>
                <Select value={formQualification} onValueChange={setFormQualification}>
                  <SelectTrigger id="edit-qualification">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GNM">GNM</SelectItem>
                    <SelectItem value="BSc Nursing">BSc Nursing</SelectItem>
                    <SelectItem value="ANM">ANM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-designation">Designation</Label>
                <Select value={formDesignation} onValueChange={setFormDesignation}>
                  <SelectTrigger id="edit-designation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff Nurse">Staff Nurse</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                    <SelectItem value="Nursing Incharge">Nursing Incharge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-shift">Shift</Label>
                <Select value={formShift} onValueChange={setFormShift}>
                  <SelectTrigger id="edit-shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Rotating">Rotating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Nurse address"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Nurse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedNurse?.user.name}</strong> (
              {selectedNurse?.employeeId})? This action will permanently remove the nurse record
              and associated user account. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
