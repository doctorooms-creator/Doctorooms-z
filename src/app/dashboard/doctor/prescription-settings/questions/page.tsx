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
import { HelpCircle, Plus, Search, Edit, Trash2, Languages, Thermometer, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ComplaintOption {
  id: string
  coDetail: string
  coDetailEn: string
}

interface Question {
  id: string
  question: string
  questionEn: string
  explanation: string
  coId: string | null
  status: string
  createdAt: string
  updatedAt: string
  co: ComplaintOption | null
}

interface FormData {
  question: string
  questionEn: string
  explanation: string
  coId: string
  status: string
}

const emptyForm: FormData = {
  question: '',
  questionEn: '',
  explanation: '',
  coId: '',
  status: 'Active',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function QuestionsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [complaintFilter, setComplaintFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Question | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)

  // Fetch complaints for dropdown (active only)
  const { data: compData } = useQuery<{ complaints: ComplaintOption[] }>({
    queryKey: ['doctor-complaints-dropdown'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/complaints?status=Active').then((r) => r.json()),
    staleTime: 30_000,
  })
  const complaintOptions = compData?.complaints || []

  // Build query string
  const queryString = new URLSearchParams()
  if (search.trim()) queryString.set('search', search.trim())
  if (statusFilter !== 'All') queryString.set('status', statusFilter)
  if (complaintFilter) queryString.set('coId', complaintFilter)

  const { data, isLoading } = useQuery<{ questions: Question[] }>({
    queryKey: ['doctor-questions', search, statusFilter, complaintFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/questions?${queryString.toString()}`).then((r) => r.json()),
  })

  const questions = data?.questions || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to create') })
        return r.json()
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-questions'] })
      const prev = queryClient.getQueryData<{ questions: Question[] }>(['doctor-questions', search, statusFilter, complaintFilter])
      const co = complaintOptions.find((c) => c.id === newItem.coId) || null
      queryClient.setQueryData<{ questions: Question[] }>(['doctor-questions', search, statusFilter, complaintFilter], (old) => ({
        questions: [
          {
            id: 'optimistic-' + Date.now(),
            question: newItem.question,
            questionEn: newItem.questionEn,
            explanation: newItem.explanation,
            coId: newItem.coId || null,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            co,
          },
          ...(old?.questions || []),
        ],
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-questions'] })
      toast.success('Question added successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-questions', search, statusFilter, complaintFilter], context.prev)
      }
      toast.error(err.message || 'Failed to add question')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to update') })
        return r.json()
      }),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-questions'] })
      const prev = queryClient.getQueryData<{ questions: Question[] }>(['doctor-questions', search, statusFilter, complaintFilter])
      const co = complaintOptions.find((c) => c.id === body.coId) || null
      queryClient.setQueryData<{ questions: Question[] }>(['doctor-questions', search, statusFilter, complaintFilter], (old) => ({
        questions: (old?.questions || []).map((q) =>
          q.id === id
            ? {
                ...q,
                question: body.question ?? q.question,
                questionEn: body.questionEn ?? q.questionEn,
                explanation: body.explanation ?? q.explanation,
                coId: body.coId || null,
                status: body.status ?? q.status,
                co,
                updatedAt: new Date().toISOString(),
              }
            : q
        ),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-questions'] })
      toast.success('Question updated successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-questions', search, statusFilter, complaintFilter], context.prev)
      }
      toast.error(err.message || 'Failed to update question')
    },
  })

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/questions/${id}`, {
        method: 'DELETE',
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to delete') })
        return r.json()
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-questions'] })
      const prev = queryClient.getQueryData<{ questions: Question[] }>(['doctor-questions', search, statusFilter, complaintFilter])
      queryClient.setQueryData<{ questions: Question[] }>(['doctor-questions', search, statusFilter, complaintFilter], (old) => ({
        questions: (old?.questions || []).filter((q) => q.id !== id),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-questions'] })
      toast.success('Question deactivated')
      setDeleteTarget(null)
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-questions', search, statusFilter, complaintFilter], context.prev)
      }
      toast.error(err.message || 'Failed to delete question')
    },
  })

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (q: Question) => {
    setEditingItem(q)
    setForm({
      question: q.question,
      questionEn: q.questionEn || '',
      explanation: q.explanation || '',
      coId: q.coId || '',
      status: q.status,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const handleSubmit = () => {
    if (!form.question.trim()) {
      toast.error('Question is required')
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
            <HelpCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Questions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage follow-up questions linked to complaints
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={openCreateDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={complaintFilter} onValueChange={(v) => setComplaintFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Complaints" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Complaints</SelectItem>
            {complaintOptions.map((co) => (
              <SelectItem key={co.id} value={co.id}>
                {co.coDetail}{co.coDetailEn ? ` (${co.coDetailEn})` : ''}
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
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 mb-4">
            <HelpCircle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-sm font-medium">
            {search || complaintFilter ? 'No questions found' : 'No questions added yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            {search || complaintFilter
              ? 'Try a different search term or adjust the filters'
              : 'Add follow-up questions that you ask for each complaint during consultations'}
          </p>
          {!search && !complaintFilter && (
            <Button
              variant="outline"
              className="mt-4 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Question
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs">Question</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">English</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Explanation</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Linked Complaint</TableHead>
                  <TableHead className="w-[80px] text-xs">Status</TableHead>
                  <TableHead className="w-[80px] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {questions.map((q, i) => (
                    <motion.tr
                      key={q.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.02 }}
                      className="group border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-3">
                        <span className="text-sm font-medium">{q.question}</span>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        {q.questionEn ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Languages className="h-3 w-3 shrink-0" />
                            {q.questionEn}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 hidden lg:table-cell">
                        {q.explanation ? (
                          <span className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-2">
                            <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{q.explanation}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        {q.co ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20"
                          >
                            <Thermometer className="h-2.5 w-2.5 mr-1" />
                            {q.co.coDetail}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {q.status === 'Active' ? (
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
                            onClick={() => openEditDialog(q)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {q.status === 'Active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => setDeleteTarget(q)}
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

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-border">
            {questions.map((q) => (
              <div key={q.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate block">{q.question}</span>
                    {q.questionEn && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{q.questionEn}</p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{q.explanation}</p>
                    )}
                  </div>
                  {q.status === 'Active' ? (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 text-[10px] shrink-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-[10px] shrink-0">
                      Inactive
                    </Badge>
                  )}
                </div>
                {q.co && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0 border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20">
                    <Thermometer className="h-2.5 w-2.5 mr-1" />
                    {q.co.coDetail}
                  </Badge>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
                    onClick={() => openEditDialog(q)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  {q.status === 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                      onClick={() => setDeleteTarget(q)}
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
              {editingItem ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Question (Primary) */}
            <div className="space-y-2">
              <Label htmlFor="q-text">
                Question <span className="text-red-500">*</span>
              </Label>
              <Input
                id="q-text"
                placeholder="e.g. ક્યારથી તાવો આવે છે?"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
              <p className="text-[11px] text-muted-foreground">
                Primary language — shown in the prescription stepper
              </p>
            </div>

            {/* Question (English) */}
            <div className="space-y-2">
              <Label htmlFor="q-text-en" className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                Question (English)
              </Label>
              <Input
                id="q-text-en"
                placeholder="e.g. Since when do you have fever?"
                value={form.questionEn}
                onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Optional — used in print output
              </p>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label htmlFor="q-explanation" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Explanation
              </Label>
              <Textarea
                id="q-explanation"
                placeholder="Additional context or instructions for this question..."
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                rows={3}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Optional — helps the assistant understand the question
              </p>
            </div>

            {/* Linked Complaint Dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                Linked Complaint
              </Label>
              <Select value={form.coId} onValueChange={(v) => setForm({ ...form, coId: v === '__none__' ? '' : v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None (unlinked)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (unlinked)</SelectItem>
                  {complaintOptions.map((co) => (
                    <SelectItem key={co.id} value={co.id}>
                      {co.coDetail}{co.coDetailEn ? ` (${co.coDetailEn})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Optional — link this question to a specific complaint
              </p>
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
                : createMutation.isPending ? 'Adding...' : 'Add Question'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteTarget?.question}&quot;? It will be marked as inactive and won&apos;t appear in your active list. Linked suggestions will also become unavailable.
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
