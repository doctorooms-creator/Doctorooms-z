'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, Loader2, FlaskConical, X, GripVertical, ListOrdered, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============ Types ============

interface LabTestParameter {
  paramName: string
  shortCode: string
  unit: string
  normalMaleMin: number
  normalMaleMax: number
  normalFemaleMin: number
  normalFemaleMax: number
  normalChildMin: number
  normalChildMax: number
  sortOrder: number
}

interface LabTestMaster {
  id: string
  name: string
  shortCode: string
  category: string
  description: string
  specimenType: string
  reportDays: number
  rate: number
  status: string
  sortOrder: number
  _count: { parameters: number }
}

const CATEGORIES = ['Haematology', 'Biochemistry', 'Microbiology', 'Serology', 'Urine', 'Stool', 'Histopathology', 'Cytology', 'Molecular', 'Immunology', 'Hormones', 'Thyroid', 'Other']
const SPECIMEN_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'CSF', 'Serum', 'Plasma', 'Swab', 'Tissue', 'Other']

const emptyParameter = (): LabTestParameter => ({
  paramName: '',
  shortCode: '',
  unit: '',
  normalMaleMin: 0,
  normalMaleMax: 0,
  normalFemaleMin: 0,
  normalFemaleMax: 0,
  normalChildMin: 0,
  normalChildMax: 0,
  sortOrder: 0,
})

// ============ Main Component ============

