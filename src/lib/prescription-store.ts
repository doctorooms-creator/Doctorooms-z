'use client'

import { create } from 'zustand'

export interface Vitals {
  weight: string
  bp: string
  temperature: string
  pulse: string
  spo2: string
}

export interface LabelValue {
  labelId: string
  label: string
  labelEn: string
  value: string
  labelUnit: string
  showUnit: boolean
}

export interface TableData {
  id: string
  templateId?: string
  name: string
  rows: number
  cols: number
  headerLabel: string[]
  colsLabel: string[]
  cellValues: Record<string, string> // key: "row-col" e.g. "0-1"
  footerLabel: string[]
  extraLabel: string
}

export interface MedicineRow {
  id: string
  medicineId?: string
  medicineName: string
  doseOptions: string[]
  selectedDose: string
  morning: number
  afternoon: number
  evening: number
  tab: number
  description: string
}

export interface CustomSuggestion {
  id: string
  question: string
  questionEn: string
  suggestions: string
  suggestionsEn: string
}

export interface ComplaintWithCategory {
  id: string
  coDetail: string
  coDetailEn: string
  coCode: string
  categoryId: string | null
  category: { id: string; name: string; nameEn: string } | null
}

export interface SuggestionItem {
  id: string
  questionId: string
  question: string
  questionEn: string
  coId: string | null
  coDetail: string
  coDetailEn: string
  suggestionId: string
  suggestions: string
  suggestionsEn: string
}

interface PrescriptionStore {
  // Navigation
  currentStep: number
  setCurrentStep: (step: number) => void
  goToNext: () => void
  goToPrev: () => void
  completedSteps: number[]
  markStepCompleted: (step: number) => void

  // Prescription ID
  prescriptionId: string | null
  setPrescriptionId: (id: string) => void

  // Booking info
  bookingId: string
  setBookingId: (id: string) => void

  // Patient info (read from booking)
  patientName: string
  patientAge: string
  patientGender: string
  setPatientInfo: (name: string, age: string, gender: string) => void

  // Step 1: Complaints
  selectedComplaintIds: string[]
  setSelectedComplaintIds: (ids: string[]) => void
  toggleComplaint: (id: string) => void

  // Step 2: Vitals
  vitals: Vitals
  setVitals: (v: Partial<Vitals>) => void
  labelValues: LabelValue[]
  setLabelValues: (labels: LabelValue[]) => void
  setLabelValue: (labelId: string, value: string) => void

  // Step 3: Tables
  tables: TableData[]
  setTables: (tables: TableData[]) => void
  addTable: (table: TableData) => void
  removeTable: (index: number) => void
  updateTable: (index: number, table: Partial<TableData>) => void

  // Step 4: Medicines
  medicines: MedicineRow[]
  setMedicines: (medicines: MedicineRow[]) => void
  addMedicine: (medicine: MedicineRow) => void
  removeMedicine: (index: number) => void
  updateMedicine: (index: number, medicine: Partial<MedicineRow>) => void
  addMedicinesFromFinding: (newMeds: MedicineRow[]) => void

  // Step 5: Suggestions
  selectedSuggestionIds: string[]
  setSelectedSuggestionIds: (ids: string[]) => void
  toggleSuggestion: (id: string) => void
  customSuggestions: CustomSuggestion[]
  addCustomSuggestion: (s: CustomSuggestion) => void
  removeCustomSuggestion: (index: number) => void

  // Step 6
  nextVisit: Date | null
  setNextVisit: (date: Date | null) => void

  // Loading states
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
  isInitializing: boolean
  setIsInitializing: (v: boolean) => void

  // Reset
  reset: () => void
}

const emptyVitals: Vitals = {
  weight: '',
  bp: '',
  temperature: '',
  pulse: '',
  spo2: '',
}

