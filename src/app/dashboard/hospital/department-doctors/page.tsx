'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Star,
  Clock,
  ArrowUpDown,
  Filter,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- Types ---
interface DoctorLink {
  id: string
  doctorId: string
  departmentId: string
  designation: string
  fees: number
  opdTimings: string
  isAvailable: boolean
  status: string
  createdAt: string
  doctor: {
    id: string
    name: string
    email: string
    profileImg: string | null
    specialization: string
    userStatus: string
    avgRating: number
    totalRatings: number
  }
  department: {
    id: string
    name: string
    icon: string
  }
}

interface Department {
  id: string
  name: string
  doctorCount: number
}

interface DoctorSearchResult {
  id: string          // Doctor.id
  userId: string      // User.id
  name: string
  profileImg: string | null
  email: string
  specialization: string
}

// --- Animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

const DESIGNATION_COLORS: Record<string, string> = {
  HOD: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
  Director: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Professor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
  Senior: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Consultant: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  Junior: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400',
  Resident: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400',
}

function getDesignationColor(designation: string): string {
  if (!designation) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  for (const [key, color] of Object.entries(DESIGNATION_COLORS)) {
    if (designation.toLowerCase().includes(key.toLowerCase())) return color
  }
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

// --- Main Component ---
export default function DepartmentDoctorsPage() {
  const queryClient = useQueryClient()

  // State
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<DoctorLink | null>(null)
  const [filterDept, setFilterDept] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('department')
  const [searchDoctor, setSearchDoctor] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')

  // Add form state
  const [addForm, setAddForm] = useState({
    doctorId: '',
    departmentId: '',
    designation: '',
    fees: '',
    opdTimings: '',
  })
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSearchResult | null>(null)

  // Edit form state
  const [editForm, setEditForm] = useState({
    designation: '',
    fees: '',
    opdTimings: '',
    isAvailable: true,
  })

  // Debounce doctor search
  useMemo(() => {
    const timer = setTimeout(() => setSearchDebounce(searchDoctor), 350)
    return () => clearTimeout(timer)
  }, [searchDoctor])

  // --- Queries ---
  const { data: linksData, isLoading: linksLoading } = useQuery<{ doctorLinks: DoctorLink[] }>({
    queryKey: ['hospital-doctor-links', filterDept],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterDept !== 'all') params.set('departmentId', filterDept)
      return fetch(`/api/dashboard/hospital/doctor-links?${params}`).then((r) => r.json())
    },
  })

  const { data: deptsData } = useQuery<{ departments: Department[] }>({
    queryKey: ['hospital-departments'],
    queryFn: () => fetch('/api/dashboard/hospital/departments').then((r) => r.json()),
  })

  const { data: searchResults, isFetching: searchFetching } = useQuery<{
    doctors: DoctorSearchResult[]
  }>({
    queryKey: ['hospital-doctor-search', searchDebounce],
    queryFn: () =>
      fetch(`/api/dashboard/hospital/search-doctors?search=${encodeURIComponent(searchDebounce)}`).then((r) => r.json()),
    enabled: searchDebounce.length >= 2,
  })

  const doctorLinks = linksData?.doctorLinks || []
  const departments = deptsData?.departments || []

  // --- Sorted & Filtered ---
  const filteredLinks = useMemo(() => {
    let sorted = [...doctorLinks]
    if (sortBy === 'department') {
      sorted.sort((a, b) => a.department.name.localeCompare(b.department.name))
    } else if (sortBy === 'fees-asc') {
      sorted.sort((a, b) => a.fees - b.fees)
    } else if (sortBy === 'fees-desc') {
      sorted.sort((a, b) => b.fees - a.fees)
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.doctor.name.localeCompare(b.doctor.name))
    }
    return sorted
  }, [doctorLinks, sortBy])

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (payload: { doctorId: string; departmentId: string; designation: string; fees: number; opdTimings: string }) =>
      fetch('/api/dashboard/hospital/doctor-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-doctor-links'] })
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      toast.success('Doctor linked to department successfully')
      closeAddDialog()
    },
    onError: (err: { error?: string }) => {
 toast.error(err.error || 'Failed to link doctor')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { designation: string; fees: number; opdTimings: string; isAvailable: boolean } }) =>
      fetch(`/api/dashboard/hospital/doctor-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-doctor-links'] })
      toast.success('Doctor link updated successfully')
      closeEditDialog()
    },
    onError: () => {
      toast.error('Failed to update doctor link')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/hospital/doctor-links/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-doctor-links'] })
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      toast.success('Doctor unlinked successfully')
      setDeleteDialogOpen(false)
      setSelectedLink(null)
    },
    onError: () => {
      toast.error('Failed to unlink doctor')
    },
  })

  const toggleAvailableMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetch(`/api/dashboard/hospital/doctor-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-doctor-links'] })
      toast.success('Availability updated')
    },
  })

  // --- Handlers ---
  const closeAddDialog = useCallback(() => {
    setAddDialogOpen(false)
    setAddForm({ doctorId: '', departmentId: '', designation: '', fees: '', opdTimings: '' })
    setSelectedDoctor(null)
    setSearchDoctor('')
    setSearchDebounce('')
  }, [])

  const closeEditDialog = useCallback(() => {
    setEditDialogOpen(false)
    setSelectedLink(null)
  }, [])

  function openAddDialog() {
    setAddDialogOpen(true)
  }

  function openEditDialog(link: DoctorLink) {
    setSelectedLink(link)
    setEditForm({
      designation: link.designation,
      fees: String(link.fees),
      opdTimings: link.opdTimings,
      isAvailable: link.isAvailable,
    })
    setEditDialogOpen(true)
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.doctorId || !addForm.departmentId) {
      toast.error('Please select a doctor and department')
      return
    }
    createMutation.mutate({
      doctorId: addForm.doctorId,
      departmentId: addForm.departmentId,
      designation: addForm.designation,
      fees: Number(addForm.fees) || 0,
      opdTimings: addForm.opdTimings,
    })
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLink) return
    updateMutation.mutate({
      id: selectedLink.id,
      payload: {
        designation: editForm.designation,
        fees: Number(editForm.fees) || 0,
        opdTimings: editForm.opdTimings,
        isAvailable: editForm.isAvailable,
      },
    })
  }

  function selectSearchDoctor(doc: DoctorSearchResult) {
    // Need to get the Doctor.id (not User.id). The doctors API returns User records.
    // The DoctorHospital.doctorId references Doctor.id, not User.id.
    // We need to find the doctor record by userId. Let's use the user id to look up doctor.
    setSelectedDoctor(doc)
    setAddForm((f) => ({ ...f, doctorId: doc.id }))
    setSearchDoctor(doc.name)
    setSearchDebounce('')
  }

  const isAdding = createMutation.isPending
  const isUpdating = updateMutation.isPending

  // --- Loading ---
  if (linksLoading) {
    return <DepartmentDoctorsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Doctors</h1>
          <p className="text-sm text-muted-foreground">
            Link doctors to departments and manage their OPD settings
          </p>
        </div>
        <Button onClick={openAddDialog} className="shrink-0 bg-teal-600 hover:bg-teal-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {/* Filters & Sort */}
      {doctorLinks.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="name">Doctor Name</SelectItem>
                <SelectItem value="fees-asc">Fees: Low → High</SelectItem>
                <SelectItem value="fees-desc">Fees: High → Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {doctorLinks.length === 0 && !linksLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
            <UserPlus className="h-8 w-8 text-teal-500" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No doctors linked yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Add doctors to your departments to start managing OPD schedules and consultations.
          </p>
          <Button onClick={openAddDialog} className="bg-teal-600 hover:bg-teal-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </motion.div>
      )}

      {/* Doctor Links List */}
      {filteredLinks.length > 0 && (
        <motion.div
          className="grid gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredLinks.map((link) => (
            <motion.div key={link.id} variants={itemVariants}>
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Doctor info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={link.doctor.profileImg || ''} />
                        <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {link.doctor.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{link.doctor.name}</p>
                          {link.designation && (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                getDesignationColor(link.designation)
                              )}
                            >
                              {link.designation}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
                            {link.department.name}
                          </Badge>
                          {link.doctor.specialization && (
                            <span>{link.doctor.specialization}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Fees, timings, actions */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex flex-col items-end gap-1 text-right">
                        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                          ₹{link.fees.toLocaleString('en-IN')}
                        </p>
                        {link.opdTimings && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {link.opdTimings}
                          </span>
                        )}
                        {link.doctor.avgRating > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {link.doctor.avgRating} ({link.doctor.totalRatings})
                          </span>
                        )}
                      </div>

                      {/* Availability toggle */}
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={link.isAvailable}
                          onCheckedChange={(checked) =>
                            toggleAvailableMutation.mutate({ id: link.id, isAvailable: checked })
                          }
                          className="data-[state=checked]:bg-teal-500"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {link.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(link)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLink(link)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Unlink Doctor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Doctor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) closeAddDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Doctor to Department</DialogTitle>
            <DialogDescription>
              Search for a doctor and assign them to a department.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {/* Doctor search */}
            <div className="space-y-2">
              <Label htmlFor="search-doctor">Doctor *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-doctor"
                  className="pl-9"
                  placeholder="Search doctor by name..."
                  value={searchDoctor}
                  onChange={(e) => {
                    setSearchDoctor(e.target.value)
                    if (selectedDoctor) {
                      setSelectedDoctor(null)
                      setAddForm((f) => ({ ...f, doctorId: '' }))
                    }
                  }}
                />
              </div>
              {/* Search results dropdown */}
              <AnimatePresence>
                {searchDebounce.length >= 2 && searchResults && !selectedDoctor && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
                  >
                    {searchFetching && (
                      <div className="p-3 text-center text-sm text-muted-foreground">Searching...</div>
                    )}
                    {!searchFetching && searchResults.doctors.length === 0 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">No doctors found</div>
                    )}
                    {searchResults?.doctors.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        onClick={() => selectSearchDoctor(doc)}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={doc.profileImg || ''} />
                          <AvatarFallback className="text-[10px] bg-teal-100 dark:bg-teal-900">
                            {doc.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{doc.name}</p>
                          <span className="truncate text-xs text-muted-foreground">{doc.specialization}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {selectedDoctor && (
                <div className="flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 dark:border-teal-800 dark:bg-teal-900/30">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={selectedDoctor.profileImg || ''} />
                    <AvatarFallback className="text-[10px] bg-teal-100 dark:bg-teal-900">
                      {selectedDoctor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium">{selectedDoctor.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setSelectedDoctor(null)
                      setSearchDoctor('')
                      setAddForm((f) => ({ ...f, doctorId: '' }))
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>

            {/* Department select */}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={addForm.departmentId}
                onValueChange={(v) => setAddForm((f) => ({ ...f, departmentId: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.doctorCount} doctors)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label htmlFor="add-designation">Designation</Label>
              <Input
                id="add-designation"
                placeholder="e.g. Senior Consultant, HOD"
                value={addForm.designation}
                onChange={(e) => setAddForm((f) => ({ ...f, designation: e.target.value }))}
              />
            </div>

            {/* Fees */}
            <div className="space-y-2">
              <Label htmlFor="add-fees">Consultation Fees (₹)</Label>
              <Input
                id="add-fees"
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={addForm.fees}
                onChange={(e) => setAddForm((f) => ({ ...f, fees: e.target.value }))}
              />
            </div>

            {/* OPD Timings */}
            <div className="space-y-2">
              <Label htmlFor="add-opd">OPD Timings</Label>
              <Input
                id="add-opd"
                placeholder="e.g. Mon/Wed/Fri 10:00-1:00"
                value={addForm.opdTimings}
                onChange={(e) => setAddForm((f) => ({ ...f, opdTimings: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeAddDialog} disabled={isAdding}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isAdding}>
                {isAdding ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Linking...
                  </span>
                ) : (
                  'Link Doctor'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) closeEditDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Doctor Link</DialogTitle>
            <DialogDescription>
              Update consultation details for {selectedLink?.doctor.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedLink?.doctor.profileImg || ''} />
                <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                  {selectedLink?.doctor.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{selectedLink?.doctor.name}</p>
                <p className="text-xs text-muted-foreground">{selectedLink?.department.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-designation">Designation</Label>
              <Input
                id="edit-designation"
                placeholder="e.g. Senior Consultant, HOD"
                value={editForm.designation}
                onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fees">Consultation Fees (₹)</Label>
              <Input
                id="edit-fees"
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={editForm.fees}
                onChange={(e) => setEditForm((f) => ({ ...f, fees: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-opd">OPD Timings</Label>
              <Input
                id="edit-opd"
                placeholder="e.g. Mon/Wed/Fri 10:00-1:00"
                value={editForm.opdTimings}
                onChange={(e) => setEditForm((f) => ({ ...f, opdTimings: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Available for Consultation</Label>
                <p className="text-xs text-muted-foreground">Patients can book appointments</p>
              </div>
              <Switch
                checked={editForm.isAvailable}
                onCheckedChange={(checked) => setEditForm((f) => ({ ...f, isAvailable: checked }))}
                className="data-[state=checked]:bg-teal-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeEditDialog} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isUpdating}>
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete/Unlink Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink {selectedLink?.doctor.name} from {selectedLink?.department.name}? The doctor will no longer appear in this department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedLink && deleteMutation.mutate(selectedLink.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? 'Unlinking...' : 'Unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- Skeleton ---
function DepartmentDoctorsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[160px]" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
