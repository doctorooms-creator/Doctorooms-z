'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Search, Plus, Edit, Trash2, Table as TableIcon, Grid3X3, Type,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TemplateItem {
  id: string
  name: string
  rows: number
  cols: number
  headerLabel: string
  colsLabel: string
  footerLabel: string
  extraLabel: string
  status: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  rows: number
  cols: number
  headerLabels: string[]
  rowLabels: string[]
  footerLabel: string
  extraLabel: string
  status: string
}

const emptyForm: FormData = {
  name: '',
  rows: 3,
  cols: 2,
  headerLabels: [],
  rowLabels: [],
  footerLabel: '',
  extraLabel: '',
  status: 'Active',
}

/* ------------------------------------------------------------------ */
/*  Table Preview Component                                           */
/* ------------------------------------------------------------------ */

function TablePreview({
  rows,
  cols,
  headerLabels,
  rowLabels,
  footerLabel,
  extraLabel,
  compact,
}: {
  rows: number
  cols: number
  headerLabels: string[]
  rowLabels: string[]
  footerLabel: string
  extraLabel: string
  compact?: boolean
}) {
  const cellClass = compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs'

  return (
    <div className="overflow-x-auto rounded-lg border">
      {extraLabel && (
        <div className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/30 border-b text-xs font-medium text-teal-700 dark:text-teal-300">
          {extraLabel}
        </div>
      )}
      <table className="w-full border-collapse">
        {/* Column headers */}
        {headerLabels.length > 0 && (
          <thead>
            <tr>
              <th className={cn(cellClass, 'bg-teal-50 dark:bg-teal-950/30 border-b border-r font-medium text-teal-700 dark:text-teal-300')}>
                {rowLabels.length > 0 ? '' : '#'}
              </th>
              {headerLabels.map((h, i) => (
                <th key={i} className={cn(cellClass, 'bg-teal-50 dark:bg-teal-950/30 border-b border-r font-medium text-teal-700 dark:text-teal-300 last:border-r-0')}>
                  {h || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri}>
              {/* Row label */}
              <td className={cn(cellClass, 'bg-gray-50 dark:bg-gray-900/50 border-b border-r font-medium text-muted-foreground whitespace-nowrap')}
                >
                  {rowLabels[ri] || `Row ${ri + 1}`}
                </td>
              {/* Data cells */}
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci} className={cn(cellClass, 'border-b border-r last:border-r-0')}>
                  <span className="text-muted-foreground/30">-</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footerLabel && (
        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/30 border-t text-[10px] text-muted-foreground">
          {footerLabel}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function TableTemplatesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null)

  // Build query string
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'All') params.set('status', statusFilter)
  const qs = params.toString()

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery<{ templates: TemplateItem[] }>({
    queryKey: ['doctor-table-templates', search, statusFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/table-templates${qs ? `?${qs}` : ''}`).then((r) =>
        r.json()
      ),
    staleTime: 10_000,
  })
  const templates = templatesData?.templates || []

  // Sync headerLabels / rowLabels arrays when rows/cols change
  const syncArrays = useCallback((prev: FormData, newRows: number, newCols: number): FormData => {
    const h = [...prev.headerLabels]
    while (h.length < newCols) h.push('')
    if (h.length > newCols) h.length = newCols

    const r = [...prev.rowLabels]
    while (r.length < newRows) r.push('')
    if (r.length > newRows) r.length = newRows

    return { ...prev, rows: newRows, cols: newCols, headerLabels: h, rowLabels: r }
  }, [])

  const handleRowsChange = (val: number) => {
    setForm((prev) => syncArrays(prev, Math.max(1, Math.min(val, 20)), prev.cols))
  }

  const handleColsChange = (val: number) => {
    setForm((prev) => syncArrays(prev, prev.rows, Math.max(1, Math.min(val, 10))))
  }

  const handleHeaderLabelChange = (index: number, value: string) => {
    setForm((prev) => {
      const h = [...prev.headerLabels]
      h[index] = value
      return { ...prev, headerLabels: h }
    })
  }

  const handleRowLabelChange = (index: number, value: string) => {
    setForm((prev) => {
      const r = [...prev.rowLabels]
      r[index] = value
      return { ...prev, rowLabels: r }
    })
  }

  // Parse JSON strings for existing templates
  const parseJsonArray = (str: string): string[] => {
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) return parsed
    } catch { /* ignore */ }
    return []
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/table-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          rows: data.rows,
          cols: data.cols,
          headerLabel: data.headerLabels,
          colsLabel: data.rowLabels,
          footerLabel: data.footerLabel ? [data.footerLabel] : [],
          extraLabel: data.extraLabel,
          status: data.status,
        }),
      }).then((r) => r.json()),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-table-templates'] })
      const prev = queryClient.getQueryData(['doctor-table-templates', search, statusFilter])
      queryClient.setQueryData(['doctor-table-templates', search, statusFilter], {
        templates: [
          { id: `temp-${Date.now()}`, ...data, headerLabel: JSON.stringify(data.headerLabels), colsLabel: JSON.stringify(data.rowLabels), footerLabel: JSON.stringify(data.footerLabel ? [data.footerLabel] : []), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ...(templatesData?.templates || []),
        ],
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-table-templates', search, statusFilter], ctx.prev)
      toast.error('Failed to create template')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Template created')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['doctor-table-templates'] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/table-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          rows: data.rows,
          cols: data.cols,
          headerLabel: data.headerLabels,
          colsLabel: data.rowLabels,
          footerLabel: data.footerLabel ? [data.footerLabel] : [],
          extraLabel: data.extraLabel,
          status: data.status,
        }),
      }).then((r) => r.json()),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-table-templates'] })
      const prev = queryClient.getQueryData(['doctor-table-templates', search, statusFilter])
      queryClient.setQueryData(['doctor-table-templates', search, statusFilter], {
        templates: (templatesData?.templates || []).map((t) =>
          t.id === id ? { ...t, name: data.name, rows: data.rows, cols: data.cols, headerLabel: JSON.stringify(data.headerLabels), colsLabel: JSON.stringify(data.rowLabels), footerLabel: JSON.stringify(data.footerLabel ? [data.footerLabel] : []), extraLabel: data.extraLabel, updatedAt: new Date().toISOString() } : t
        ),
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-table-templates', search, statusFilter], ctx.prev)
      toast.error('Failed to update template')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Template updated')
      setDialogOpen(false)
      setEditingItem(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-table-templates'] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/table-templates/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-table-templates'] })
      const prev = queryClient.getQueryData(['doctor-table-templates', search, statusFilter])
      queryClient.setQueryData(['doctor-table-templates', search, statusFilter], {
        templates: (templatesData?.templates || []).map((t) => (t.id === id ? { ...t, status: 'Inactive' } : t)),
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-table-templates', search, statusFilter], ctx.prev)
      toast.error('Failed to delete template')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Template deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-table-templates'] })
    },
  })

  /* ---- Dialog helpers ---- */
  const openCreate = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item: TemplateItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      rows: item.rows,
      cols: item.cols,
      headerLabels: parseJsonArray(item.headerLabel),
      rowLabels: parseJsonArray(item.colsLabel),
      footerLabel: parseJsonArray(item.footerLabel)[0] || '',
      extraLabel: item.extraLabel,
      status: item.status,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Template name is required'); return }
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
          <TableIcon className="h-6 w-6 text-teal-600" />
          Table Templates
        </h1>
        <p className="text-muted-foreground mt-1">Manage table templates for diagnosis data in prescriptions.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
          Add Template
        </Button>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <TableIcon className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No table templates found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className={cn(
                  'rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow',
                  template.status === 'Inactive' && 'opacity-50'
                )}>
                  {/* Card header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Grid3X3 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="font-semibold text-sm truncate">{template.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px] border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300">
                        {template.rows}x{template.cols}
                      </Badge>
                      <Badge className={cn(
                        'text-[10px]',
                        template.status === 'Active'
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {template.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Live table preview */}
                  <div className="p-3">
                    <TablePreview
                      rows={template.rows}
                      cols={template.cols}
                      headerLabels={parseJsonArray(template.headerLabel)}
                      rowLabels={parseJsonArray(template.colsLabel)}
                      footerLabel={parseJsonArray(template.footerLabel)[0] || ''}
                      extraLabel={template.extraLabel}
                      compact
                    />
                  </div>

                  {/* Card actions */}
                  <div className="px-4 py-2.5 border-t flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                      onClick={() => openEdit(template)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    {template.status === 'Active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteTarget(template)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingItem(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-teal-600" />
              {editingItem ? 'Edit Table Template' : 'Add Table Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Template Name <span className="text-red-500">*</span></Label>
              <Input
                id="tpl-name"
                placeholder="e.g. Blood Report, Urine Analysis"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Rows and Cols */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-rows" className="flex items-center gap-1">
                  <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Rows
                </Label>
                <Input
                  id="tpl-rows"
                  type="number"
                  min={1}
                  max={20}
                  value={form.rows}
                  onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-cols" className="flex items-center gap-1">
                  <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                  Columns
                </Label>
                <Input
                  id="tpl-cols"
                  type="number"
                  min={1}
                  max={10}
                  value={form.cols}
                  onChange={(e) => handleColsChange(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Column Headers */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                Column Headers
              </Label>
              <p className="text-[10px] text-muted-foreground">Labels for each column in the table.</p>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: form.cols }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Col {i + 1}</span>
                    <Input
                      placeholder={`Header ${i + 1}`}
                      value={form.headerLabels[i] || ''}
                      onChange={(e) => handleHeaderLabelChange(i, e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Row Labels */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                Row Labels
              </Label>
              <p className="text-[10px] text-muted-foreground">Labels for each row in the table.</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from({ length: form.rows }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Row {i + 1}</span>
                    <Input
                      placeholder={`Label ${i + 1}`}
                      value={form.rowLabels[i] || ''}
                      onChange={(e) => handleRowLabelChange(i, e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Text */}
            <div className="space-y-2">
              <Label htmlFor="tpl-footer">Footer Text</Label>
              <Textarea
                id="tpl-footer"
                placeholder="Optional footer text for the table"
                value={form.footerLabel}
                onChange={(e) => setForm({ ...form, footerLabel: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>

            {/* Extra Label */}
            <div className="space-y-2">
              <Label htmlFor="tpl-extra" className="flex items-center gap-1">
                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                Extra Label (Title)
              </Label>
              <Input
                id="tpl-extra"
                placeholder="Optional title shown above the table"
                value={form.extraLabel}
                onChange={(e) => setForm({ ...form, extraLabel: e.target.value })}
              />
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

            {/* Live Preview in dialog */}
            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center gap-1 text-teal-700 dark:text-teal-300">
                <TableIcon className="h-3.5 w-3.5" />
                Live Preview
              </Label>
              <TablePreview
                rows={form.rows}
                cols={form.cols}
                headerLabels={form.headerLabels}
                rowLabels={form.rowLabels}
                footerLabel={form.footerLabel}
                extraLabel={form.extraLabel}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null) }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.name.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This will mark it as inactive. You can reactivate it later.
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