export const usePrescriptionStore = create<PrescriptionStore>((set) => ({
  // Navigation
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  goToNext: () =>
    set((s) => ({
      currentStep: Math.min(s.currentStep + 1, 6),
    })),
  goToPrev: () =>
    set((s) => ({
      currentStep: Math.max(s.currentStep - 1, 1),
    })),
  completedSteps: [],
  markStepCompleted: (step) =>
    set((s) => ({
      completedSteps: s.completedSteps.includes(step)
        ? s.completedSteps
        : [...s.completedSteps, step],
    })),

  // Prescription ID
  prescriptionId: null,
  setPrescriptionId: (id) => set({ prescriptionId: id }),

  // Booking info
  bookingId: '',
  setBookingId: (id) => set({ bookingId: id }),

  // Patient info
  patientName: '',
  patientAge: '',
  patientGender: '',
  setPatientInfo: (name, age, gender) =>
    set({ patientName: name, patientAge: age, patientGender: gender }),

  // Step 1: Complaints
  selectedComplaintIds: [],
  setSelectedComplaintIds: (ids) => set({ selectedComplaintIds: ids }),
  toggleComplaint: (id) =>
    set((s) => ({
      selectedComplaintIds: s.selectedComplaintIds.includes(id)
        ? s.selectedComplaintIds.filter((c) => c !== id)
        : [...s.selectedComplaintIds, id],
    })),

  // Step 2: Vitals
  vitals: { ...emptyVitals },
  setVitals: (v) =>
    set((s) => ({ vitals: { ...s.vitals, ...v } })),
  labelValues: [],
  setLabelValues: (labels) => set({ labelValues: labels }),
  setLabelValue: (labelId, value) =>
    set((s) => ({
      labelValues: s.labelValues.map((l) =>
        l.labelId === labelId ? { ...l, value } : l
      ),
    })),

  // Step 3: Tables
  tables: [],
  setTables: (tables) => set({ tables }),
  addTable: (table) =>
    set((s) => ({ tables: [...s.tables, table] })),
  removeTable: (index) =>
    set((s) => ({ tables: s.tables.filter((_, i) => i !== index) })),
  updateTable: (index, table) =>
    set((s) => ({
      tables: s.tables.map((t, i) =>
        i === index ? { ...t, ...table } : t
      ),
    })),

  // Step 4: Medicines
  medicines: [],
  setMedicines: (medicines) => set({ medicines }),
  addMedicine: (medicine) =>
    set((s) => ({ medicines: [...s.medicines, medicine] })),
  removeMedicine: (index) =>
    set((s) => ({ medicines: s.medicines.filter((_, i) => i !== index) })),
  updateMedicine: (index, medicine) =>
    set((s) => ({
      medicines: s.medicines.map((m, i) =>
        i === index ? { ...m, ...medicine } : m
      ),
    })),
  addMedicinesFromFinding: (newMeds) =>
    set((s) => {
      const existingIds = s.medicines
        .map((m) => m.medicineId)
        .filter(Boolean) as string[]
      const toAdd = newMeds.filter(
        (m) => !m.medicineId || !existingIds.includes(m.medicineId)
      )
      return { medicines: [...s.medicines, ...toAdd] }
    }),

  // Step 5: Suggestions
  selectedSuggestionIds: [],
  setSelectedSuggestionIds: (ids) => set({ selectedSuggestionIds: ids }),
  toggleSuggestion: (id) =>
    set((s) => ({
      selectedSuggestionIds: s.selectedSuggestionIds.includes(id)
        ? s.selectedSuggestionIds.filter((sid) => sid !== id)
        : [...s.selectedSuggestionIds, id],
    })),
  customSuggestions: [],
  addCustomSuggestion: (s) =>
    set((st) => ({ customSuggestions: [...st.customSuggestions, s] })),
  removeCustomSuggestion: (index) =>
    set((s) => ({
      customSuggestions: s.customSuggestions.filter((_, i) => i !== index),
    })),

  // Step 6
  nextVisit: null,
  setNextVisit: (date) => set({ nextVisit: date }),

  // Loading states
  isSaving: false,
  setIsSaving: (saving) => set({ isSaving: saving }),
  isInitializing: true,
  setIsInitializing: (v) => set({ isInitializing: v }),

  // Reset
  reset: () =>
    set({
      currentStep: 1,
      prescriptionId: null,
      bookingId: '',
      patientName: '',
      patientAge: '',
      patientGender: '',
      selectedComplaintIds: [],
      vitals: { ...emptyVitals },
      labelValues: [],
      tables: [],
      medicines: [],
      selectedSuggestionIds: [],
      customSuggestions: [],
      nextVisit: null,
      isSaving: false,
      isInitializing: true,
      completedSteps: [],
    }),
}))
