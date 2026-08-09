'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Pill, Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Medicine {
  id: string
  name: string
  morning: string
  afternoon: string
  evening: string
  dose: string
  tab: number
  description: string
  status: string
}

interface MedicineFormData {
  name: string
  morning: string
  afternoon: string
  evening: string
  dose: string
  tab: number
  description: string
  status: string
}

const emptyForm: MedicineFormData = {
  name: '',
  morning: '',
  afternoon: '',
  evening: '',
  dose: '',
  tab: 1,
  description: '',
  status: 'Active',
}

export default function PharmacistMedicinesPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<MedicineFormData>(emptyForm)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ medicines: Medicine[] }>({
    queryKey: ['pharmacist-medicines', search],
    queryFn: () =>
      fetch(
        `/api/dashboard/pharmacist/medicines?search=${encodeURIComponent(search)}`
      ).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: MedicineFormData) =>
      fetch('/api/dashboard/pharmacist/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacist-medicines'] })
      toast.success('Medicine added successfully')
      closeDialog()
    },
    onError: () => {
      toast.error('Failed to add medicine')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: MedicineFormData }) =>
      fetch('/api/dashboard/pharmacist/medicines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacist-medicines'] })
      toast.success('Medicine updated successfully')
      closeDialog()
    },
    onError: () => {
      toast.error('Failed to update medicine')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/dashboard/pharmacist/medicines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacist-medicines'] })
      toast.success('Medicine deleted successfully')
      setDeleteOpen(false)
      setDeletingId(null)
    },
    onError: () => {
      toast.error('Failed to delete medicine')
    },
  })

  const medicines = data?.medicines ?? []

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (med: Medicine) => {
    setEditingId(med.id)
    setForm({
      name: med.name,
      morning: med.morning,
      afternoon: med.afternoon,
      evening: med.evening,
      dose: med.dose,
      tab: med.tab,
      description: med.description,
      status: med.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Medicine name is required')
      return
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by medicine name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {/* Medicine table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead className="text-center">Morning</TableHead>
                <TableHead className="text-center">Afternoon</TableHead>
                <TableHead className="text-center">Evening</TableHead>
                <TableHead className="text-center">Dosage</TableHead>
                <TableHead className="text-center">Tabs</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="mx-auto h-4 w-8 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="mx-auto h-4 w-8 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="mx-auto h-4 w-8 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="mx-auto h-4 w-10 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="mx-auto h-4 w-8 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="mx-auto h-5 w-14 animate-pulse rounded-full bg-muted" /></TableCell>
                    <TableCell><div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <Pill className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? 'No medicines match your search'
                        : 'No medicines in the inventory yet'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((med, i) => (
                  <motion.tr
                    key={med.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-teal-500" />
                        <div>
                          <p className="text-sm font-medium">{med.name}</p>
                          {med.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{med.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {med.morning ? (
                        <span className="inline-flex items-center rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                          {med.morning}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {med.afternoon ? (
                        <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                          {med.afternoon}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {med.evening ? (
                        <span className="inline-flex items-center rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
                          {med.evening}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">{med.dose || '—'}</TableCell>
                    <TableCell className="text-center text-sm">{med.tab}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          med.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
                        )}
                      >
                        {med.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/50"
                          onClick={() => openEdit(med)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit medicine dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="med-name">Medicine Name *</Label>
              <Input
                id="med-name"
                placeholder="e.g. Paracetamol 500mg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="med-morning">Morning</Label>
                <Input
                  id="med-morning"
                  placeholder="e.g. 1"
                  value={form.morning}
                  onChange={(e) => setForm({ ...form, morning: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-afternoon">Afternoon</Label>
                <Input
                  id="med-afternoon"
                  placeholder="e.g. 1"
                  value={form.afternoon}
                  onChange={(e) => setForm({ ...form, afternoon: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-evening">Evening</Label>
                <Input
                  id="med-evening"
                  placeholder="e.g. 1"
                  value={form.evening}
                  onChange={(e) => setForm({ ...form, evening: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="med-dose">Dosage</Label>
                <Input
                  id="med-dose"
                  placeholder="e.g. After meal"
                  value={form.dose}
                  onChange={(e) => setForm({ ...form, dose: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-tab">Tabs</Label>
                <Input
                  id="med-tab"
                  type="number"
                  min={1}
                  value={form.tab}
                  onChange={(e) => setForm({ ...form, tab: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="med-desc">Description</Label>
              <Textarea
                id="med-desc"
                placeholder="Additional notes about this medicine..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            {editingId && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Switch
                  checked={form.status === 'Active'}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, status: checked ? 'Active' : 'Inactive' })
                  }
                />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {form.status === 'Active' ? 'Active — visible in inventory' : 'Inactive — hidden from inventory'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                {isPending
                  ? editingId ? 'Updating...' : 'Adding...'
                  : editingId ? 'Update Medicine' : 'Add Medicine'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
