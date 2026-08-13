'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FlaskConical,
  ClipboardList,
  TestTube,
  CheckCircle2,
  FileText,
  CalendarDays,
  Building2,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LabTechStats {
  ordered: number
  sampleCollected: number
  resultEntered: number
  verified: number
  todayReports: number
  totalPending: number
  hospitalName: string
  techName: string
  qualification: string
  specialization: string
}

export default function LabTechnicianDashboardClient() {
  const router = useRouter()

  const { data, isLoading } = useQuery<{ stats: LabTechStats }>({
    queryKey: ['lab-tech-dashboard'],
    queryFn: () => fetch('/api/lab-technician/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Lab Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{stats?.techName || 'Loading...'}</span>
            {stats?.qualification && (
              <span className="rounded border border-teal-300 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
                {stats.qualification}
              </span>
            )}
          </div>
        </div>
        {stats?.hospitalName && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
            <Building2 className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-medium">{stats.hospitalName}</span>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Collection"
            value={stats?.ordered ?? 0}
            icon={TestTube}
            gradient="from-amber-500 to-amber-600"
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            onClick={() => router.push('/dashboard/lab-technician/worklist')}
          />
          <StatCard
            title="Awaiting Results"
            value={stats?.sampleCollected ?? 0}
            icon={ClipboardList}
            gradient="from-teal-500 to-teal-600"
            iconBg="bg-teal-100 dark:bg-teal-900/50"
            onClick={() => router.push('/dashboard/lab-technician/worklist')}
          />
          <StatCard
            title="Ready to Verify"
            value={stats?.resultEntered ?? 0}
            icon={CheckCircle2}
            gradient="from-violet-500 to-violet-600"
            iconBg="bg-violet-100 dark:bg-violet-900/50"
            onClick={() => router.push('/dashboard/lab-technician/reports')}
          />
          <StatCard
            title="Today's Reports"
            value={stats?.todayReports ?? 0}
            icon={CalendarDays}
            gradient="from-emerald-500 to-emerald-600"
            iconBg="bg-emerald-100 dark:bg-emerald-900/50"
            onClick={() => router.push('/dashboard/lab-technician/reports')}
          />
        </div>
      )}

      {/* Quick Info */}
      {!isLoading && stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push('/dashboard/lab-technician/worklist')}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Worklist</p>
                <p className="text-xs text-muted-foreground">{stats.totalPending} pending items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push('/dashboard/lab-technician/result-entry')}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Result Entry</p>
                <p className="text-xs text-muted-foreground">{stats.sampleCollected} samples collected</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push('/dashboard/lab-technician/profile')}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium">My Profile</p>
                <p className="text-xs text-muted-foreground">{stats.specialization || 'Lab Technician'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
