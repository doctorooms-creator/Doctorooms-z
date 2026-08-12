'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { FolderOpen, Plus, Search, Edit, Trash2, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: string
  name: string
  nameEn: string
  status: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  nameEn: string
}

const emptyForm: FormData = {
  name: '',
  nameEn: '',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Category | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // Build query string
  const queryString = new URLSearchParams()
  if (search.trim()) queryString.set('search', search.trim())
  if (statusFilter !== 'All') queryString.set('status', statusFilter)

  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ['doctor-categories', search, statusFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/categories?${queryString.toString()}`).then((r) => r.json()),
  })

  const categories = data?.categories || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to create') })
        return r.json()
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-categories'] })
      const prev = queryClient.getQueryData<{ categories: Category[] }>(['doctor-categories', search, statusFilter])
      queryClient.setQueryData<{ categories: Category[] }>(['doctor-categories', search, statusFilter], (old) => ({
        categories: [
          {
            id: 'optimistic-' + Date.now(),
            name: newItem.name,
            nameEn: newItem.nameEn,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...(old?.categories || []),
        ],
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-categories'] })
      toast.success('Category added successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-categories', search, statusFilter], context.prev)
      }
      toast.error(err.message || 'Failed to add category')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData & { status?: string } }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to update') })
        return r.json()
      }),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-categories'] })
      const prev = queryClient.getQueryData<{ categories: Category[] }>(['doctor-categories', search, statusFilter])
      queryClient.setQueryData<{ categories: Category[] }>(['doctor-categories', search, statusFilter], (old) => ({
        categories: (old?.categories || []).map((c) =>
          c.id === id
            ? {
                ...c,
                name: body.name ?? c.name,
                nameEn: body.nameEn ?? c.nameEn,
                status: body.status ?? c.status,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-categories'] })
      toast.success('Category updated successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-categories', search, statusFilter], context.prev)
      }
      toast.error(err.message || 'Failed to update category')
    },
  })

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/categories/${id}`, {
        method: 'DELETE',
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to delete') })
        return r.json()
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-categories'] })
      const prev = queryClient.getQueryData<{ categories: Category[] }>(['doctor-categories', search, statusFilter])
      queryClient.setQueryData<{ categories: Category[] }>(['doctor-categories', search, statusFilter], (old) => ({
        categories: (old?.categories || []).filter((c) => c.id !== id),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-categories'] })
      toast.success('Category deactivated')
      setDeleteTarget(null)
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-categories', search, statusFilter], context.prev)
      }
      toast.error(err.message || 'Failed to delete category')
    },
  })

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (cat: Category) => {
    setEditingItem(cat)
    setForm({ name: cat.name, nameEn: cat.nameEn || '' })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Category name is required')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Categories
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage complaint categories for your prescriptions
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={openCreateDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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

      {/* Category List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 mb-4">
            <FolderOpen className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-sm font-medium">
            {search ? 'No categories found' : 'No categories added yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            {search
              ? 'Try a different search term or adjust the filter'
              : 'Add categories to organize your complaints for quick access in the prescription stepper'}
          </p>
          {!search && (
            <Button
              variant="outline"
              className="mt-4 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Top Row: Name + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{cat.name}</h3>
                          {cat.status === 'Active' ? (
                            <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 text-[10px] shrink-0">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-[10px] shrink-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(cat)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {cat.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            onClick={() => setDeleteTarget(cat)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* English Name */}
                    {cat.nameEn && (
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <Languages className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">{cat.nameEn}</span>
                      </div>
                    )}

                    {/* Mobile action buttons */}
                    <div className="flex sm:hidden gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
                        onClick={() => openEditDialog(cat)}
                      >
                        <Edit className="mr-1.5 h-3 w-3" />
                        Edit
                      </Button>
                      {cat.status === 'Active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          <Trash2 className="mr-1.5 h-3 w-3" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name (Primary) */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g. તાવો"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
              <p className="text-[11px] text-muted-foreground">
                Primary language name — shown in the prescription stepper
              </p>
            </div>

            {/* Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="cat-name-en" className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                Name (English)
              </Label>
              <Input
                id="cat-name-en"
                placeholder="e.g. Fever"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
              <p className="text-[11px] text-muted-foreground">
                Optional — used in print output
              </p>
            </div>
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
                : createMutation.isPending ? 'Adding...' : 'Add Category'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteTarget?.name}&quot;? It will be marked as inactive and won&apos;t appear in your active list. You can reactivate it later by editing.
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
