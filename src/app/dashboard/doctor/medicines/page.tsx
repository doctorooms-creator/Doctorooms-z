'use client'

import { useState, useRef, KeyboardEvent } from 'react'
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
import {
  Pill,
  Plus,
  Search,
  Edit,
  Trash2,
  Sun,
  CloudSun,
  Moon,
  X,
  Clock,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Medicine {
  id: string
  name: string
  morning: number
  afternoon: number
  evening: number
  dose: string           // raw JSON string from DB
  doseArray: string[]    // parsed by API
  tab: number
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  doseArray: string[]
  tab: number
  morning: number
  afternoon: number
  evening: number
  description: string
}

const emptyForm: FormData = {
  name: '',
  doseArray: [],
  tab: 1,
  morning: 0,
  afternoon: 0,
  evening: 0,
  description: '',
}

/* ------------------------------------------------------------------ */
/*  Dose Tag Input (inline component)                                  */
/* ------------------------------------------------------------------ */

function DoseTagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) {
      toast.error('This dose option already exists')
      return
    }
    onChange([...tags, trimmed])
    setInput('')
  }

  const removeTag = (index: number) => {
    const next = [...tags]
    next.splice(index, 1)
    onChange(next)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[42px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
            i === 0
              ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
              : 'bg-muted text-muted-foreground border border-border'
          )}
        >
          {tag}
          <button
            type="button"
            className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(i)
            }}
          >
            <X className="h-3 w-3" />
          </button>
          {i === 0 && (
            <span className="ml-0.5 text-[9px] font-bold uppercase tracking-wider opacity-60">default</span>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addTag(input)
        }}
        placeholder={tags.length === 0 ? 'e.g. 500mg, then Enter' : 'Add more...'}
        className="flex-1 min-w-[100px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DoctorMedicinesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null)

  // Build query string
  const queryString = new URLSearchParams()
  if (search.trim()) queryString.set('search', search.trim())
  if (statusFilter !== 'All') queryString.set('status', statusFilter)

  const { data, isLoading } = useQuery<{ medicines: Medicine[] }>({
    queryKey: ['doctor-medicines', search, statusFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/medicines?${queryString.toString()}`).then((r) => r.json()),
  })

  const medicines = data?.medicines || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetch('/api/dashboard/doctor/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to create') })
        return r.json()
      }),
    onMutate: async (newMed) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-medicines'] })
      const prev = queryClient.getQueryData<{ medicines: Medicine[] }>(['doctor-medicines', search, statusFilter])
      queryClient.setQueryData<{ medicines: Medicine[] }>(['doctor-medicines', search, statusFilter], (old) => ({
        medicines: [
          {
            id: 'optimistic-' + Date.now(),
            name: newMed.name,
            morning: newMed.morning,
            afternoon: newMed.afternoon,
            evening: newMed.evening,
            dose: JSON.stringify(newMed.doseArray),
            doseArray: newMed.doseArray,
            tab: newMed.tab,
            description: newMed.description,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...(old?.medicines || []),
        ],
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-medicines'] })
      toast.success('Medicine added successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-medicines', search, statusFilter], context.prev)
      }
      toast.error(err.message || 'Failed to add medicine')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      fetch(`/api/dashboard/doctor/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to update') })
        return r.json()
      }),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-medicines'] })
      const prev = queryClient.getQueryData<{ medicines: Medicine[] }>(['doctor-medicines', search, statusFilter])
      queryClient.setQueryData<{ medicines: Medicine[] }>(['doctor-medicines', search, statusFilter], (old) => ({
        medicines: (old?.medicines || []).map((m) =>
          m.id === id
            ? {
                ...m,
                name: body.name,
                morning: body.morning,
                afternoon: body.afternoon,
                evening: body.evening,
                dose: JSON.stringify(body.doseArray),
                doseArray: body.doseArray,
                tab: body.tab,
                description: body.description,
                updatedAt: new Date().toISOString(),
              }
            : m
        ),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-medicines'] })
      toast.success('Medicine updated successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-medicines', search, statusFilter], context.prev)
      }
      toast.error(err.message || 'Failed to update medicine')
    },
  })

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/medicines/${id}`, {
        method: 'DELETE',
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to delete') })
        return r.json()
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-medicines'] })
      const prev = queryClient.getQueryData<{ medicines: Medicine[] }>(['doctor-medicines', search, statusFilter])
      queryClient.setQueryData<{ medicines: Medicine[] }>(['doctor-medicines', search, statusFilter], (old) => ({
        medicines: (old?.medicines || []).filter((m) => m.id !== id),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-medicines'] })
      toast.success('Medicine deactivated')
      setDeleteTarget(null)
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-medicines', search, statusFilter], context.prev)
      }
      toast.error(err.message || 'Failed to delete medicine')
    },
  })

  const openCreateDialog = () => {
    setEditingMedicine(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (med: Medicine) => {
    setEditingMedicine(med)
    setForm({
      name: med.name,
      doseArray: med.doseArray || [],
      tab: med.tab,
      morning: med.morning ?? 0,
      afternoon: med.afternoon ?? 0,
      evening: med.evening ?? 0,
      description: med.description || '',
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingMedicine(null)
    setForm(emptyForm)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Medicine name is required')
      return
    }
    if (form.doseArray.length === 0) {
      toast.error('Add at least one dose option')
      return
    }
    if (editingMedicine) {
      updateMutation.mutate({ id: editingMedicine.id, body: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  const formatTiming = (m: Medicine) => `${m.morning ?? 0}-${m.afternoon ?? 0}-${m.evening ?? 0}`
  const hasTimings = (m: Medicine) => (m.morning ?? 0) > 0 || (m.afternoon ?? 0) > 0 || (m.evening ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Medicine Master
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your frequently prescribed medicines
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={openCreateDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
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

      {/* Medicine List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 mb-4">
            <Pill className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-sm font-medium">
            {search ? 'No medicines found' : 'No medicines added yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            {search
              ? 'Try a different search term or adjust the filter'
              : 'Add medicines you frequently prescribe for quick access when writing prescriptions'}
          </p>
          {!search && (
            <Button
              variant="outline"
              className="mt-4 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Medicine
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {medicines.map((med, i) => (
              <motion.div
                key={med.id}
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
                          <h3 className="font-semibold text-sm truncate">{med.name}</h3>
                          {med.status === 'Active' ? (
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
                          onClick={() => openEditDialog(med)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {med.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            onClick={() => setDeleteTarget(med)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Dose Tags */}
                    {med.doseArray && med.doseArray.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {med.doseArray.map((d, di) => (
                          <Badge
                            key={di}
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 gap-0.5',
                              di === 0
                                ? 'border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20'
                                : 'border-border text-muted-foreground'
                            )}
                          >
                            <Pill className="h-2.5 w-2.5" />
                            {d}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Timing + Duration row */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {hasTimings(med) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 gap-1 border-teal-300 text-teal-700 bg-teal-50/60 dark:border-teal-700 dark:text-teal-300 dark:bg-teal-900/20"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {formatTiming(med)}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 gap-1 border-border text-muted-foreground"
                      >
                        <CalendarDays className="h-2.5 w-2.5" />
                        {med.tab} day{med.tab !== 1 ? 's' : ''}
                      </Badge>
                      {med.description && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-900/20"
                        >
                          {med.description}
                        </Badge>
                      )}
                    </div>

                    {/* Mobile action buttons (always visible on small screens) */}
                    <div className="flex sm:hidden gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
                        onClick={() => openEditDialog(med)}
                      >
                        <Edit className="mr-1.5 h-3 w-3" />
                        Edit
                      </Button>
                      {med.status === 'Active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                          onClick={() => setDeleteTarget(med)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Medicine Name */}
            <div className="space-y-2">
              <Label htmlFor="med-name">
                Medicine Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="med-name"
                placeholder="e.g. Paracetamol"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
            </div>

            {/* Dose Tag Input */}
            <div className="space-y-2">
              <Label>Dose Options <span className="text-red-500">*</span></Label>
              <DoseTagInput
                tags={form.doseArray}
                onChange={(doseArray) => setForm({ ...form, doseArray })}
              />
              <p className="text-[11px] text-muted-foreground">
                Type a dose and press <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">,</kbd> to add. First option is the default.
              </p>
            </div>

            {/* Morning / Afternoon / Evening — Number inputs */}
            <div className="space-y-3">
              <Label>Timing (Tablet Count)</Label>
              <div className="grid gap-3">
                {/* Morning */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Morning Tablets</div>
                    <Input
                      type="number"
                      min={0}
                      value={form.morning}
                      onChange={(e) => setForm({ ...form, morning: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-24"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground italic">0 = skip</span>
                </div>

                {/* Afternoon */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <CloudSun className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Afternoon Tablets</div>
                    <Input
                      type="number"
                      min={0}
                      value={form.afternoon}
                      onChange={(e) => setForm({ ...form, afternoon: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-24"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground italic">0 = skip</span>
                </div>

                {/* Evening */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700/40">
                    <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Evening Tablets</div>
                    <Input
                      type="number"
                      min={0}
                      value={form.evening}
                      onChange={(e) => setForm({ ...form, evening: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-24"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground italic">0 = skip</span>
                </div>
              </div>
            </div>

            {/* Duration (Days) */}
            <div className="space-y-2">
              <Label htmlFor="med-tab">Duration (Days)</Label>
              <Input
                id="med-tab"
                type="number"
                min={1}
                value={form.tab}
                onChange={(e) => setForm({ ...form, tab: Math.max(1, parseInt(e.target.value) || 1) })}
                placeholder="e.g. 5"
              />
            </div>

            {/* Instructions (description) */}
            <div className="space-y-2">
              <Label htmlFor="med-desc">Instructions</Label>
              <Input
                id="med-desc"
                placeholder='e.g. AF (After Food), BF (Before Food)'
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Common: AF = After Food, BF = Before Food, AC = Before Meals, PC = After Meals
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
              {editingMedicine
                ? updateMutation.isPending ? 'Saving...' : 'Save Changes'
                : createMutation.isPending ? 'Adding...' : 'Add Medicine'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteTarget?.name}&quot;? It will be marked as inactive and won&apos;t appear in your active medicine list. You can reactivate it later by editing.
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
