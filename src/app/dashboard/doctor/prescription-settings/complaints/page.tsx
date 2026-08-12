'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Thermometer, Plus, Search, Edit, Trash2, Languages, Tag, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryOption {
  id: string
  name: string
  nameEn: string
}

interface Complaint {
  id: string
  coCode: string
  coDetail: string
  coDetailEn: string
  categoryId: string | null
  status: string
  createdAt: string
  updatedAt: string
  category: CategoryOption | null
}

interface FormData {
  coCode: string
  coDetail: string
  coDetailEn: string
  categoryId: string
  status: string
}

const emptyForm: FormData = {
  coCode: '',
  coDetail: '',
  coDetailEn: '',
  categoryId: '',
  status: 'Active',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ComplaintsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Complaint | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null)

  // Fetch categories for dropdown (active only, no pagination needed)
  const { data: catData } = useQuery<{ categories: CategoryOption[] }>({
    queryKey: ['doctor-categories-dropdown'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/categories?status=Active').then((r) => r.json()),
    staleTime: 30_000,
  })
  const categoryOptions = catData?.categories || []

  // Build query string for complaints
  const queryString = new URLSearchParams()
  if (search.trim()) queryString.set('search', search.trim())
  if (statusFilter !== 'All') queryString.set('status', statusFilter)
  if (categoryFilter) queryString.set('categoryId', categoryFilter)

  const { data, isLoading } = useQuery<{ complaints: Complaint[] }>({
    queryKey: ['doctor-complaints', search, statusFilter, categoryFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/complaints?${queryString.toString()}`).then((r) => r.json()),
  })

  const complaints = data?.complaints || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to create') })
        return r.json()
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-complaints'] })
      const prev = queryClient.getQueryData<{ complaints: Complaint[] }>(['doctor-complaints', search, statusFilter, categoryFilter])
      const cat = categoryOptions.find((c) => c.id === newItem.categoryId) || null
      queryClient.setQueryData<{ complaints: Complaint[] }>(['doctor-complaints', search, statusFilter, categoryFilter], (old) => ({
        complaints: [
          {
            id: 'optimistic-' + Date.now(),
            coCode: newItem.coCode,
            coDetail: newItem.coDetail,
            coDetailEn: newItem.coDetailEn,
            categoryId: newItem.categoryId || null,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: cat,
          },
          ...(old?.complaints || []),
        ],
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-complaints'] })
      toast.success('Complaint added successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-complaints', search, statusFilter, categoryFilter], context.prev)
      }
      toast.error(err.message || 'Failed to add complaint')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to update') })
        return r.json()
      }),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-complaints'] })
      const prev = queryClient.getQueryData<{ complaints: Complaint[] }>(['doctor-complaints', search, statusFilter, categoryFilter])
      queryClient.setQueryData<{ complaints: Complaint[] }>(['doctor-complaints', search, statusFilter, categoryFilter], (old) => {
        const cat = categoryOptions.find((c) => c.id === body.categoryId) || null
        return {
          complaints: (old?.complaints || []).map((c) =>
            c.id === id
              ? {
                  ...c,
                  coCode: body.coCode ?? c.coCode,
                  coDetail: body.coDetail ?? c.coDetail,
                  coDetailEn: body.coDetailEn ?? c.coDetailEn,
                  categoryId: body.categoryId || null,
                  status: body.status ?? c.status,
                  category: cat,
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }
      })
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-complaints'] })
      toast.success('Complaint updated successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-complaints', search, statusFilter, categoryFilter], context.prev)
      }
      toast.error(err.message || 'Failed to update complaint')
    },
  })

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/complaints/${id}`, {
        method: 'DELETE',
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to delete') })
        return r.json()
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-complaints'] })
      const prev = queryClient.getQueryData<{ complaints: Complaint[] }>(['doctor-complaints', search, statusFilter, categoryFilter])
      queryClient.setQueryData<{ complaints: Complaint[] }>(['doctor-complaints', search, statusFilter, categoryFilter], (old) => ({
        complaints: (old?.complaints || []).filter((c) => c.id !== id),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-complaints'] })
      toast.success('Complaint deactivated')
      setDeleteTarget(null)
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-complaints', search, statusFilter, categoryFilter], context.prev)
      }
      toast.error(err.message || 'Failed to delete complaint')
    },
  })

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (comp: Complaint) => {
    setEditingItem(comp)
    setForm({
      coCode: comp.coCode || '',
      coDetail: comp.coDetail,
      coDetailEn: comp.coDetailEn || '',
      categoryId: comp.categoryId || '',
      status: comp.status,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const handleSubmit = () => {
    if (!form.coDetail.trim()) {
      toast.error('Complaint detail is required')
      return
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, body: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  const getCategoryName = (comp: Complaint) => {
    if (comp.category) return comp.category.name
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Complaints (C/O)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage chief complaints for your prescriptions
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={openCreateDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Complaint
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}{cat.nameEn ? ` (${cat.nameEn})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5 rounded-lg border border-border bg-card p-1">
          {(['Active', 'Inactive', 'All'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 mb-4">
            <Thermometer className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-sm font-medium">
            {search || categoryFilter ? 'No complaints found' : 'No complaints added yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            {search || categoryFilter
              ? 'Try a different search term or adjust the filters'
              : 'Add chief complaints that you commonly encounter for quick selection in prescriptions'}
          </p>
          {!search && !categoryFilter && (
            <Button
              variant="outline"
              className="mt-4 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Complaint
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[70px] text-xs">Code</TableHead>
                  <TableHead className="text-xs">Detail</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">English</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Category</TableHead>
                  <TableHead className="w-[80px] text-xs">Status</TableHead>
                  <TableHead className="w-[80px] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {complaints.map((comp, i) => (
                    <motion.tr
                      key={comp.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.02 }}
                      className="group border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-3">
                        {comp.coCode ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            {comp.coCode}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium">{comp.coDetail}</span>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        {comp.coDetailEn ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Languages className="h-3 w-3 shrink-0" />
                            {comp.coDetailEn}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        {getCategoryName(comp) ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20"
                          >
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {getCategoryName(comp)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {comp.status === 'Active' ? (
                          <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(comp)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {comp.status === 'Active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => setDeleteTarget(comp)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Mobile card view for very small screens (hidden on sm+) */}
          <div className="sm:hidden divide-y divide-border">
            {complaints.map((comp) => (
              <div key={comp.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {comp.coCode && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1 py-0.5">
                          {comp.coCode}
                        </span>
                      )}
                      <span className="text-sm font-medium truncate">{comp.coDetail}</span>
                    </div>
                    {comp.coDetailEn && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{comp.coDetailEn}</p>
                    )}
                  </div>
                  {comp.status === 'Active' ? (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 text-[10px] shrink-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-[10px] shrink-0">
                      Inactive
                    </Badge>
                  )}
                </div>
                {getCategoryName(comp) && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20">
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {getCategoryName(comp)}
                  </Badge>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
                    onClick={() => openEditDialog(comp)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  {comp.status === 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                      onClick={() => setDeleteTarget(comp)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Complaint' : 'Add New Complaint'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="co-code" className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Code
              </Label>
              <Input
                id="co-code"
                placeholder="e.g. F001 (optional)"
                value={form.coCode}
                onChange={(e) => setForm({ ...form, coCode: e.target.value })}
              />
            </div>

            {/* Detail (Primary) */}
            <div className="space-y-2">
              <Label htmlFor="co-detail">
                Detail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="co-detail"
                placeholder="e.g. તાવો આવે છે"
                value={form.coDetail}
                onChange={(e) => setForm({ ...form, coDetail: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
              <p className="text-[11px] text-muted-foreground">
                Primary language — shown in the prescription stepper
              </p>
            </div>

            {/* Detail (English) */}
            <div className="space-y-2">
              <Label htmlFor="co-detail-en" className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                Detail (English)
              </Label>
              <Input
                id="co-detail-en"
                placeholder="e.g. Fever"
                value={form.coDetailEn}
                onChange={(e) => setForm({ ...form, coDetailEn: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Optional — used in print output
              </p>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Category
              </Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v === '__none__' ? '' : v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None (uncategorized)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (uncategorized)</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}{cat.nameEn ? ` (${cat.nameEn})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status (only in edit) */}
            {editingItem && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem
                ? updateMutation.isPending ? 'Saving...' : 'Save Changes'
                : createMutation.isPending ? 'Adding...' : 'Add Complaint'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Complaint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteTarget?.coDetail}&quot;? It will be marked as inactive and won&apos;t appear in your active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
