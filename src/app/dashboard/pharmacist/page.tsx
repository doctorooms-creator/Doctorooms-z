'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileText, Clock, Package, ArrowRight, Stethoscope, Pill, Building2, MoreHorizontal, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PharmacistStats {
  isHospitalMode: boolean
  totalPrescriptions: number
  todayPrescriptions: number
  pendingFulfillments: number
  doctor: {
    id: string
    name: string
    profileImg: string | null
    specialization: string
  } | null
  hospital: {
    id: string
    name: string
    profileImg: string | null
    hospitalType: string
    address: string
    city: string
  } | null
  recentPrescriptions: {
    id: string
    patientName: string
    disease: string
    createdAt: string
    medicineCount: number
    fulfillmentStatus: string
    doctorName?: string
    departmentName?: string | null
  }[]
}

function getFulfillmentBadge(status: string) {
  switch (status) {
    case 'Pending':
      return (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          Pending
        </Badge>
      )
    case 'Packed':
      return (
        <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
          Packed
        </Badge>
      )
    case 'Dispensed':
      return (
        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Dispensed
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function PharmacistDashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [fulfillTarget, setFulfillTarget] = useState<{ id: string; status: string } | null>(null)

  const { data: stats, isLoading } = useQuery<PharmacistStats>({
    queryKey: ['pharmacist-stats'],
    queryFn: () => fetch('/api/dashboard/pharmacist/stats').then((r) => r.json()),
  })

  const fulfillMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dashboard/pharmacist/prescriptions/${id}/fulfill`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacist-stats'] })
      toast.success('Prescription updated successfully')
      setFulfillTarget(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  if (isLoading) {
    return <PharmacistDashboardSkeleton />
  }

  const isHospitalMode = stats?.isHospitalMode ?? false

  return (
    <div className="space-y-6">
      {/* Hospital info banner (hospital mode) */}
      {isHospitalMode && stats?.hospital && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900 dark:bg-teal-950/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
            <Building2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Hospital Pharmacy</p>
              <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                {stats.hospital.hospitalType}
              </Badge>
            </div>
            <p className="truncate text-lg font-semibold">{stats.hospital.name}</p>
            {(stats.hospital.city || stats.hospital.address) && (
              <p className="truncate text-sm text-muted-foreground">
                {[stats.hospital.address, stats.hospital.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Doctor info banner (clinic mode) */}
      {!isHospitalMode && stats?.doctor && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900 dark:bg-teal-950/30"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={stats.doctor.profileImg || ''} />
            <AvatarFallback className="bg-teal-100 text-lg dark:bg-teal-900/50">
              {stats.doctor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-medium text-muted-foreground">Working with</p>
            </div>
            <p className="text-lg font-semibold">{stats.doctor.name}</p>
            {stats.doctor.specialization && (
              <p className="text-sm text-muted-foreground">{stats.doctor.specialization}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className={cn(
        'grid gap-4',
        isHospitalMode ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
      )}>
        <StatCard
          title="Total Prescriptions"
          value={stats?.totalPrescriptions ?? 0}
          icon={FileText}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Today's Prescriptions"
          value={stats?.todayPrescriptions ?? 0}
          icon={Clock}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Pending Fulfillments"
          value={stats?.pendingFulfillments ?? 0}
          icon={Package}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
        {isHospitalMode && (
          <StatCard
            title="Hospital Mode"
            value="All Depts"
            icon={Building2}
            gradient="from-sky-500 to-sky-600"
            iconBg="bg-sky-100 dark:bg-sky-900/50"
          />
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          onClick={() => router.push('/dashboard/pharmacist/prescriptions')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          View Prescriptions
        </Button>
        <Button
          onClick={() => router.push('/dashboard/pharmacist/medicines')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Pill className="h-4 w-4" />
          Medicine Inventory
        </Button>
        <Button
          onClick={() => router.push('/dashboard/pharmacist/prescriptions')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          Pending Orders
        </Button>
      </div>

      {/* Recent prescriptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Prescriptions</CardTitle>
          <Link href="/dashboard/pharmacist/prescriptions">
            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 dark:text-teal-400">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                {isHospitalMode && <TableHead>Doctor</TableHead>}
                <TableHead>Disease</TableHead>
                <TableHead>Medicines</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentPrescriptions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isHospitalMode ? 7 : 6} className="py-8 text-center text-muted-foreground">
                    No prescriptions yet
                  </TableCell>
                </TableRow>
              )}
              {stats?.recentPrescriptions?.map((rx, i) => (
                <motion.tr
                  key={rx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{rx.patientName}</TableCell>
                  {isHospitalMode && (
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{rx.doctorName}</span>
                        {rx.departmentName && (
                          <span className="text-xs text-muted-foreground">{rx.departmentName}</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    {rx.disease ? (
                      <Badge variant="secondary" className="text-xs">{rx.disease}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Pill className="h-3.5 w-3.5 text-teal-500" />
                      <span className="text-sm text-muted-foreground">{rx.medicineCount} medicine{rx.medicineCount !== 1 ? 's' : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getFulfillmentBadge(rx.fulfillmentStatus)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(rx.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {rx.fulfillmentStatus !== 'Dispensed' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setFulfillTarget({ id: rx.id, status: 'Packed' })}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Mark as Packed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setFulfillTarget({ id: rx.id, status: 'Dispensed' })}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Dispensed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm fulfillment dialog */}
      <AlertDialog open={!!fulfillTarget} onOpenChange={(open) => !open && setFulfillTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark as {fulfillTarget?.status}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this prescription's status to &quot;{fulfillTarget?.status}&quot;? This action will be recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (fulfillTarget) {
                  fulfillMutation.mutate({ id: fulfillTarget.id, status: fulfillTarget.status })
                }
              }}
              disabled={fulfillMutation.isPending}
            >
              {fulfillMutation.isPending ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PharmacistDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="h-5 w-44 animate-pulse rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