export default function LabTestMasterClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formShortCode, setFormShortCode] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSpecimenType, setFormSpecimenType] = useState('')
  const [formReportDays, setFormReportDays] = useState(0)
  const [formRate, setFormRate] = useState(0)
  const [parameters, setParameters] = useState<LabTestParameter[]>([emptyParameter()])

  // Fetch test masters
  const { data, isLoading } = useQuery<{ testMasters: LabTestMaster[] }>({
    queryKey: ['lab-test-masters', categoryFilter, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (categoryFilter) params.set('category', categoryFilter)
      params.set('status', 'Active')
      if (search) params.set('search', search)
      return fetch(`/api/lab-test-masters?${params}`).then((r) => r.json())
    },
  })

  const testMasters = data?.testMasters || []

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (editingId) {
        const res = await fetch(`/api/lab-test-masters/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Update failed') }
        return res.json()
      } else {
        const res = await fetch('/api/lab-test-masters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Create failed') }
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-masters'] })
      toast.success(editingId ? 'Test updated successfully' : 'Test created successfully')
      closeDialog()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lab-test-masters/${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Delete failed') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-masters'] })
      toast.success('Test deleted successfully')
      setDeleteDialogOpen(false)
      setDeletingId(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Fetch detail when editing
  const { data: detailData, isLoading: detailLoading } = useQuery<{ testMaster: LabTestMaster & { parameters: LabTestParameter[] } }>({
    queryKey: ['lab-test-master-detail', editingId],
    queryFn: () => fetch(`/api/lab-test-masters/${editingId}`).then((r) => r.json()),
    enabled: !!editingId,
  })

  // Populate form on edit
  useEffect(() => {
    if (detailData?.testMaster && editingId) {
      const t = detailData.testMaster
      setFormName(t.name)
      setFormShortCode(t.shortCode)
      setFormCategory(t.category)
      setFormDescription(t.description)
      setFormSpecimenType(t.specimenType)
      setFormReportDays(t.reportDays)
      setFormRate(t.rate)
      setParameters(t.parameters.length > 0 ? t.parameters : [emptyParameter()])
    }
  }, [detailData, editingId])

  function openCreate() {
    setEditingId(null)
    setFormName('')
    setFormShortCode('')
    setFormCategory('')
    setFormDescription('')
    setFormSpecimenType('')
    setFormReportDays(0)
    setFormRate(0)
    setParameters([emptyParameter()])
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
  }

  function handleSave() {
    if (!formName.trim()) { toast.error('Test name is required'); return }

    const validParams = parameters.filter((p) => p.paramName.trim() !== '')
    saveMutation.mutate({
      name: formName,
      shortCode: formShortCode,
      category: formCategory,
      description: formDescription,
      specimenType: formSpecimenType,
      reportDays: formReportDays,
      rate: formRate,
      parameters: validParams.map((p, idx) => ({ ...p, sortOrder: idx })),
    })
  }

  function addParameter() {
    setParameters([...parameters, { ...emptyParameter(), sortOrder: parameters.length }])
  }

  function removeParameter(index: number) {
    if (parameters.length <= 1) return
    setParameters(parameters.filter((_, i) => i !== index))
  }

  function updateParameter(index: number, field: keyof LabTestParameter, value: string | number) {
    const updated = [...parameters]
    updated[index] = { ...updated[index], [field]: value }
    setParameters(updated)
  }

  function getCategoryBadgeColor(cat: string) {
    const colors: Record<string, string> = {
      Haematology: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
      Biochemistry: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
      Microbiology: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
      Serology: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
      Urine: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
      Thyroid: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
      Hormones: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
    }
    return colors[cat] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Lab Test Master</h1>
          <p className="text-sm text-muted-foreground">Manage lab tests and their parameters</p>
        </div>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" /> Add Test
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : testMasters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No lab tests found</p>
              <p className="text-xs text-muted-foreground">Click &quot;Add Test&quot; to create one</p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Code</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Specimen</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Rate</TableHead>
                    <TableHead className="text-center">Params</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testMasters.map((test, idx) => (
                    <TableRow key={test.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{test.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{test.shortCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{test.shortCode}</code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {test.category && (
                          <Badge variant="secondary" className={getCategoryBadgeColor(test.category)}>
                            {test.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{test.specimenType || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-right font-medium">
                        {test.rate > 0 ? `₹${test.rate}` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          <ListOrdered className="mr-1 h-3 w-3" />
                          {test._count.parameters}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(test.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            onClick={() => { setDeletingId(test.id); setDeleteDialogOpen(true) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Lab Test' : 'Add Lab Test'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update test details and parameters' : 'Create a new lab test with its parameters'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && editingId ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Basic Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Test Name *</Label>
                  <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Complete Blood Count" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortCode">Short Code</Label>
                  <Input id="shortCode" value={formShortCode} onChange={(e) => setFormShortCode(e.target.value)} placeholder="e.g. CBC" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specimen Type</Label>
                  <Select value={formSpecimenType} onValueChange={setFormSpecimenType}>
                    <SelectTrigger><SelectValue placeholder="Select specimen" /></SelectTrigger>
                    <SelectContent>
                      {SPECIMEN_TYPES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportDays">Report Days</Label>
                  <Input id="reportDays" type="number" min={0} value={formReportDays} onChange={(e) => setFormReportDays(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (₹)</Label>
                  <Input id="rate" type="number" min={0} step={0.01} value={formRate} onChange={(e) => setFormRate(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description of the test" />
              </div>

              {/* Parameters Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Parameters</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                    <Plus className="mr-1 h-3 w-3" /> Add Parameter
                  </Button>
                </div>

                <div className="max-h-[300px] space-y-3 overflow-y-auto rounded-lg border p-3">
                  <AnimatePresence>
                    {parameters.map((param, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Parameter {idx + 1}</span>
                          </div>
                          {parameters.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeParameter(idx)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Name *</Label>
                            <Input
                              value={param.paramName}
                              onChange={(e) => updateParameter(idx, 'paramName', e.target.value)}
                              placeholder="e.g. Haemoglobin"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Code</Label>
                            <Input
                              value={param.shortCode}
                              onChange={(e) => updateParameter(idx, 'shortCode', e.target.value)}
                              placeholder="e.g. Hb"
                              className="h-8 text-sm uppercase"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={param.unit}
                              onChange={(e) => updateParameter(idx, 'unit', e.target.value)}
                              placeholder="e.g. g/dL"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          <div className="rounded border p-2">
                            <p className="mb-1 text-xs font-medium text-teal-600 dark:text-teal-400">Male Range</p>
                            <div className="flex gap-2">
                              <Input
                                type="number" step="any"
                                value={param.normalMaleMin || ''}
                                onChange={(e) => updateParameter(idx, 'normalMaleMin', Number(e.target.value))}
                                placeholder="Min" className="h-7 text-xs"
                              />
                              <Input
                                type="number" step="any"
                                value={param.normalMaleMax || ''}
                                onChange={(e) => updateParameter(idx, 'normalMaleMax', Number(e.target.value))}
                                placeholder="Max" className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="rounded border p-2">
                            <p className="mb-1 text-xs font-medium text-pink-600 dark:text-pink-400">Female Range</p>
                            <div className="flex gap-2">
                              <Input
                                type="number" step="any"
                                value={param.normalFemaleMin || ''}
                                onChange={(e) => updateParameter(idx, 'normalFemaleMin', Number(e.target.value))}
                                placeholder="Min" className="h-7 text-xs"
                              />
                              <Input
                                type="number" step="any"
                                value={param.normalFemaleMax || ''}
                                onChange={(e) => updateParameter(idx, 'normalFemaleMax', Number(e.target.value))}
                                placeholder="Max" className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="rounded border p-2">
                            <p className="mb-1 text-xs font-medium text-amber-600 dark:text-amber-400">Child Range</p>
                            <div className="flex gap-2">
                              <Input
                                type="number" step="any"
                                value={param.normalChildMin || ''}
                                onChange={(e) => updateParameter(idx, 'normalChildMin', Number(e.target.value))}
                                placeholder="Min" className="h-7 text-xs"
                              />
                              <Input
                                type="number" step="any"
                                value={param.normalChildMax || ''}
                                onChange={(e) => updateParameter(idx, 'normalChildMax', Number(e.target.value))}
                                placeholder="Max" className="h-7 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Update Test' : 'Create Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lab test? It will be marked as inactive. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
