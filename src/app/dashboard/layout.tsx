'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import type { AuthUser } from '@/lib/auth-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser, logout: clearStore, isLoading, isAuthenticated } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  // On mount, check if we have auth from Zustand (just logged in) OR from cookie/API (page refresh)
  useEffect(() => {
    async function checkAuth() {
      // 1. If Zustand has user, we're good (just came from login)
      if (user && isAuthenticated) {
        setChecking(false)
        return
      }

      // 2. Check cookie or /api/auth/me (page refresh scenario)
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user as AuthUser)
          setChecking(false)
          return
        }
      } catch {
        // API failed, check cookie directly
      }

      // 3. Check if role cookie exists (minimal check)
      const roleCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('doctorooms_role='))
        ?.split('=')[1]

      if (roleCookie) {
        // Cookie exists but API failed — try once more after a brief delay
        try {
          await new Promise((r) => setTimeout(r, 500))
          const res2 = await fetch('/api/auth/me')
          const data2 = await res2.json()
          if (data2.success && data2.user) {
            setUser(data2.user as AuthUser)
            setChecking(false)
            return
          }
        } catch {
          // give up
        }
      }

      // No auth found → redirect to login
      setChecking(false)
      router.push('/login')
    }

    checkAuth()
  }, [])

  // Verify the user is on the correct role path
  useEffect(() => {
    if (!user || checking) return
    const expectedPath = `/dashboard/${user.role}`
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      router.replace(expectedPath)
    }
  }, [user, pathname, checking, router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    clearStore()
    router.push('/login')
  }

  if (checking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setMobileOpen(true)} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
