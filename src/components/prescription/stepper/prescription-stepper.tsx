'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrescriptionStore } from '@/lib/prescription-store'
import { StepIndicator } from './step-indicator'
import { Step1Complaints } from './step-1-complaints'
import { Step2Vitals } from './step-2-vitals'
import { Step3Tables } from './step-3-tables'
import { Step4Medicines } from './step-4-medicines'
import { Step5Suggestions } from './step-5-suggestions'
import { Step6Finish } from './step-6-finish'

interface PrescriptionStepperProps {
  bookingId: string
  onPrint: (rxId: string) => void
}

export function PrescriptionStepper({ bookingId, onPrint }: PrescriptionStepperProps) {
  const store = usePrescriptionStore()
  const {
    prescriptionId,
    setPrescriptionId,
    setBookingId,
    setPatientInfo,
    currentStep,
    isInitializing,
    setIsInitializing,
    reset,
  } = store

  // Initialize
  useEffect(() => {
    reset()
    setBookingId(bookingId)

    // Create or find existing draft prescription
    fetch('/api/prescription/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        const rxId = data.prescription?.id
        if (rxId) {
          setPrescriptionId(rxId)

          // If existing draft, load data and determine start step
          if (!data.isNew) {
            loadExistingPrescription(rxId, setPatientInfo, store.setCurrentStep, store.markStepCompleted)
          }
        }
      })
      .catch((err) => {
        console.error('Init failed:', err)
      })
      .finally(() => {
        setIsInitializing(false)
      })

    return () => {
      reset()
    }
  }, [bookingId])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Complaints onSaveComplete={() => store.goToNext()} />
      case 2:
        return <Step2Vitals />
      case 3:
        return <Step3Tables />
      case 4:
        return <Step4Medicines />
      case 5:
        return <Step5Suggestions />
      case 6:
        return <Step6Finish onPrint={onPrint} />
      default:
        return <Step1Complaints onSaveComplete={() => store.goToNext()} />
    }
  }

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StepIndicator />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">{renderStep()}</CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

async function loadExistingPrescription(
  rxId: string,
  setPatientInfo: (n: string, a: string, g: string) => void,
  setCurrentStep: (s: number) => void,
  markStepCompleted: (s: number) => void
) {
  try {
    const res = await fetch(`/api/prescription/${rxId}`)
    const data = await res.json()
    const rx = data.prescription
    if (!rx) return

    // Set patient info
    setPatientInfo(
      rx.patientName || rx.booking?.patientName || '',
      rx.patientAge || rx.booking?.age?.toString() || '',
      rx.booking?.gender || ''
    )

    // Determine which steps have data
    let lastStepWithData = 0

    if (rx.chiefComplaints && rx.chiefComplaints.length > 0) {
      lastStepWithData = 1
      markStepCompleted(1)
      // Set selected complaint IDs in store
      const ids = rx.chiefComplaints.map((c: { coId: string }) => c.coId)
      usePrescriptionStore.getState().setSelectedComplaintIds(ids)
    }

    if (rx.weight || rx.bp || rx.temperature || (rx.labels && rx.labels.length > 0)) {
      lastStepWithData = 2
      markStepCompleted(2)
      // Set vitals in store
      usePrescriptionStore.getState().setVitals({
        weight: rx.weight || '',
        bp: rx.bp || '',
        temperature: rx.temperature || '',
        pulse: '',
        spo2: '',
      })
      // Set labels
      if (rx.labels && rx.labels.length > 0) {
        usePrescriptionStore.getState().setLabelValues(
          rx.labels.map((l: { label: string; labelEn: string; value: string; labelUnit: string; showUnit: boolean }) => ({
            labelId: l.label || `label-${Math.random().toString(36).substring(2, 6)}`,
            label: l.label,
            labelEn: l.labelEn,
            value: l.value,
            labelUnit: l.labelUnit,
            showUnit: l.showUnit,
          }))
        )
      }
    }

    if (rx.diagnosisTables && rx.diagnosisTables.length > 0) {
      lastStepWithData = 3
      markStepCompleted(3)
    }

    if (rx.medicines && rx.medicines.length > 0) {
      lastStepWithData = 4
      markStepCompleted(4)
    }

    if (rx.suggestions && rx.suggestions.length > 0) {
      lastStepWithData = 5
      markStepCompleted(5)
    }

    // Start at the step after last completed
    setCurrentStep(Math.min(lastStepWithData + 1, 6))
  } catch (err) {
    console.error('Load existing Rx error:', err)
  }
}
