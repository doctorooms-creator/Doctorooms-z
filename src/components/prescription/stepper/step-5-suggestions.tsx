'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, Lightbulb, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { usePrescriptionStore, type SuggestionItem, type CustomSuggestion } from '@/lib/prescription-store'

interface GroupedSuggestions {
  coId: string
  coDetail: string
  coDetailEn: string
  items: SuggestionItem[]
}

export function Step5Suggestions() {
  const prescriptionId = usePrescriptionStore((s) => s.prescriptionId)
  const selectedComplaintIds = usePrescriptionStore((s) => s.selectedComplaintIds)
  const selectedSuggestionIds = usePrescriptionStore((s) => s.selectedSuggestionIds)
  const toggleSuggestion = usePrescriptionStore((s) => s.toggleSuggestion)
  const customSuggestions = usePrescriptionStore((s) => s.customSuggestions)
  const addCustomSuggestion = usePrescriptionStore((s) => s.addCustomSuggestion)
  const removeCustomSuggestion = usePrescriptionStore((s) => s.removeCustomSuggestion)
  const isSaving = usePrescriptionStore((s) => s.isSaving)
  const setIsSaving = usePrescriptionStore((s) => s.setIsSaving)
  const markStepCompleted = usePrescriptionStore((s) => s.markStepCompleted)
  const goToNext = usePrescriptionStore((s) => s.goToNext)
  const goToPrev = usePrescriptionStore((s) => s.goToPrev)
  const queryClient = useQueryClient()

  const [customQ, setCustomQ] = useState('')
  const [customS, setCustomS] = useState('')
  const [customQEn, setCustomQEn] = useState('')
  const [customSEn, setCustomSEn] = useState('')

  // Fetch questions linked to selected complaints
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['rx-questions-for-complaints', selectedComplaintIds],
    queryFn: async () => {
      if (selectedComplaintIds.length === 0) return { questions: [] }
      const res = await fetch(
        `/api/dashboard/doctor/prescription-settings/questions?status=Active&coId=${selectedComplaintIds.join(',')}`
      )
      return res.json()
    },
    enabled: selectedComplaintIds.length > 0,
  })

  const questions = (questionsData?.questions || []) as Array<{
    id: string
    question: string
    questionEn: string
    coId: string | null
    co: { id: string; coDetail: string; coDetailEn: string } | null
  }>

  // Fetch suggestions for all questions
  const questionIds = questions.map((q) => q.id)
  const { data: suggestionsData } = useQuery({
    queryKey: ['rx-suggestions-for-questions', questionIds],
    queryFn: async () => {
      if (questionIds.length === 0) return { suggestions: [] }
      // Fetch all suggestions; filter client-side
      const res = await fetch(`/api/dashboard/doctor/prescription-settings/suggestions?status=Active`)
      const data = await res.json()
      return {
        suggestions: data.suggestions.filter((s: { questionId: string }) =>
          questionIds.includes(s.questionId)
        ),
      }
    },
    enabled: questionIds.length > 0,
  })

  const allSuggestions = (suggestionsData?.suggestions || []) as Array<{
    id: string
    questionId: string
    suggestions: string
    suggestionsEn: string
    question: { id: string; question: string; questionEn: string; coId: string | null; co: { id: string; coDetail: string; coDetailEn: string } | null }
  }>

  // Group suggestions by complaint
  const grouped = useMemo((): GroupedSuggestions[] => {
    const map = new Map<string, GroupedSuggestions>()
    for (const s of allSuggestions) {
      const coId = s.question?.coId || '__no_co__'
      const coDetail = s.question?.co?.coDetail || 'General'
      const coDetailEn = s.question?.co?.coDetailEn || ''
      if (!map.has(coId)) {
        map.set(coId, { coId, coDetail, coDetailEn, items: [] })
      }
      map.get(coId)!.items.push({
        id: s.id,
        questionId: s.questionId,
        question: s.question.question,
        questionEn: s.question.questionEn,
        coId,
        coDetail,
        coDetailEn,
        suggestionId: s.id,
        suggestions: s.suggestions,
        suggestionsEn: s.suggestionsEn,
      })
    }
    return Array.from(map.values())
  }, [allSuggestions])

  // Load existing suggestions from prescription
  useEffect(() => {
    if (!prescriptionId) return
    fetch(`/api/prescription/${prescriptionId}`)
      .then((r) => r.json())
      .then((data) => {
        const ps = data.prescription?.suggestions || []
        if (ps.length > 0) {
          // For existing linked suggestions, we match by text content since we don't store suggestionId in PSuggestion
          // Custom suggestions are handled separately
          usePrescriptionStore.getState().setSelectedSuggestionIds([])
        }
      })
      .catch(() => {})
  }, [prescriptionId])

  const handleAddCustom = () => {
    if (!customS.trim()) {
      toast.error('Suggestion text is required')
      return
    }
    addCustomSuggestion({
      id: Math.random().toString(36).substring(2, 9),
      question: customQ,
      questionEn: customQEn,
      suggestions: customS,
      suggestionsEn: customSEn,
    })
    setCustomQ('')
    setCustomS('')
    setCustomQEn('')
    setCustomSEn('')
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/prescription/${prescriptionId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionIds: selectedSuggestionIds,
          customSuggestions,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rx-prescription-data'] })
      markStepCompleted(5)
      toast.success('Suggestions saved')
      goToNext()
    },
    onError: () => toast.error('Failed to save suggestions'),
  })

  const handleSave = () => {
    setIsSaving(true)
    saveMutation.mutate(undefined, { onSettled: () => setIsSaving(false) })
  }

  const totalSelected = selectedSuggestionIds.length + customSuggestions.length

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {selectedComplaintIds.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No complaints selected in Step 1. Go back to select complaints to see auto-suggestions.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          {totalSelected > 0 && (
            <Badge variant="secondary" className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              {totalSelected} selected
            </Badge>
          )}

          <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
            <AnimatePresence mode="popLayout">
              {grouped.map((group) => (
                <motion.div
                  key={group.coId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span>From: {group.coDetail}</span>
                    {group.coDetailEn && (
                      <span className="font-normal text-xs text-muted-foreground">({group.coDetailEn})</span>
                    )}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const isSelected = selectedSuggestionIds.includes(item.id)
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleSuggestion(item.id)}
                          className={
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ' +
                            (isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-card border-border hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30')
                          }
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{item.suggestions}</span>
                          {item.suggestionsEn && (
                            <span className={isSelected ? 'text-teal-100 text-xs' : 'text-muted-foreground text-xs'}>
                              ({item.suggestionsEn})
                            </span>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {grouped.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No suggestions linked to selected complaints.
              </p>
            )}
          </div>

          {/* Custom Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Custom Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customSuggestions.map((cs, idx) => (
                <div key={cs.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex-1">
                    {cs.question && <p className="text-xs text-muted-foreground">Q: {cs.question}</p>}
                    <p>{cs.suggestions}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-red-500"
                    onClick={() => removeCustomSuggestion(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={customQ}
                  onChange={(e) => setCustomQ(e.target.value)}
                  placeholder="Question (optional)"
                  className="h-8 text-sm"
                />
                <Input
                  value={customQEn}
                  onChange={(e) => setCustomQEn(e.target.value)}
                  placeholder="Question English (optional)"
                  className="h-8 text-sm"
                />
                <Input
                  value={customS}
                  onChange={(e) => setCustomS(e.target.value)}
                  placeholder="Suggestion text"
                  className="h-8 text-sm"
                />
                <Input
                  value={customSEn}
                  onChange={(e) => setCustomSEn(e.target.value)}
                  placeholder="Suggestion English (optional)"
                  className="h-8 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleAddCustom}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Custom
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={goToPrev}>Back</Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || saveMutation.isPending}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving || saveMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : (
            <>Save & Continue</>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
