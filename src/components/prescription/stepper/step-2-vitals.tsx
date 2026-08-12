'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Scale, Heart, Thermometer, Activity, Wind, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { usePrescriptionStore, type LabelValue } from '@/lib/prescription-store'

export function Step2Vitals() {
  const prescriptionId = usePrescriptionStore((s) => s.prescriptionId)
  const vitals = usePrescriptionStore((s) => s.vitals)
  const setVitals = usePrescriptionStore((s) => s.setVitals)
  const labelValues = usePrescriptionStore((s) => s.labelValues)
  const setLabelValues = usePrescriptionStore((s) => s.setLabelValues)
  const setLabelValue = usePrescriptionStore((s) => s.setLabelValue)
  const isSaving = usePrescriptionStore((s) => s.isSaving)
  const setIsSaving = usePrescriptionStore((s) => s.setIsSaving)
  const markStepCompleted = usePrescriptionStore((s) => s.markStepCompleted)
  const goToNext = usePrescriptionStore((s) => s.goToNext)
  const goToPrev = usePrescriptionStore((s) => s.goToPrev)
  const queryClient = useQueryClient()

  // Fetch labels master
  const { data: labelsData, isLoading: labelsLoading } = useQuery({
    queryKey: ['rx-labels'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/labels?status=Active').then((r) => r.json()),
  })

  const masterLabels = (labelsData?.labels || []) as Array<{
    id: string
    label: string
    labelEn: string
    unit: string
    showUnit: boolean
  }>

  // Initialize label values when master loads
  useEffect(() => {
    if (masterLabels.length > 0 && labelValues.length === 0) {
      setLabelValues(
        masterLabels.map((ml) => ({
          labelId: ml.id,
          label: ml.label,
          labelEn: ml.labelEn,
          value: '',
          labelUnit: ml.unit,
          showUnit: ml.showUnit,
        }))
      )
    }
  }, [masterLabels.length, labelValues.length, setLabelValues])

  // Load existing vitals from prescription
  useEffect(() => {
    if (!prescriptionId) return
    fetch(`/api/prescription/${prescriptionId}`)
      .then((r) => r.json())
      .then((data) => {
        const rx = data.prescription
        if (!rx) return
        if (rx.weight) setVitals({ weight: rx.weight })
        if (rx.bp) setVitals({ bp: rx.bp })
        if (rx.temperature) setVitals({ temperature: rx.temperature })
        if (rx.labels && rx.labels.length > 0) {
          setLabelValues(
            rx.labels.map((l: { labelId: string; label: string; labelEn: string; value: string; labelUnit: string; showUnit: boolean }) => ({
              labelId: l.labelId || l.label,
              label: l.label,
              labelEn: l.labelEn,
              value: l.value,
              labelUnit: l.labelUnit,
              showUnit: l.showUnit,
            }))
          )
        }
      })
      .catch(() => {})
  }, [prescriptionId])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/prescription/${prescriptionId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals, labels: labelValues }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rx-prescription-data'] })
      markStepCompleted(2)
      toast.success('Vitals saved')
      goToNext()
    },
    onError: () => toast.error('Failed to save vitals'),
  })

  const handleSave = () => {
    setIsSaving(true)
    saveMutation.mutate(undefined, {
      onSettled: () => setIsSaving(false),
    })
  }

  const vitalFields = [
    { key: 'weight' as const, label: 'Weight', unit: 'kg', icon: Scale, placeholder: 'e.g. 70' },
    { key: 'bp' as const, label: 'Blood Pressure', unit: 'mmHg', icon: Heart, placeholder: 'e.g. 120/80' },
    { key: 'temperature' as const, label: 'Temperature', unit: 'F', icon: Thermometer, placeholder: 'e.g. 98.6' },
    { key: 'pulse' as const, label: 'Pulse', unit: 'bpm', icon: Activity, placeholder: 'e.g. 72' },
    { key: 'spo2' as const, label: 'SpO2', unit: '%', icon: Wind, placeholder: 'e.g. 98' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Common Vitals */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Common Vitals</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vitalFields.map((vf) => {
            const Icon = vf.icon
            return (
              <div key={vf.key} className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  {vf.label}
                  {vf.unit && <span className="text-muted-foreground font-normal">({vf.unit})</span>}
                </Label>
                <div className="relative">
                  <Input
                    value={vitals[vf.key]}
                    onChange={(e) => setVitals({ [vf.key]: e.target.value })}
                    placeholder={vf.placeholder}
                    className="h-9"
                  />
                  {vf.key !== 'bp' && vf.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {vf.unit}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dynamic Labels */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Custom Labels</h4>
        {labelsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : labelValues.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No labels configured. Add them in Prescription Settings.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labelValues.map((lv) => (
              <div key={lv.labelId} className="space-y-1.5">
                <Label className="text-xs">
                  {lv.label}
                  {lv.labelEn && (
                    <span className="text-muted-foreground font-normal ml-1">({lv.labelEn})</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    value={lv.value}
                    onChange={(e) => setLabelValue(lv.labelId, e.target.value)}
                    placeholder="Value"
                    className="h-9"
                  />
                  {lv.showUnit && lv.labelUnit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {lv.labelUnit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={goToPrev}>
          Back
        </Button>
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