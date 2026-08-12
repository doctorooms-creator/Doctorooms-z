'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { usePrescriptionStore, type ComplaintWithCategory } from '@/lib/prescription-store'

type GroupedComplaints = {
  categoryId: string | null
  categoryName: string
  categoryNameEn: string
  items: ComplaintWithCategory[]
}

export function Step1Complaints({ onSaveComplete }: { onSaveComplete: () => void }) {
  const prescriptionId = usePrescriptionStore((s) => s.prescriptionId)
  const selectedComplaintIds = usePrescriptionStore((s) => s.selectedComplaintIds)
  const setSelectedComplaintIds = usePrescriptionStore((s) => s.setSelectedComplaintIds)
  const toggleComplaint = usePrescriptionStore((s) => s.toggleComplaint)
  const isSaving = usePrescriptionStore((s) => s.isSaving)
  const setIsSaving = usePrescriptionStore((s) => s.setIsSaving)
  const markStepCompleted = usePrescriptionStore((s) => s.markStepCompleted)
  const goToNext = usePrescriptionStore((s) => s.goToNext)

  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  // Fetch complaints grouped by category
  const { data, isLoading, isError } = useQuery<{ complaints: ComplaintWithCategory[] }>({
    queryKey: ['rx-complaints'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/complaints?status=Active').then((r) => r.json()),
  })

  const complaints = data?.complaints || []

  // Group complaints by category
  const grouped = useMemo((): GroupedComplaints[] => {
    const filtered = search.trim()
      ? complaints.filter(
          (c) =>
            c.coDetail.toLowerCase().includes(search.toLowerCase()) ||
            c.coDetailEn.toLowerCase().includes(search.toLowerCase()) ||
            c.coCode.toLowerCase().includes(search.toLowerCase())
        )
      : complaints

    const map = new Map<string, GroupedComplaints>()
    for (const c of filtered) {
      const catId = c.categoryId || '__uncategorized__'
      if (!map.has(catId)) {
        map.set(catId, {
          categoryId: c.categoryId,
          categoryName: c.category?.name || 'Uncategorized',
          categoryNameEn: c.category?.nameEn || '',
          items: [],
        })
      }
      map.get(catId)!.items.push(c)
    }
    return Array.from(map.values())
  }, [complaints, search])

  // Fetch existing saved complaints to initialize selection
  useEffect(() => {
    if (!prescriptionId) return
    fetch(`/api/prescription/${prescriptionId}`)
      .then((r) => r.json())
      .then((data) => {
        const pco = data.prescription?.chiefComplaints || []
        if (pco.length > 0) {
          setSelectedComplaintIds(pco.map((c: { coId: string }) => c.coId))
        }
      })
      .catch(() => {})
  }, [prescriptionId, setSelectedComplaintIds])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/prescription/${prescriptionId}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintIds: selectedComplaintIds }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rx-prescription-data'] })
      markStepCompleted(1)
      toast.success('Complaints saved')
      goToNext()
    },
    onError: () => {
      toast.error('Failed to save complaints')
    },
  })

  const handleSave = () => {
    setIsSaving(true)
    saveMutation.mutate(undefined, {
      onSettled: () => setIsSaving(false),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-6 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <p>Failed to load complaints. Please try again.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {selectedComplaintIds.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
            {selectedComplaintIds.length} selected
          </Badge>
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        <AnimatePresence mode="popLayout">
          {grouped.map((group) => (
            <motion.div
              key={group.categoryId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <span>{group.categoryName}</span>
                {group.categoryNameEn && (
                  <span className="font-normal text-xs">({group.categoryNameEn})</span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                {group.items.map((complaint) => {
                  const isSelected = selectedComplaintIds.includes(complaint.id)
                  return (
                    <motion.button
                      key={complaint.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleComplaint(complaint.id)}
                      className={
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ' +
                        (isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-card border-border hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30')
                      }
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{complaint.coDetail}</span>
                      {complaint.coDetailEn && (
                        <span className={
                          isSelected
                            ? 'text-teal-100 text-xs'
                            : 'text-muted-foreground text-xs'
                        }>
                          ({complaint.coDetailEn})
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
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'No complaints match your search' : 'No complaints configured. Add them in Prescription Settings.'}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
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
