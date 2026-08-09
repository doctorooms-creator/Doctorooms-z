'use client'

import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    router.push(`/dashboard/${user.role}`)
  }, [isAuthenticated, user, router])

  return null
}