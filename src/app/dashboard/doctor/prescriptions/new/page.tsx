'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { PrescriptionStepper } from '@/components/prescription/stepper/prescription-stepper'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function NewPrescriptionPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId') || ''

  const handlePrint = useCallback((rxId: string) => {
    // Open the prescription detail page which has print capability
    window.open(`/dashboard/doctor/prescriptions/${rxId}`, '_blank')
    toast.info('Prescription saved! Print window opened.')
  }, [])

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground mb-4">No appointment selected. Please select an appointment first.</p>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    )
  }

  return <PrescriptionStepper bookingId={bookingId} onPrint={handlePrint} />
}
