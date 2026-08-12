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
import { Lightbulb, Plus, Search, Edit, Trash2, Languages, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuestionOption {
  id: string
  question: string
  questionEn: string
}

interface Suggestion {
  id: string
  questionId: string
  suggestions: string
  suggestionsEn: string
  status: string
  createdAt: string
  updatedAt: string
  question: QuestionOption
}

interface FormData {
  questionId: string
  suggestions: string
  suggestionsEn: string
  status: string
}

const emptyForm: FormData = {
  questionId: '',
  suggestions: '',
  suggestionsEn: '',
  status: 'Active',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function SuggestionsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active')
  const [questionFilter, setQuestionFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Suggestion | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Suggestion | null>(null)

  // Fetch questions for dropdown (active only)
  const { data: qData } = useQuery<{ questions: QuestionOption[] }>({
    queryKey: ['doctor-questions-dropdown'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/questions?status=Active').then((r) => r.json()),
    staleTime: 30_000,
  })
  const questionOptions = qData?.questions || []

  // Build query string
  const queryString = new URLSearchParams()
  if (search.trim()) queryString.set('search', search.trim())
  if (statusFilter !== 'All') queryString.set('status', statusFilter)
  if (questionFilter) queryString.set('questionId', questionFilter)

  const { data, isLoading } = useQuery<{ suggestions: Suggestion[] }>({
    queryKey: ['doctor-suggestions', search, statusFilter, questionFilter],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/suggestions?${queryString.toString()}`).then((r) => r.json()),
  })

  const suggestions = data?.suggestions || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetch('/api/dashboard/doctor/prescription-settings/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to create') })
        return r.json()
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-suggestions'] })
      const prev = queryClient.getQueryData<{ suggestions: Suggestion[] }>(['doctor-suggestions', search, statusFilter, questionFilter])
      const q = questionOptions.find((opt) => opt.id === newItem.questionId)
      queryClient.setQueryData<{ suggestions: Suggestion[] }>(['doctor-suggestions', search, statusFilter, questionFilter], (old) => ({
        suggestions: [
          {
            id: 'optimistic-' + Date.now(),
            questionId: newItem.questionId,
            suggestions: newItem.suggestions,
            suggestionsEn: newItem.suggestionsEn,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            question: q || { id: newItem.questionId, question: '', questionEn: '' },
          },
          ...(old?.suggestions || []),
        ],
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-suggestions'] })
      toast.success('Suggestion added successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-suggestions', search, statusFilter, questionFilter], context.prev)
      }
      toast.error(err.message || 'Failed to add suggestion')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      fetch(`/api/dashboard/doctor/prescription-settings/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to update') })
        return r.json()
      }),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-suggestions'] })
      const prev = queryClient.getQueryData<{ suggestions: Suggestion[] }>(['doctor-suggestions', search, statusFilter, questionFilter])
      const q = questionOptions.find((opt) => opt.id === body.questionId)
      queryClient.setQueryData<{ suggestions: Suggestion[] }>(['doctor-suggestions', search, statusFilter, questionFilter], (old) => ({
        suggestions: (old?.suggestions || []).map((s) =>
          s.id === id
            ? {
                ...s,
                questionId: body.questionId ?? s.questionId,
                suggestions: body.suggestions ?? s.suggestions,
                suggestionsEn: body.suggestionsEn ?? s.suggestionsEn,
                status: body.status ?? s.status,
                question: q || s.question,
                updatedAt: new Date().toISOString(),
              }
            : s
        ),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-suggestions'] })
      toast.success('Suggestion updated successfully')
      closeDialog()
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-suggestions', search, statusFilter, questionFilter], context.prev)
      }
      toast.error(err.message || 'Failed to update suggestion')
    },
  })

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/prescription-settings/suggestions/${id}`, {
        method: 'DELETE',
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed to delete') })
        return r.json()
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['doctor-suggestions'] })
      const prev = queryClient.getQueryData<{ suggestions: Suggestion[] }>(['doctor-suggestions', search, statusFilter, questionFilter])
      queryClient.setQueryData<{ suggestions: Suggestion[] }>(['doctor-suggestions', search, statusFilter, questionFilter], (old) => ({
        suggestions: (old?.suggestions || []).filter((s) => s.id !== id),
      }))
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-suggestions'] })
      toast.success('Suggestion deactivated')
      setDeleteTarget(null)
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['doctor-suggestions', search, statusFilter, questionFilter], context.prev)
      }
      toast.error(err.message || 'Failed to delete suggestion')
    },
  })

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (s: Suggestion) => {
    setEditingItem(s)
    setForm({
      questionId: s.questionId,
      suggestions: s.suggestions,
      suggestionsEn: s.suggestionsEn || '',
      status: s.status,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const handleSubmit = () => {
    if (!form.questionId.trim()) {
      toast.error('Parent question is required')
      return
    }
    if (!form.suggestions.trim()) {
      toast.error('Suggestion is required')
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
            <Lightbulb className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Suggestions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage suggestions linked to follow-up questions
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={openCreateDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Suggestion
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suggestions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={questionFilter} onValueChange={(v) => setQuestionFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All Questions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Questions</SelectItem>
            {questionOptions.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                {q.question}{q.questionEn ? ` (${q.questionEn})` : ''}
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
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="h-4 w-44 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 mb-4">
            <Lightbulb className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-sm font-medium">
            {search || questionFilter ? 'No suggestions found' : 'No suggestions added yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            {search || questionFilter
              ? 'Try a different search term or adjust the filters'
              : 'Add suggestions for each question to guide the assistant during data entry'}
          </p>
          {!search && !questionFilter && (
            <Button
              variant="outline"
              className="mt-4 text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Suggestion
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs hidden sm:table-cell">Parent Question</TableHead>
                  <TableHead className="text-xs">Suggestion</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">English</TableHead>
                  <TableHead className="w-[80px] text-xs">Status</TableHead>
                  <TableHead className="w-[80px] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {suggestions.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.02 }}
                      className="group border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-3 hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20 max-w-[200px] truncate"
                        >
                          <HelpCircle className="h-2.5 w-2.5 mr-1 shrink-0" />
                          <span className="truncate">{s.question.question}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium">{s.suggestions}</span>
                        {/* Show question on mobile (hidden on sm+) */}
                        <span className="sm:hidden text-xs text-muted-foreground block mt-0.5 truncate">
                          Q: {s.question.question}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        {s.suggestionsEn ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Languages className="h-3 w-3 shrink-0" />
                            {s.suggestionsEn}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {s.status === 'Active' ? (
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
                            onClick={() => openEditDialog(s)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {s.status === 'Active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => setDeleteTarget(s)}
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
            {suggestions.map((s) => (
              <div key={s.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-900/20 mb-1"
                    >
                      <HelpCircle className="h-2.5 w-2.5 mr-1 shrink-0" />
                      <span className="truncate">{s.question.question}</span>
                    </Badge>
                    <span className="text-sm font-medium truncate block">{s.suggestions}</span>
                    {s.suggestionsEn && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.suggestionsEn}</p>
                    )}
                  </div>
                  {s.status === 'Active' ? (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 text-[10px] shrink-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-[10px] shrink-0">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs text-teal-600 border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-teal-900/30"
                    onClick={() => openEditDialog(s)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  {s.status === 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                      onClick={() => setDeleteTarget(s)}
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
              {editingItem ? 'Edit Suggestion' : 'Add New Suggestion'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Parent Question Dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Parent Question <span className="text-red-500">*</span>
              </Label>
              <Select value={form.questionId} onValueChange={(v) => setForm({ ...form, questionId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent>
                  {questionOptions.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.question}{q.questionEn ? ` (${q.questionEn})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Suggestion (Primary) */}
            <div className="space-y-2">
              <Label htmlFor="s-text">
                Suggestion <span className="text-red-500">*</span>
              </Label>
              <Input
                id="s-text"
                placeholder="e.g. પાર્સિપામોલ લો"
                value={form.suggestions}
                onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
              <p className="text-[11px] text-muted-foreground">
                Primary language — shown in the prescription stepper
              </p>
            </div>

            {/* Suggestion (English) */}
            <div className="space-y-2">
              <Label htmlFor="s-text-en" className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                Suggestion (English)
              </Label>
              <Input
                id="s-text-en"
                placeholder="e.g. Take Paracetamol"
                value={form.suggestionsEn}
                onChange={(e) => setForm({ ...form, suggestionsEn: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Optional — used in print output
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
                : createMutation.isPending ? 'Adding...' : 'Add Suggestion'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Suggestion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deleteTarget?.suggestions}&quot;? It will be marked as inactive and won&apos;t appear in your active list.
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
