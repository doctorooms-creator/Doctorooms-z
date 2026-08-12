'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  Pill,
  Search,
  Sun,
  CloudSun,
  Moon,
  FlaskConical,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePrescriptionStore, type MedicineRow } from '@/lib/prescription-store'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

interface MasterMedicine {
  id: string
  name: string
  doseArray: string[]
  morning: number
  afternoon: number
  evening: number
  tab: number
  description: string
}

interface FindingMedicine {
  medicineId: string
  medicine: {
    id: string
    name: string
    doseArray: string[]
    morning: number
    afternoon: number
    evening: number
    tab: number
    description: string
  }
  dose: string
  morning: number
  afternoon: number
  evening: number
  tab: number
  description: string
}

export function Step4Medicines() {
  const prescriptionId = usePrescriptionStore((s) => s.prescriptionId)
  const medicines = usePrescriptionStore((s) => s.medicines)
  const setMedicines = usePrescriptionStore((s) => s.setMedicines)
  const addMedicine = usePrescriptionStore((s) => s.addMedicine)
  const removeMedicine = usePrescriptionStore((s) => s.removeMedicine)
  const updateMedicine = usePrescriptionStore((s) => s.updateMedicine)
  const addMedicinesFromFinding = usePrescriptionStore((s) => s.addMedicinesFromFinding)
  const isSaving = usePrescriptionStore((s) => s.isSaving)
  const setIsSaving = usePrescriptionStore((s) => s.setIsSaving)
  const markStepCompleted = usePrescriptionStore((s) => s.markStepCompleted)
  const goToNext = usePrescriptionStore((s) => s.goToNext)
  const goToPrev = usePrescriptionStore((s) => s.goToPrev)
  const queryClient = useQueryClient()

  const [findingId, setFindingId] = useState('')
  const [searchOpen, setSearchOpen] = useState(-1) // which row's search is open, -1 = none
  const [medSearch, setMedSearch] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch medicines master
  const { data: medData } = useQuery<{ medicines: MasterMedicine[] }>({
    queryKey: ['rx-medicines-master'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/medicines?status=Active').then((r) => r.json()),
  })

  // Fetch findings
  const { data: findingsData } = useQuery({
    queryKey: ['rx-findings'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/findings?status=Active').then((r) => r.json()),
  })

  const masterMeds = (medData?.medicines || []) as MasterMedicine[]
  const findings = (findingsData?.findings || []) as Array<{ id: string; name: string; nameEn: string }>

  const filteredMeds = useMemo(
    () =>
      medSearch.trim()
        ? masterMeds.filter((m) => m.name.toLowerCase().includes(medSearch.toLowerCase()))
        : masterMeds,
    [masterMeds, medSearch]
  )

  // Load existing medicines from prescription
  useEffect(() => {
    if (!prescriptionId || medicines.length > 0) return
    fetch(`/api/prescription/${prescriptionId}`)
      .then((r) => r.json())
      .then((data) => {
        const pm = data.prescription?.medicines || []
        if (pm.length > 0) {
          const parsed: MedicineRow[] = pm.map((m: Record<string, unknown>) => ({
            id: generateId(),
            medicineName: String(m.medicine || ''),
            doseOptions: [String(m.dose || '')].filter(Boolean),
            selectedDose: String(m.dose || ''),
            morning: Number(m.morning) || 0,
            afternoon: Number(m.afternoon) || 0,
            evening: Number(m.evening) || 0,
            tab: Number(m.tab) || 1,
            description: String(m.description || ''),
          }))
          setMedicines(parsed)
        }
      })
      .catch(() => {})
  }, [prescriptionId, medicines.length, setMedicines])

  // Load finding medicines
  const { data: findingMedsData, isFetching: isLoadingFindingMeds } = useQuery<{ medicines: FindingMedicine[] }>({
    queryKey: ['rx-finding-meds', findingId],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescription-settings/findings/${findingId}/medicines`).then((r) =>
        r.json()
      ),
    enabled: !!findingId,
  })

  useEffect(() => {
    if (!findingMedsData?.medicines || findingMedsData.medicines.length === 0) return
    const newRows: MedicineRow[] = findingMedsData.medicines.map((fm) => {
      const med = fm.medicine
      const effectiveDose = fm.dose || med.doseArray?.[0] || ''
      return {
        id: generateId(),
        medicineId: med.id,
        medicineName: med.name,
        doseOptions: med.doseArray || [effectiveDose].filter(Boolean),
        selectedDose: effectiveDose,
        morning: fm.morning || med.morning || 0,
        afternoon: fm.afternoon || med.afternoon || 0,
        evening: fm.evening || med.evening || 0,
        tab: fm.tab || med.tab || 1,
        description: fm.description || med.description || '',
      }
    })
    addMedicinesFromFinding(newRows)
    setFindingId('')
    toast.success(`${newRows.length} medicine(s) added from finding`)
  }, [findingMedsData])

  const handleAddManual = () => {
    addMedicine({
      id: generateId(),
      medicineName: '',
      doseOptions: [],
      selectedDose: '',
      morning: 1,
      afternoon: 0,
      evening: 1,
      tab: 5,
      description: '',
    })
  }

  const handleSelectMedicine = (med: MasterMedicine) => {
    // Find if any row is in search mode (medicineName is empty)
    const idx = medicines.findIndex((m) => !m.medicineName.trim())
    const defaultDose = med.doseArray?.[0] || ''
    const row: MedicineRow = {
      id: generateId(),
      medicineId: med.id,
      medicineName: med.name,
      doseOptions: med.doseArray || [],
      selectedDose: defaultDose,
      morning: med.morning,
      afternoon: med.afternoon,
      evening: med.evening,
      tab: med.tab,
      description: med.description,
    }

    if (idx >= 0) {
      // Replace the empty row
      const updated = [...medicines]
      updated[idx] = row
      setMedicines(updated)
    } else {
      addMedicine(row)
    }
    setSearchOpen(-1)
    setMedSearch('')
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/prescription/${prescriptionId}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rx-prescription-data'] })
      markStepCompleted(4)
      toast.success('Medicines saved')
      goToNext()
    },
    onError: () => toast.error('Failed to save medicines'),
  })

  const handleSave = () => {
    const valid = medicines.filter((m) => m.medicineName.trim())
    if (valid.length === 0) {
      toast.error('Add at least one medicine')
      return
    }
    setIsSaving(true)
    saveMutation.mutate(undefined, { onSettled: () => setIsSaving(false) })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Findings Dropdown */}
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
        <Select value={findingId} onValueChange={setFindingId}>
          <SelectTrigger className="w-52 h-9">
            <SelectValue placeholder="Auto-fill from Finding..." />
          </SelectTrigger>
          <SelectContent>
            {findings.length === 0 && (
              <SelectItem value="none" disabled>No findings configured</SelectItem>
            )}
            {findings.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
                {f.nameEn && <span className="text-muted-foreground ml-1">({f.nameEn})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoadingFindingMeds && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        )}
      </div>

      {/* Medicine Rows */}
      <AnimatePresence mode="popLayout">
        {medicines.map((med, idx) => (
          <motion.div
            key={med.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="relative">
              <div className="absolute top-2 left-3 text-[10px] font-medium text-muted-foreground">
                #{idx + 1}
              </div>
              <CardContent className="pt-5 pb-4 space-y-3">
                {/* Row 1: Medicine name + Dose + Remove */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs text-muted-foreground">Medicine</label>
                    <div className="relative">
                      <Input
                        value={med.medicineName}
                        onChange={(e) => {
                          updateMedicine(idx, { medicineName: e.target.value })
                          if (!e.target.value.trim()) {
                            setSearchOpen(idx)
                          }
                        }}
                        onFocus={() => {
                          if (!med.medicineName.trim()) setSearchOpen(idx)
                        }}
                        placeholder="Type to search medicine..."
                        className="h-9"
                      />
                      {/* Search dropdown */}
                      {searchOpen === idx && !med.medicineName.trim() && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                          <div className="p-2 border-b">
                            <Input
                              ref={searchRef}
                              value={medSearch}
                              onChange={(e) => setMedSearch(e.target.value)}
                              placeholder="Search medicines..."
                              className="h-8 text-sm"
                              autoFocus
                            />
                          </div>
                          {filteredMeds.length === 0 ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                              No medicines found
                            </div>
                          ) : (
                            <div>
                              {filteredMeds.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMedicine(m)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                                >
                                  <Pill className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{m.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {m.doseArray?.[0] || 'No dose'} | {m.tab}d |{' '}
                                      {m.morning}-{m.afternoon}-{m.evening}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dose */}
                  <div className="w-32 space-y-1">
                    <label className="text-xs text-muted-foreground">Dose</label>
                    {med.doseOptions.length > 1 ? (
                      <Select
                        value={med.selectedDose}
                        onValueChange={(v) => updateMedicine(idx, { selectedDose: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Dose" />
                        </SelectTrigger>
                        <SelectContent>
                          {med.doseOptions.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={med.selectedDose}
                        onChange={(e) => updateMedicine(idx, { selectedDose: e.target.value })}
                        placeholder="Dose"
                        className="h-9"
                      />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 shrink-0 mb-0.5"
                    onClick={() => removeMedicine(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Row 2: M/A/E + Days + Instructions */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <Input
                      type="number"
                      min={0}
                      value={med.morning}
                      onChange={(e) => updateMedicine(idx, { morning: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="h-8 w-14 text-center"
                      title="Morning"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CloudSun className="h-3.5 w-3.5 text-orange-500" />
                    <Input
                      type="number"
                      min={0}
                      value={med.afternoon}
                      onChange={(e) => updateMedicine(idx, { afternoon: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="h-8 w-14 text-center"
                      title="Afternoon"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Moon className="h-3.5 w-3.5 text-indigo-400" />
                    <Input
                      type="number"
                      min={0}
                      value={med.evening}
                      onChange={(e) => updateMedicine(idx, { evening: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="h-8 w-14 text-center"
                      title="Evening"
                    />
                  </div>

                  <div className="w-20 space-y-1">
                    <label className="text-xs text-muted-foreground">Days</label>
                    <Input
                      type="number"
                      min={1}
                      value={med.tab}
                      onChange={(e) => updateMedicine(idx, { tab: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-8 text-center"
                    />
                  </div>

                  <div className="flex-1 min-w-[120px] space-y-1">
                    <label className="text-xs text-muted-foreground">Instructions</label>
                    <Input
                      value={med.description}
                      onChange={(e) => updateMedicine(idx, { description: e.target.value })}
                      placeholder="AF, BF, AC..."
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {medicines.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No medicines added. Use a finding or add manually.</p>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={handleAddManual}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Add Medicine Manually
      </Button>

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