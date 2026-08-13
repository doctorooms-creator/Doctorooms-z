'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function BookRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const doctorId = searchParams.get('doctorId')
    if (doctorId) {
      router.replace(`/dashboard/patient/book/${doctorId}`)
    } else {
      toast.info('Please select a doctor first to book an appointment')
      router.replace('/doctors')
    }
  }, [router, searchParams])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}

export default function BookRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <BookRedirectContent />
    </Suspense>
  )
}
