'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  MapPin,
  Users,
  Building2,
  HeartPulse,
  Bone,
  Brain,
  Stethoscope,
  Eye,
  Baby,
  Ear,
  Scissors,
  Droplets,
  Pill,
  Scan,
  Heart,
  Activity,
  Syringe,
  Thermometer,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// --- Icon mapping ---
const ICON_MAP: Record<string, LucideIcon> = {
  HeartPulse,
  Bone,
  Brain,
  Stethoscope,
  Eye,
  Baby,
  Ear,
  Scissors,
  Droplets,
  Pill,
  Scan,
  Heart,
  Activity,
  Syringe,
  Thermometer,
  Zap,
}

const AVAILABLE_ICONS = Object.keys(ICON_MAP)

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Stethoscope
}

const ICON_BG_COLORS = [
  'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
  'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
  'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
  'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
]

// --- Types ---
interface Department {
  id: string
  name: string
  nameHi: string
  description: string
  icon: string
  floorNo: string
  opdRoom: string
  status: string
  sortOrder: number
  doctorCount: number
  createdAt: string
  updatedAt: string
}

interface DepartmentFormData {
  name: string
  nameHi: string
  description: string
  icon: string
  floorNo: string
  opdRoom: string
}

const EMPTY_FORM: DepartmentFormData = {
  name: '',
  nameHi: '',
  description: '',
  icon: 'Stethoscope',
  floorNo: '',
  opdRoom: '',
}

function renderIcon(iconName: string, className: string) {
  const Icon = getIcon(iconName)
  return <Icon className={className} />
}

// --- Animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

// --- Main Component ---
export default function DepartmentsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [form, setForm] = useState<DepartmentFormData>(EMPTY_FORM)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  // --- Queries & Mutations ---
  const { data, isLoading } = useQuery<{ departments: Department[] }>({
    queryKey: ['hospital-departments'],
    queryFn: () => fetch('/api/dashboard/hospital/departments').then((r) => r.json()),
  })

  const departments = data?.departments || []

  const createMutation = useMutation({
    mutationFn: (payload: DepartmentFormData) =>
      fetch('/api/dashboard/hospital/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      toast.success('Department created successfully')
      closeDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to create department')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DepartmentFormData & { status: string }> }) =>
      fetch(`/api/dashboard/hospital/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      toast.success('Department updated successfully')
      closeDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to update department')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/hospital/departments/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      toast.success('Department deleted successfully')
      setDeleteDialogOpen(false)
      setDeletingDept(null)
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to delete department')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/dashboard/hospital/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      toast.success('Department status updated')
    },
  })

  // --- Handlers ---
  function openCreateDialog() {
    setEditingDept(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(dept: Department) {
    setEditingDept(dept)
    setForm({
      name: dept.name,
      nameHi: dept.nameHi,
      description: dept.description,
      icon: dept.icon,
      floorNo: dept.floorNo,
      opdRoom: dept.opdRoom,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingDept(null)
    setForm(EMPTY_FORM)
    setIconPickerOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Department name is required')
      return
    }
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, payload: form })
    } else {
      createMutation.mutate(form)
    }
  }

  function handleDelete(dept: Department) {
    setDeletingDept(dept)
    setDeleteDialogOpen(true)
  }

  function confirmDelete() {
    if (deletingDept) {
      deleteMutation.mutate(deletingDept.id)
    }
  }

  function toggleStatus(dept: Department) {
    const newStatus = dept.status === 'Active' ? 'Inactive' : 'Active'
    toggleStatusMutation.mutate({ id: dept.id, status: newStatus })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // --- Loading State ---
  if (isLoading) {
    return <DepartmentsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Manage your hospital departments and their settings
          </p>
        </div>
        <Button onClick={openCreateDialog} className="shrink-0 bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Empty State */}
      {departments.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
            <Building2 className="h-8 w-8 text-teal-500" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No departments yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Create your first department to start organizing your hospital&rsquo;s medical specialties.
          </p>
          <Button onClick={openCreateDialog} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </motion.div>
      )}

      {/* Department Grid */}
      {departments.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {departments.map((dept, index) => {
            const colorClass = ICON_BG_COLORS[index % ICON_BG_COLORS.length]
            return (
              <motion.div key={dept.id} variants={itemVariants}>
                <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
                        {renderIcon(dept.icon, "h-6 w-6")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`cursor-pointer text-[10px] font-medium transition-colors ${
                            dept.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                          onClick={() => toggleStatus(dept)}
                        >
                          {dept.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(dept)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(dept)}
                              className="text-red-600 focus:text-red-600"
                              disabled={dept.doctorCount > 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {dept.doctorCount > 0 ? `Can't Delete (${dept.doctorCount} doctors)` : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h3 className="mb-1 text-base font-semibold">{dept.name}</h3>
                    {dept.nameHi && (
                      <p className="mb-2 text-xs text-muted-foreground">{dept.nameHi}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {dept.floorNo && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Floor {dept.floorNo}
                        </span>
                      )}
                      {dept.opdRoom && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          OPD {dept.opdRoom}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {dept.doctorCount} {dept.doctorCount === 1 ? 'doctor' : 'doctors'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>
              {editingDept ? 'Update department details below.' : 'Fill in the details to create a new department.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name *</Label>
              <Input
                id="dept-name"
                placeholder="e.g. Cardiology"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-nameHi">Hindi Name</Label>
              <Input
                id="dept-nameHi"
                placeholder="e.g. हृदय रोग विभाग"
                value={form.nameHi}
                onChange={(e) => setForm((f) => ({ ...f, nameHi: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-desc">Description</Label>
              <Input
                id="dept-desc"
                placeholder="Brief description of the department"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Icon selector */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ICON_BG_COLORS[AVAILABLE_ICONS.indexOf(form.icon) % ICON_BG_COLORS.length]}`}>
                {renderIcon(form.icon, "h-5 w-5")}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIconPickerOpen((p) => !p)}
                >
                  {iconPickerOpen ? 'Hide Icons' : 'Change Icon'}
                </Button>
              </div>
              <AnimatePresence>
                {iconPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 grid grid-cols-8 gap-2">
                      {AVAILABLE_ICONS.map((iconName) => {
                        const Ic = ICON_MAP[iconName]
                        const isSelected = form.icon === iconName
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, icon: iconName }))}
                            className={`flex h-10 w-full items-center justify-center rounded-lg border transition-all hover:scale-105 ${
                              isSelected
                                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/30 dark:bg-teal-900/30'
                                : 'border-border hover:border-teal-300'
                            }`}
                          >
                            <Ic className="h-5 w-5" />
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept-floor">Floor No.</Label>
                <Input
                  id="dept-floor"
                  placeholder="e.g. 3"
                  value={form.floorNo}
                  onChange={(e) => setForm((f) => ({ ...f, floorNo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-opd">OPD Room</Label>
                <Input
                  id="dept-opd"
                  placeholder="e.g. 301"
                  value={form.opdRoom}
                  onChange={(e) => setForm((f) => ({ ...f, opdRoom: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : editingDept ? (
                  'Update Department'
                ) : (
                  'Create Department'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingDept?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- Skeleton ---
function DepartmentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-3 w-20" />
            <div className="mt-3 flex gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
