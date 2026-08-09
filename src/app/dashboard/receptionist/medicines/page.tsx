'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pill,
  Plus,
  Pencil,
  Trash2,
  Search,
  Power,
  Sun,
  CloudSun,
  Moon,
} from 'lucide-react'
import { toast } from 'sonner'

// ==================== TYPES ====================

interface Medicine {
  id: string
  name: string
  morning: string
  afternoon: string
  evening: string
  dose: string
  tab: number
  description: string
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  morning: string
  afternoon: string
  evening: string
  dose: string
  tab: number
  description: string
}

const emptyForm: FormData = {
  name: '',
  morning: '',
  afternoon: '',
  evening: '',
  dose: '',
  tab: 1,
  description: '',
}

// ==================== ANIMATION VARIANTS ====================

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ==================== MAIN COMPONENT ====================

export default function MedicinesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // ---------- Query ----------

  const { data, isLoading } = useQuery<{ medicines: Medicine[] }>({
    queryKey: ['receptionist-medicines', debouncedSearch],
    queryFn: () =>
      fetch(
        `/api/receptionist/medicines${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
      ).then((r) => r.json()),
  })

  const medicines = data?.medicines || []

  // ---------- Mutations ----------

  const createMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetch('/api/receptionist/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['receptionist-medicines'] })
      toast.success('Medicine added successfully')
      closeDialog()
    },
    onError: () => {
      toast.error('Failed to add medicine')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      fetch(`/api/receptionist/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['receptionist-medicines'] })
      toast.success('Medicine updated successfully')
      closeDialog()
    },
    onError: () => {
      toast.error('Failed to update medicine')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/receptionist/medicines/${id}`, { method: 'DELETE' }).then((r) =>
        r.json()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-medicines'] })
      toast.success('Medicine deleted successfully')
      setDeleteId(null)
    },
    onError: () => {
      toast.error('Failed to delete medicine')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/receptionist/medicines/${id}/toggle`, { method: 'PATCH' }).then(
        (r) => r.json()
      ),
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['receptionist-medicines'] })
      toast.success(
        data.status === 'Active'
          ? 'Medicine activated'
          : 'Medicine deactivated'
      )
    },
    onError: () => {
      toast.error('Failed to toggle status')
    },
  })

  // ---------- Handlers ----------

  const openAddDialog = useCallback(() => {
    setEditingMedicine(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((med: Medicine) => {
    setEditingMedicine(med)
    setForm({
      name: med.name,
      morning: med.morning,
      afternoon: med.afternoon,
      evening: med.evening,
      dose: med.dose,
      tab: med.tab,
      description: med.description,
    })
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingMedicine(null)
    setForm(emptyForm)
  }, [])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('Medicine name is required')
      return
    }
    if (editingMedicine) {
      updateMutation.mutate({ id: editingMedicine.id, body: form })
    } else {
      createMutation.mutate(form)
    }
  }, [form, editingMedicine, createMutation, updateMutation])

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* ========== A. PAGE HEADER ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Medicine List
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the doctor&apos;s medicine master list
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20 mt-2 sm:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </motion.div>

      {/* ========== B. SEARCH + COUNT ========== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">{medicines.length}</span>{' '}
          {medicines.length === 1 ? 'medicine' : 'medicines'}
        </p>
      </motion.div>

      {/* ========== C. LOADING SKELETON ========== */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== D. EMPTY STATE ========== */}
      {!isLoading && medicines.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Pill className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {debouncedSearch
              ? 'No medicines match your search'
              : 'No medicines added yet'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {debouncedSearch
              ? 'Try a different search term'
              : 'Start by adding medicines to the master list'}
          </p>
          {!debouncedSearch && (
            <Button
              onClick={openAddDialog}
              className="mt-4 bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Medicine
            </Button>
          )}
        </motion.div>
      )}

      {/* ========== E. DESKTOP TABLE ========== */}
      {!isLoading && medicines.length > 0 && (
        <>
          {/* Desktop Table */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="hidden md:block rounded-lg border border-border overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      Morning
                    </span>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <CloudSun className="h-3.5 w-3.5 text-orange-500" />
                      Afternoon
                    </span>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Moon className="h-3.5 w-3.5 text-violet-500" />
                      Evening
                    </span>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">Dosage</TableHead>
                  <TableHead className="hidden xl:table-cell">Tabs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((med) => (
                  <motion.tr
                    key={med.id}
                    variants={itemVariants}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="pl-4 font-medium">
                      {med.name}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {med.morning || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {med.afternoon || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {med.evening || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {med.dose || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {med.tab}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleMutation.mutate(med.id)}
                        disabled={toggleMutation.isPending}
                        className="cursor-pointer"
                      >
                        <Badge
                          variant="secondary"
                          className={
                            med.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : 'bg-secondary text-muted-foreground'
                          }
                        >
                          {med.status}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(med)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog
                          open={deleteId === med.id}
                          onOpenChange={(open) =>
                            setDeleteId(open ? med.id : null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Medicine?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{med.name}&quot; from the
                                medicine list. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(med.id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>

          {/* Mobile Card Layout */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="md:hidden space-y-3"
          >
            {medicines.map((med) => (
              <motion.div key={med.id} variants={itemVariants}>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    {/* Name + Status Row */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight">
                        {med.name}
                      </h3>
                      <button
                        onClick={() => toggleMutation.mutate(med.id)}
                        disabled={toggleMutation.isPending}
                        className="cursor-pointer shrink-0"
                      >
                        <Badge
                          variant="secondary"
                          className={
                            med.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : 'bg-secondary text-muted-foreground'
                          }
                        >
                          {med.status}
                        </Badge>
                      </button>
                    </div>

                    {/* Dose Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {med.morning && (
                        <span className="inline-flex items-center gap-1">
                          <Sun className="h-3.5 w-3.5 text-amber-500" />
                          M: {med.morning}
                        </span>
                      )}
                      {med.afternoon && (
                        <span className="inline-flex items-center gap-1">
                          <CloudSun className="h-3.5 w-3.5 text-orange-500" />
                          A: {med.afternoon}
                        </span>
                      )}
                      {med.evening && (
                        <span className="inline-flex items-center gap-1">
                          <Moon className="h-3.5 w-3.5 text-violet-500" />
                          E: {med.evening}
                        </span>
                      )}
                    </div>

                    {/* Extra Info */}
                    {(med.dose || med.tab) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {med.dose && <span>Dosage: {med.dose}</span>}
                        {med.tab && <span>Tabs: {med.tab}</span>}
                      </div>
                    )}

                    {med.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {med.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(med)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <AlertDialog
                        open={deleteId === med.id}
                        onOpenChange={(open) =>
                          setDeleteId(open ? med.id : null)
                        }
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Medicine?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{med.name}&quot; from
                              the medicine list. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(med.id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* ========== F. ADD/EDIT DIALOG ========== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
            </DialogTitle>
            <DialogDescription>
              {editingMedicine
                ? 'Update the medicine details below.'
                : 'Fill in the details to add a new medicine.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Medicine Name */}
            <div className="space-y-2">
              <Label htmlFor="med-name">Medicine Name *</Label>
              <Input
                id="med-name"
                placeholder="e.g., Paracetamol 500mg"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Dose Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="med-morning" className="inline-flex items-center gap-1">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  Morning
                </Label>
                <Input
                  id="med-morning"
                  placeholder="e.g., 1 tab"
                  value={form.morning}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, morning: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-afternoon" className="inline-flex items-center gap-1">
                  <CloudSun className="h-3.5 w-3.5 text-orange-500" />
                  Afternoon
                </Label>
                <Input
                  id="med-afternoon"
                  placeholder="e.g., 0.5 tab"
                  value={form.afternoon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, afternoon: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-evening" className="inline-flex items-center gap-1">
                  <Moon className="h-3.5 w-3.5 text-violet-500" />
                  Evening
                </Label>
                <Input
                  id="med-evening"
                  placeholder="e.g., 1 tab"
                  value={form.evening}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, evening: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Dosage + Tab Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="med-dose">Dosage</Label>
                <Input
                  id="med-dose"
                  placeholder="e.g., After food"
                  value={form.dose}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dose: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-tab">Tab Count</Label>
                <Input
                  id="med-tab"
                  type="number"
                  min={0}
                  value={form.tab}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tab: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="med-desc">Description</Label>
              <Textarea
                id="med-desc"
                placeholder="Additional notes about this medicine..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.name.trim()}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
