'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Search, Plus, Edit, Trash2, Languages, Link2, Unlink,
  Pill, Sun, CloudSun, Moon, Clock, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MedicineInfo {
  id: string
  name: string
  dose: string
  morning: number
  afternoon: number
  evening: number
  tab: number
  description: string
  doseArray: string[]
}

interface LinkedMedicine {
  id: string
  findingId: string
  medicineId: string
  dose: string
  morning: number
  afternoon: number
  evening: number
  tab: number
  description: string
  createdAt: string
  medicine: MedicineInfo
}

interface FindingItem {
  id: string
  name: string
  nameEn: string
  status: string
  createdAt: string
  updatedAt: string
  medicines: LinkedMedicine[]
}

interface FindingFormData {
  name: string
  nameEn: string
  status: string
}

interface LinkMedicineFormData {
  medicineId: string
  dose: string
  morning: number
  afternoon: number
  evening: number
  tab: number
  description: string
}

const emptyFindingForm: FindingFormData = {
  name: '',
  nameEn: '',
  status: 'Active',
}

const emptyLinkForm: LinkMedicineFormData = {
  medicineId: '',
  dose: '',
  morning: 0,
  afternoon: 0,
  evening: 0,
  tab: 0,
  description: '',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function FindingsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Active')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FindingItem | null>(null)
  const [form, setForm] = useState<FindingFormData>(emptyFindingForm)
  const [deleteTarget, setDeleteTarget] = useState<FindingItem | null>(null)

  // Link medicine dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkFindingId, setLinkFindingId] = useState<string>('')
  const [linkForm, setLinkForm] = useState<LinkMedicineFormData>(emptyLinkForm)
  const [unlinkTarget, setUnlinkTarget] = useState<{ findingId: string; med: LinkedMedicine } | null>(null)

  // Build query string
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'All') params.set('status', statusFilter)
  const qs = params.toString()

  // Fetch findings
  const { data: findingsData, isLoading } = useQuery<{ findings: FindingItem[] }>({
    queryKey: ['doctor-findings', search, statusFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/findings${qs ? `?${qs}` : ''}`).then((r) =>
        r.json()
      ),
    staleTime: 10_000,
  })
  const findings = findingsData?.findings || []

  // Fetch medicines for the link dialog
  const { data: medicinesData } = useQuery<{ medicines: MedicineInfo[] }>({
    queryKey: ['doctor-medicines-link'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/medicines?status=Active').then((r) => r.json()),
    staleTime: 30_000,
    enabled: linkDialogOpen,
  })
  const availableMedicines = medicinesData?.medicines || []

  // Create finding mutation
  const createMutation = useMutation({
    mutationFn: (data: FindingFormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-findings'] })
      const prev = queryClient.getQueryData(['doctor-findings', search, statusFilter])
      queryClient.setQueryData(['doctor-findings', search, statusFilter], {
        findings: [
          { id: `temp-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), medicines: [] },
          ...(findingsData?.findings || []),
        ],
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-findings', search, statusFilter], ctx.prev)
      toast.error('Failed to create finding')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Finding created')
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['doctor-findings'] })
    },
  })

  // Update finding mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FindingFormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/findings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-findings'] })
      const prev = queryClient.getQueryData(['doctor-findings', search, statusFilter])
      queryClient.setQueryData(['doctor-findings', search, statusFilter], {
        findings: (findingsData?.findings || []).map((f) =>
          f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f
        ),
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-findings', search, statusFilter], ctx.prev)
      toast.error('Failed to update finding')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Finding updated')
      setDialogOpen(false)
      setEditingItem(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-findings'] })
    },
  })

  // Delete finding mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/findings/${id}`, { method: 'DELETE' }).then((r) =>
        r.json()
      ),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-findings'] })
      const prev = queryClient.getQueryData(['doctor-findings', search, statusFilter])
      queryClient.setQueryData(['doctor-findings', search, statusFilter], {
        findings: (findingsData?.findings || []).map((f) => (f.id === id ? { ...f, status: 'Inactive' } : f)),
      })
      return { prev }
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['doctor-findings', search, statusFilter], ctx.prev)
      toast.error('Failed to delete finding')
    },
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Finding deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-findings'] })
    },
  })

  // Link medicine mutation
  const linkMedMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: LinkMedicineFormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/findings/${findingId}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Medicine linked')
      setLinkDialogOpen(false)
      setLinkForm(emptyLinkForm)
      queryClient.invalidateQueries({ queryKey: ['doctor-findings'] })
    },
    onError: () => {
      toast.error('Failed to link medicine')
    },
  })

  // Unlink medicine mutation
  const unlinkMedMutation = useMutation({
    mutationFn: ({ findingId, medicineId }: { findingId: string; medicineId: string }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/findings/${findingId}/medicines?medicineId=${medicineId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Medicine unlinked')
      setUnlinkTarget(null)
      queryClient.invalidateQueries({ queryKey: ['doctor-findings'] })
    },
    onError: () => {
      toast.error('Failed to unlink medicine')
    },
  })

  /* ---- Dialog helpers ---- */
  const openCreate = () => {
    setEditingItem(null)
    setForm(emptyFindingForm)
    setDialogOpen(true)
  }

  const openEdit = (item: FindingItem) => {
    setEditingItem(item)
    setForm({ name: item.name, nameEn: item.nameEn, status: item.status })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Finding name is required'); return }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const openLinkDialog = (findingId: string) => {
    setLinkFindingId(findingId)
    setLinkForm(emptyLinkForm)
    setLinkDialogOpen(true)
  }

  const handleLinkSubmit = () => {
    if (!linkForm.medicineId) { toast.error('Please select a medicine'); return }
    linkMedMutation.mutate({ findingId: linkFindingId, data: linkForm })
  }

  const selectedMedicine = availableMedicines.find((m) => m.id === linkForm.medicineId)

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isLinking = linkMedMutation.isPending

  // Get effective values (override or master default)
  const getEffective = useCallback((
    overrideVal: string | number,
    masterVal: string | number,
    isInt: boolean
  ) => {
    if (isInt) {
      const o = typeof overrideVal === 'number' ? overrideVal : 0
      return o > 0 ? String(o) : String(masterVal)
    }
    return overrideVal ? String(overrideVal) : String(masterVal)
  }, [])

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Link2 className="h-6 w-6 text-teal-600" />
          Findings
        </h1>
        <p className="text-muted-foreground mt-1">Manage findings and link medicines for auto-fill during prescriptions.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search findings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
          Add Finding
        </Button>
      </div>

      {/* Findings list - Accordion layout */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Link2 className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No findings found.</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          <AnimatePresence>
            {findings.map((finding) => (
              <motion.div
                key={finding.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AccordionItem value={finding.id} className={cn(
                  'rounded-xl border bg-card overflow-hidden',
                  finding.status === 'Inactive' && 'opacity-50'
                )}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-teal-50/50 dark:hover:bg-teal-950/20">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{finding.name}</span>
                          {finding.nameEn && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Languages className="h-3 w-3" />
                              {finding.nameEn}
                            </span>
                          )}
                          <Badge className={cn(
                            'text-[10px]',
                            finding.status === 'Active'
                              ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          )}>
                            {finding.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300">
                            <Pill className="h-3 w-3 mr-1" />
                            {finding.medicines.length} medicine{finding.medicines.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                          onClick={(e) => { e.stopPropagation(); openEdit(finding) }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        {finding.status === 'Active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(finding) }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Linked medicines mini-table */}
                    {finding.medicines.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <Pill className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No medicines linked yet.</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50/50">
                                <TableHead className="text-xs">Medicine</TableHead>
                                <TableHead className="text-xs">Dose</TableHead>
                                <TableHead className="text-xs text-center">
                                  <Sun className="h-3 w-3 inline" />
                                </TableHead>
                                <TableHead className="text-xs text-center">
                                  <CloudSun className="h-3 w-3 inline" />
                                </TableHead>
                                <TableHead className="text-xs text-center">
                                  <Moon className="h-3 w-3 inline" />
                                </TableHead>
                                <TableHead className="text-xs text-center">
                                  <Clock className="h-3 w-3 inline" />
                                </TableHead>
                                <TableHead className="text-xs hidden sm:table-cell">Instructions</TableHead>
                                <TableHead className="text-xs text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {finding.medicines.map((fm) => (
                                <TableRow key={fm.medicineId}>
                                  <TableCell className="font-medium text-sm">{fm.medicine.name}</TableCell>
                                  <TableCell className="text-xs">
                                    <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-300 text-[10px]">
                                      {getEffective(fm.dose, fm.medicine.doseArray[0] || '-', false)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-center">
                                    {getEffective(fm.morning, fm.medicine.morning, true)}
                                  </TableCell>
                                  <TableCell className="text-xs text-center">
                                    {getEffective(fm.afternoon, fm.medicine.afternoon, true)}
                                  </TableCell>
                                  <TableCell className="text-xs text-center">
                                    {getEffective(fm.evening, fm.medicine.evening, true)}
                                  </TableCell>
                                  <TableCell className="text-xs text-center">
                                    {getEffective(fm.tab, fm.medicine.tab, true)}d
                                  </TableCell>
                                  <TableCell className="text-xs hidden sm:table-cell">
                                    {getEffective(fm.description, fm.medicine.description, false) !== '-' ? (
                                      <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 text-[10px]">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {getEffective(fm.description, fm.medicine.description, false)}
                                      </Badge>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => setUnlinkTarget({ findingId: finding.id, med: fm })}
                                    >
                                      <Unlink className="h-3 w-3 mr-1" />
                                      Unlink
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Link medicine button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-900/20"
                      onClick={() => openLinkDialog(finding.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Link Medicine
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </Accordion>
      )}

      {/* Create / Edit Finding Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingItem(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-teal-600" />
              {editingItem ? 'Edit Finding' : 'Add Finding'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="finding-name">Finding Name <span className="text-red-500">*</span></Label>
              <Input
                id="finding-name"
                placeholder="e.g. Viral Fever, Diabetes Type 2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finding-en" className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                Finding Name (English)
              </Label>
              <Input
                id="finding-en"
                placeholder="English translation (optional)"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null) }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.name.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update Finding' : 'Create Finding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Medicine Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={(v) => { setLinkDialogOpen(v); if (!v) setLinkForm(emptyLinkForm) }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-teal-600" />
              Link Medicine
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Medicine selector */}
            <div className="space-y-2">
              <Label htmlFor="med-select">Select Medicine <span className="text-red-500">*</span></Label>
              <Select value={linkForm.medicineId} onValueChange={(v) => setLinkForm({ ...linkForm, medicineId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a medicine..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMedicines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-medium">{m.name}</span>
                      {m.doseArray[0] && (
                        <span className="text-muted-foreground ml-2 text-xs">{m.doseArray[0]}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Override fields - shown after medicine is selected */}
            {selectedMedicine && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 border-t pt-4"
              >
                <p className="text-xs text-muted-foreground">
                  Leave fields at 0/empty to use the medicine default values.
                  <span className="ml-1 text-teal-600 font-medium">
                    Default: {selectedMedicine.doseArray[0] || '-'} | {selectedMedicine.morning}-{selectedMedicine.afternoon}-{selectedMedicine.evening} | {selectedMedicine.tab}d
                    {selectedMedicine.description ? ` | ${selectedMedicine.description}` : ''}
                  </span>
                </p>

                {/* Dose override */}
                <div className="space-y-2">
                  <Label htmlFor="link-dose" className="flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                    Dose Override
                  </Label>
                  <Input
                    id="link-dose"
                    placeholder={selectedMedicine.doseArray[0] || 'Use default'}
                    value={linkForm.dose}
                    onChange={(e) => setLinkForm({ ...linkForm, dose: e.target.value })}
                  />
                </div>

                {/* Timing overrides - M A E */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="link-morning" className="flex items-center gap-1 text-xs">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      Morning
                    </Label>
                    <Input
                      id="link-morning"
                      type="number"
                      min={0}
                      value={linkForm.morning}
                      onChange={(e) => setLinkForm({ ...linkForm, morning: parseInt(e.target.value) || 0 })}
                      className="text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">Default: {selectedMedicine.morning}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-afternoon" className="flex items-center gap-1 text-xs">
                      <CloudSun className="h-3.5 w-3.5 text-orange-500" />
                      Afternoon
                    </Label>
                    <Input
                      id="link-afternoon"
                      type="number"
                      min={0}
                      value={linkForm.afternoon}
                      onChange={(e) => setLinkForm({ ...linkForm, afternoon: parseInt(e.target.value) || 0 })}
                      className="text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">Default: {selectedMedicine.afternoon}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-evening" className="flex items-center gap-1 text-xs">
                      <Moon className="h-3.5 w-3.5 text-indigo-400" />
                      Evening
                    </Label>
                    <Input
                      id="link-evening"
                      type="number"
                      min={0}
                      value={linkForm.evening}
                      onChange={(e) => setLinkForm({ ...linkForm, evening: parseInt(e.target.value) || 0 })}
                      className="text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">Default: {selectedMedicine.evening}</p>
                  </div>
                </div>

                {/* Days override */}
                <div className="space-y-2">
                  <Label htmlFor="link-days" className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Duration Override (Days)
                  </Label>
                  <Input
                    id="link-days"
                    type="number"
                    min={0}
                    value={linkForm.tab}
                    onChange={(e) => setLinkForm({ ...linkForm, tab: parseInt(e.target.value) || 0 })}
                    className="w-32"
                  />
                  <p className="text-[10px] text-muted-foreground">Default: {selectedMedicine.tab} days</p>
                </div>

                {/* Description override */}
                <div className="space-y-2">
                  <Label htmlFor="link-desc" className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Instructions Override
                  </Label>
                  <Input
                    id="link-desc"
                    placeholder={selectedMedicine.description || 'Use default'}
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkDialogOpen(false); setLinkForm(emptyLinkForm) }}>Cancel</Button>
            <Button
              onClick={handleLinkSubmit}
              disabled={isLinking || !linkForm.medicineId}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isLinking ? 'Linking...' : 'Link Medicine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Finding confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Finding</AlertDialogTitle>
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

      {/* Unlink Medicine confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(v) => !v && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink &quot;{unlinkTarget?.med.medicine.name}&quot; from this finding?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => unlinkTarget && unlinkMedMutation.mutate({ findingId: unlinkTarget.findingId, medicineId: unlinkTarget.med.medicineId })}
              disabled={unlinkMedMutation.isPending}
            >
              {unlinkMedMutation.isPending ? 'Unlinking...' : 'Unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
