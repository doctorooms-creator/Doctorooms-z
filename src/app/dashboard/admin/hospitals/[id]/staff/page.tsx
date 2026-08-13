'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Search,
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Users,
  Loader2,
  Building2,
  UserPlus,
  Stethoscope,
  Pill,
  HandHelping,
  HeadsetMic,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { resolveAvatarUrl } from '@/lib/avatar-url'
import { toast } from 'sonner'

// ── Types ───────────────────────────────────────────────────────────────────

interface StaffMember {
  userId: string
  name: string
  email: string
  role: string
  gender: string
  status: string
  mobileNo: string
  profileImg: string
  createdAt: string
  departmentName?: string
  doctorName?: string
  designation?: string
}

interface StaffCounts {
  receptionists: number
  pharmacists: number
  assistants: number
  doctors: number
}

interface StaffResponse {
  staff: StaffMember[]
  counts: StaffCounts
}

interface Department {
  id: string
  name: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const ROLE_TABS = [
  { key: '', label: 'All' },
  { key: 'receptionist', label: 'Receptionists' },
  { key: 'pharmacist', label: 'Pharmacists' },
  { key: 'assistant', label: 'Assistants' },
  { key: 'doctor', label: 'Doctors' },
] as const

const roleBadgeColors: Record<string, string> = {
  receptionist: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
  pharmacist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  assistant: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400',
  doctor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
}

const statusBadgeColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Block: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

const roleIcons: Record<string, React.ElementType> = {
  receptionist: HeadsetMic,
  pharmacist: Pill,
  assistant: HandHelping,
  doctor: Stethoscope,
}

const countKeys: Record<string, keyof StaffCounts> = {
  receptionist: 'receptionists',
  pharmacist: 'pharmacists',
  assistant: 'assistants',
  doctor: 'doctors',
}

// ── Component ───────────────────────────────────────────────────────────────

export default function HospitalStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const [activeTab, setActiveTab] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null)

  // Add staff form state
  const [formRole, setFormRole] = useState<'receptionist' | 'pharmacist' | 'assistant'>('receptionist')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formGender, setFormGender] = useState('Male')
  const [formMobile, setFormMobile] = useState('')
  const [formDepartmentId, setFormDepartmentId] = useState('')
  const [formDoctorEmail, setFormDoctorEmail] = useState('')

  const queryClient = useQueryClient()

  // Resolve params (Next.js 16 async params)
  const [hospitalId, setHospitalId] = useState<string>('')
  useEffect(() => {
    params.then((p) => setHospitalId(p.id))
  }, [params])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<StaffResponse>({
    queryKey: ['hospital-staff', hospitalId, activeTab, debouncedSearch],
    queryFn: () => {
      const url = new URL(`/api/dashboard/admin/hospitals/${hospitalId}/staff`)
      if (activeTab) url.searchParams.set('role', activeTab)
      if (debouncedSearch) url.searchParams.set('search', debouncedSearch)
      return fetch(url.toString()).then((r) => r.json())
    },
    enabled: !!hospitalId,
  })

  const { data: departmentsData } = useQuery<{ departments: Department[] }>({
    queryKey: ['admin-hospital-departments', hospitalId],
    queryFn: () =>
      fetch(`/api/dashboard/admin/hospitals/${hospitalId}/departments`).then((r) => r.json()),
    enabled: !!hospitalId,
  })

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/dashboard/admin/hospitals/${hospitalId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create staff')
      return data
    },
    onSuccess: () => {
      toast.success('Staff member created successfully')
      resetForm()
      setShowAddDialog(false)
      queryClient.invalidateQueries({ queryKey: ['hospital-staff'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/dashboard/admin/hospitals/${hospitalId}/staff/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove staff')
      return data
    },
    onSuccess: () => {
      toast.success('Staff member removed and deactivated')
      setRemoveTarget(null)
      queryClient.invalidateQueries({ queryKey: ['hospital-staff'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'Active' | 'Block' }) => {
      const res = await fetch(`/api/dashboard/admin/hospitals/${hospitalId}/staff/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      return data
    },
    onSuccess: (_, variables) => {
      toast.success(`Staff member ${variables.status === 'Active' ? 'activated' : 'blocked'}`)
      queryClient.invalidateQueries({ queryKey: ['hospital-staff'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormRole('receptionist')
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormGender('Male')
    setFormMobile('')
    setFormDepartmentId('')
    setFormDoctorEmail('')
  }, [])

  const handleCreate = useCallback(() => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error('Name, email, and password are required')
      return
    }

    const payload: Record<string, unknown> = {
      role: formRole,
      name: formName.trim(),
      email: formEmail.trim(),
      password: formPassword,
      gender: formGender,
    }
    if (formMobile.trim()) payload.mobileNo = formMobile.trim()
    if (formRole === 'receptionist' && formDepartmentId) payload.departmentId = formDepartmentId
    if (formRole === 'assistant') {
      if (!formDoctorEmail.trim()) {
        toast.error('Doctor email is required for assistants')
        return
      }
      payload.doctorEmail = formDoctorEmail.trim()
    }

    createMutation.mutate(payload)
  }, [formRole, formName, formEmail, formPassword, formGender, formMobile, formDepartmentId, formDoctorEmail, createMutation])

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key)
  }, [])

  // ── Computed ─────────────────────────────────────────────────────────────

  const staff = data?.staff ?? []
  const counts = data?.counts
  const totalCount = counts
    ? counts.receptionists + counts.pharmacists + counts.assistants + counts.doctors
    : 0

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderRoleBadge = (role: string) => {
    const Icon = roleIcons[role]
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
          roleBadgeColors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        )}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {role}
      </span>
    )
  }

  const renderStatusBadge = (status: string) => (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusBadgeColors[status] || 'bg-gray-100 text-gray-700'
      )}
    >
      {status}
    </span>
  )

  const renderStaffAvatar = (member: StaffMember, size: string = 'h-8 w-8') => {
    const avatarUrl = resolveAvatarUrl(member.profileImg)
    const initials = member.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    return (
      <Avatar className={size}>
        <AvatarImage src={avatarUrl} alt={member.name} />
        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
      </Avatar>
    )
  }

  const renderSubInfo = (member: StaffMember) => {
    if (member.role === 'receptionist' && member.departmentName) {
      return <span className="text-xs text-muted-foreground">{member.departmentName}</span>
    }
    if (member.role === 'assistant' && member.doctorName) {
      return <span className="text-xs text-muted-foreground">Dr. {member.doctorName}</span>
    }
    if (member.role === 'doctor' && member.designation) {
      return <span className="text-xs text-muted-foreground">{member.designation}</span>
    }
    return <span className="text-xs text-muted-foreground">—</span>
  }

  // ── Loading Skeleton ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="h-9 w-full max-w-md" />

        {/* Search skeleton */}
        <Skeleton className="h-10 w-full max-w-sm" />

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/admin/hospitals">Hospitals</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Manage Staff</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Manage Staff</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Hospital ID: {hospitalId}</span>
            <span className="text-muted-foreground/50">|</span>
            <Users className="h-4 w-4" />
            <span>{totalCount} staff member{totalCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {ROLE_TABS.map((tab) => {
          const count =
            tab.key === ''
              ? totalCount
              : counts
                ? counts[countKeys[tab.key]]
                : 0
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                  activeTab === tab.key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background/50 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Staff Content */}
      <Card>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="mt-4 text-sm font-medium">No staff members found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search query'
                  : activeTab
                    ? `No ${activeTab}s assigned to this hospital yet`
                    : 'Add staff members to get started'}
              </p>
              {!debouncedSearch && !activeTab && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  Add First Staff
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden lg:table-cell">Department / Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {staff.map((member, i) => (
                        <motion.tr
                          key={member.userId}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="group border-b border-border transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              {renderStaffAvatar(member)}
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground lg:hidden">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {member.email}
                          </TableCell>
                          <TableCell>{renderRoleBadge(member.role)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {renderSubInfo(member)}
                          </TableCell>
                          <TableCell>{renderStatusBadge(member.status)}</TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {format(new Date(member.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.status === 'Active' ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleStatusMutation.mutate({
                                        userId: member.userId,
                                        status: 'Block',
                                      })
                                    }
                                    disabled={toggleStatusMutation.isPending}
                                  >
                                    <ShieldBan className="mr-2 h-4 w-4 text-red-600" /> Block
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleStatusMutation.mutate({
                                        userId: member.userId,
                                        status: 'Active',
                                      })
                                    }
                                    disabled={toggleStatusMutation.isPending}
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" /> Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setRemoveTarget(member)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Remove Staff
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

              {/* Mobile Cards (hidden on desktop) */}
              <div className="md:hidden divide-y divide-border">
                <AnimatePresence>
                  {staff.map((member, i) => (
                    <motion.div
                      key={member.userId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3">
                        {renderStaffAvatar(member, 'h-10 w-10')}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {renderStatusBadge(member.status)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {member.status === 'Active' ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toggleStatusMutation.mutate({
                                          userId: member.userId,
                                          status: 'Block',
                                        })
                                      }
                                    >
                                      <ShieldBan className="mr-2 h-4 w-4 text-red-600" /> Block
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toggleStatusMutation.mutate({
                                          userId: member.userId,
                                          status: 'Active',
                                        })
                                      }
                                    >
                                      <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" /> Activate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setRemoveTarget(member)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove Staff
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {renderRoleBadge(member.role)}
                            {(member.departmentName || member.doctorName || member.designation) && (
                              <span className="text-xs text-muted-foreground">
                                {member.role === 'assistant' && member.doctorName
                                  ? `Dr. ${member.doctorName}`
                                  : member.departmentName || member.designation || '—'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground/70 mt-1.5">
                            Added {format(new Date(member.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Add Staff Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) resetForm()
        setShowAddDialog(open)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Role Selector */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={formRole}
                onValueChange={(v) => {
                  setFormRole(v as 'receptionist' | 'pharmacist' | 'assistant')
                  setFormDepartmentId('')
                  setFormDoctorEmail('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receptionist">
                    <span className="flex items-center gap-2">
                      <HeadsetMic className="h-3.5 w-3.5" />
                      Receptionist
                    </span>
                  </SelectItem>
                  <SelectItem value="pharmacist">
                    <span className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5" />
                      Pharmacist
                    </span>
                  </SelectItem>
                  <SelectItem value="assistant">
                    <span className="flex items-center gap-2">
                      <HandHelping className="h-3.5 w-3.5" />
                      Assistant
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name *</Label>
              <Input
                id="staff-name"
                placeholder="e.g. John Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="e.g. john@hospital.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="staff-password">Password *</Label>
              <Input
                id="staff-password"
                type="password"
                placeholder="Min. 6 characters"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formGender} onValueChange={setFormGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile No */}
            <div className="space-y-2">
              <Label htmlFor="staff-mobile">Mobile No</Label>
              <Input
                id="staff-mobile"
                placeholder="e.g. +91 9876543210"
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
              />
            </div>

            {/* Conditional: Department for Receptionist */}
            {formRole === 'receptionist' && (
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsData?.departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                    {(!departmentsData?.departments || departmentsData.departments.length === 0) && (
                      <SelectItem value="_none" disabled>
                        No departments available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conditional: Doctor Email for Assistant */}
            {formRole === 'assistant' && (
              <div className="space-y-2">
                <Label htmlFor="staff-doctor-email">Doctor Email *</Label>
                <Input
                  id="staff-doctor-email"
                  type="email"
                  placeholder="e.g. doctor@hospital.com"
                  value={formDoctorEmail}
                  onChange={(e) => setFormDoctorEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email of the doctor this assistant will be linked to
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setShowAddDialog(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Staff Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{removeTarget?.name}</strong>? They will be deactivated and can no longer
              access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) removeMutation.mutate(removeTarget.userId)
              }}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
