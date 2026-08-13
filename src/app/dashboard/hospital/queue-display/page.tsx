'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import HospitalQueueDisplayClient from './client'
import { Loader2 } from 'lucide-react'

export default function HospitalQueueDisplayPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [hospital, setHospital] = useState<{ id: string; hospitalName: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || user.role !== 'hospital') {
      router.replace('/dashboard/hospital')
      return
    }
    fetch('/api/dashboard/hospital/stats')
      .then(r => r.json())
      .then(data => {
        if (data.hospital?.id) {
          setHospital({ id: data.hospital.id, hospitalName: data.hospital.hospitalName || '' })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id, user?.role, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hospital) return null

  return <HospitalQueueDisplayClient hospitalId={hospital.id} hospitalName={hospital.hospitalName} />
}