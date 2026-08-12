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
import { Tag, Plus, Search, Edit, Trash2, Languages, Ruler, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LabelItem {
  id: string
  label: string
  labelEn: string
  unit: string
  showUnit: boolean
  status: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  label: string
  labelEn: string
  unit: string
  showUnit: boolean
  status: string
}

const emptyForm: FormData = {
  label: '',
  labelEn: '',
  unit: '',
  showUnit: true,
  status: 'Active',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function LabelsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LabelItem | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<LabelItem | null>(null)

  // Build query string
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'All') params.set('status', statusFilter)
  const qs = params.toString()

  // Fetch labels
  const { data: labelsData, isLoading } = useQuery<{ labels: LabelItem[] }>({
    queryKey: ['doctor-labels', search, statusFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/labels${qs ? `?${qs}` : ''}`).then((r) =>
        r.json()
      ),
    staleTime: 10_000,
  })
  const labels = labelsData?.labels || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-labels'] })
      const prev = queryClient.getQueryData(['doctor-labels', search, statusFilter])
      queryClient.setQueryData(['doctor-labels', search, statusFilter], {
        labels: [
          { id: `temp-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ...(labelsData?.labels || []),
        ],
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-labels', search, statusFilter], ctx.prev)
      toast.error('Failed to create label')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Label created')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['doctor-labels'] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/labels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-labels'] })
      const prev = queryClient.getQueryData(['doctor-labels', search, statusFilter])
      queryClient.setQueryData(['doctor-labels', search, statusFilter], {
        labels: (labelsData?.labels || []).map((l) =>
          l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
        ),
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-labels', search, statusFilter], ctx.prev)
      toast.error('Failed to update label')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Label updated')
      setDialogOpen(false)
      setEditingItem(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-labels'] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/labels/${id}`, { method: 'DELETE' }).then((r) =>
        r.json()
      ),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-labels'] })
      const prev = queryClient.getQueryData(['doctor-labels', search, statusFilter])
      queryClient.setQueryData(['doctor-labels', search, statusFilter], {
        labels: (labelsData?.labels || []).map((l) => (l.id === id ? { ...l, status: 'Inactive' } : l)),
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-labels', search, statusFilter], ctx.prev)
      toast.error('Failed to delete label')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Label deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-labels'] })
    },
  })

  /* ---- Dialog helpers ---- */
  const openCreate = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item: LabelItem) => {
    setEditingItem(item)
    setForm({ label: item.label, labelEn: item.labelEn, unit: item.unit, showUnit: item.showUnit, status: item.status })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.label.trim()) { toast.error('Label name is required'); return }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Tag className="h-6 w-6 text-teal-600" />
          Labels
        </h1>
        <p className="text-muted-foreground mt-1">Manage labels for vitals and lab values.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search labels..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="All">All</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700 text-white ml-auto">
          <Plus className="h-4 w-4 mr-1" />
          Add Label
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      ) : labels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Tag className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No labels found.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50/50">
                <TableHead>Label</TableHead>
                <TableHead className="hidden md:table-cell">English</TableHead>
                <TableHead className="hidden sm:table-cell">Unit</TableHead>
                <TableHead className="hidden lg:table-cell">Show Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {labels.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={cn('border-b last:border-b-0', item.status === 'Inactive' && 'opacity-50')}
                  >
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {item.labelEn || '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {item.unit ? (
                        <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300">
                          <Ruler className="h-3 w-3 mr-1" />
                          {item.unit}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={cn(
                          item.showUnit
                            ? 'border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300'
                            : 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                        )}
                      >
                        {item.showUnit ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                        {item.showUnit ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-[10px]',
                          item.status === 'Active'
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        {item.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
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
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingItem(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-teal-600" />
              {editingItem ? 'Edit Label' : 'Add Label'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="label-name">Label Name <span className="text-red-500">*</span></Label>
              <Input
                id="label-name"
                placeholder="e.g. Blood Sugar, Hemoglobin"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-en" className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                Label (English)
              </Label>
              <Input
                id="label-en"
                placeholder="English translation (optional)"
                value={form.labelEn}
                onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-unit" className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                Unit
              </Label>
              <Input
                id="label-unit"
                placeholder="e.g. mg/dL, %, mmHg"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Show Unit</Label>
              <Select
                value={form.showUnit ? 'yes' : 'no'}
                onValueChange={(v) => setForm({ ...form, showUnit: v === 'yes' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Show unit in print</SelectItem>
                  <SelectItem value="no">No - Hide unit in print</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingItem && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
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
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null) }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.label.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update Label' : 'Create Label'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;? This will mark it as inactive. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
