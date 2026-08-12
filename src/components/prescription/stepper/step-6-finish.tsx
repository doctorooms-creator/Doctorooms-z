'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Printer, User, Activity, Pill, Lightbulb, Grid3X3, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { usePrescriptionStore } from '@/lib/prescription-store'

interface RxData {
  id: string
  patientName: string
  patientAge: string
  weight: string
  bp: string
  temperature: string
  status: string
  nextVisit: string | null
  booking: {
    patientName: string
    gender: string
    bloodGroup: string
    disease: string
    timeSlot: string
    bookingDate: string
  }
  doctor: {
    user: { name: string; contactNo: string; phoneNo: string }
    specialization: string
    address: string
    city: string
    state: string
    registrationDetail: string
  }
  chiefComplaints: Array<{ co: { coDetail: string; coDetailEn: string } }>
  labels: Array<{ label: string; labelEn: string; value: string; labelUnit: string; showUnit: boolean }>
  medicines: Array<{ medicine: string; dose: string; morning: number; afternoon: number; evening: number; tab: number; description: string }>
  suggestions: Array<{ question: string; questionEn: string; suggestions: string; suggestionsEn: string }>
  diagnosisTables: Array<{
    rows: number
    cols: number
    headerLabel: string
    colsLabel: string
    footerLabel: string
    extraLabel: string
  }>
}

export function Step6Finish({ onPrint }: { onPrint: (rxId: string) => void }) {
  const prescriptionId = usePrescriptionStore((s) => s.prescriptionId)
  const nextVisit = usePrescriptionStore((s) => s.nextVisit)
  const setNextVisit = usePrescriptionStore((s) => s.setNextVisit)
  const isSaving = usePrescriptionStore((s) => s.isSaving)
  const setIsSaving = usePrescriptionStore((s) => s.setIsSaving)
  const goToPrev = usePrescriptionStore((s) => s.goToPrev)
  const queryClient = useQueryClient()
  const [calOpen, setCalOpen] = useState(false)

  const { data, isLoading, isError } = useQuery<{ prescription: RxData }>({
    queryKey: ['rx-prescription-data', prescriptionId],
    queryFn: () => fetch(`/api/prescription/${prescriptionId}`).then((r) => r.json()),
    enabled: !!prescriptionId,
    refetchOnWindowFocus: false,
  })

  const rx = data?.prescription

  // Set next visit from loaded data
  useEffect(() => {
    if (rx?.nextVisit && !nextVisit) {
      setNextVisit(new Date(rx.nextVisit))
    }
  }, [rx?.nextVisit, nextVisit, setNextVisit])

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/prescription/${prescriptionId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextVisit: nextVisit ? nextVisit.toISOString() : null,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rx-prescription-data'] })
      toast.success('Prescription finalized!')
      onPrint(prescriptionId || '')
    },
    onError: () => toast.error('Failed to finalize prescription'),
  })

  const handleFinalize = () => {
    setIsSaving(true)
    finalizeMutation.mutate(undefined, { onSettled: () => setIsSaving(false) })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (isError || !rx) {
    return (
      <div className="flex items-center gap-2 p-6 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <p>Failed to load prescription data.</p>
      </div>
    )
  }

  const complaints = rx.chiefComplaints || []
  const labels = rx.labels || []
  const medicines = rx.medicines || []
  const suggestions = rx.suggestions || []
  const tables = rx.diagnosisTables || []

  const parseJson = (str: string): string[] => {
    try { const p = JSON.parse(str); return Array.isArray(p) ? p : [] }
    catch { return [] }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Patient Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <strong>{rx.patientName || rx.booking?.patientName || '-'}</strong></div>
            <div><span className="text-muted-foreground">Age:</span> <strong>{rx.patientAge || '-'}</strong></div>
            <div><span className="text-muted-foreground">Gender:</span> <strong>{rx.booking?.gender || '-'}</strong></div>
            <div><span className="text-muted-foreground">Blood Group:</span> <strong>{rx.booking?.bloodGroup || '-'}</strong></div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints */}
      {complaints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chief Complaints (C/O)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {complaints.map((c, i) => (
                <Badge key={i} variant="secondary" className="bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300">
                  {c.co?.coDetailEn || c.co?.coDetail || '-'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vitals & Labels */}
      {(rx.weight || rx.bp || rx.temperature || labels.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Vitals & Labels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 text-sm">
              {rx.weight && <Badge variant="outline">Wt: {rx.weight} kg</Badge>}
              {rx.bp && <Badge variant="outline">BP: {rx.bp}</Badge>}
              {rx.temperature && <Badge variant="outline">Temp: {rx.temperature} F</Badge>}
              {labels.map((l, i) => (
                <Badge key={i} variant="outline">
                  {l.labelEn || l.label}: {l.value}{l.showUnit && l.labelUnit ? ` ${l.labelUnit}` : ''}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Tables */}
      {tables.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Diagnosis Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            {tables.map((t, ti) => {
              const hLabels = parseJson(t.headerLabel)
              const cLabels = parseJson(t.colsLabel)
              return (
                <div key={ti}>
                  {t.extraLabel && <p className="text-xs font-medium mb-1 text-muted-foreground">{t.extraLabel}</p>}
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        {hLabels.map((h, ci) => (
                          <th key={ci} className="border border-border bg-muted/50 px-2 py-1 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cLabels.map((lbl, ri) => (
                        <tr key={ri}>
                          <td className="border border-border bg-muted/30 px-2 py-1 font-medium">{lbl}</td>
                          {hLabels.slice(1).map((_, ci) => (
                            <td key={ci} className="border border-border px-2 py-1">-</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Medicines */}
      {medicines.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Medicines ({medicines.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-1 pr-3">#</th>
                  <th className="pb-1 pr-3">Medicine</th>
                  <th className="pb-1 pr-3">Dose</th>
                  <th className="pb-1 pr-2 text-center">M</th>
                  <th className="pb-1 pr-2 text-center">A</th>
                  <th className="pb-1 pr-2 text-center">E</th>
                  <th className="pb-1 pr-3 text-center">Days</th>
                  <th className="pb-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-1.5 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-1.5 pr-3 font-medium">{m.medicine}</td>
                    <td className="py-1.5 pr-3">{m.dose || '-'}</td>
                    <td className="py-1.5 pr-2 text-center">{m.morning || '-'}</td>
                    <td className="py-1.5 pr-2 text-center">{m.afternoon || '-'}</td>
                    <td className="py-1.5 pr-2 text-center">{m.evening || '-'}</td>
                    <td className="py-1.5 pr-3 text-center">{m.tab}</td>
                    <td className="py-1.5">{m.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Advice ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">-</span>
                  <span>{s.suggestionsEn || s.suggestions}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Visit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Next Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('h-9 justify-start text-left font-normal', !nextVisit && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextVisit ? format(nextVisit, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nextVisit || undefined}
                  onSelect={(d) => { setNextVisit(d || null); setCalOpen(false) }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {nextVisit && (
              <Button variant="ghost" size="sm" onClick={() => setNextVisit(null)} className="text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={goToPrev}>Back</Button>
        <Button
          onClick={handleFinalize}
          disabled={isSaving || finalizeMutation.isPending}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving || finalizeMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Finalizing...
            </span>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" />
              Save & Print
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
