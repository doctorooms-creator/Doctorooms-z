'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function BookRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    toast.info('Please select a doctor first to book an appointment')
    router.replace('/doctors')
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm text-muted-foreground">Redirecting to doctors...</p>
      </div>
    </div>
  )
}
