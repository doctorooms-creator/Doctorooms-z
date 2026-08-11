'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Check,
  X,
  Clock,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- Types ---

interface AccessRequest {
  id: string
  prescriptionId: string
  prescriptionDisease: string
  prescriptionDate: string
  prescriptionPatientName: string
  requestingDoctorName: string
  requestingDoctorImg: string
  requestingDoctorSpecialization: string
  originalDoctorName: string
  originalDoctorSpecialization: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Revoked'
  createdAt: string
  updatedAt: string
}

// --- Helpers ---

function getAvatarUrl(img: string | null | undefined): string {
  if (!img || img === 'default.png') return ''
  return img.startsWith('/') ? img : `/uploads/profile/${img}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getStatusConfig(status: AccessRequest['status']) {
  switch (status) {
    case 'Pending':
      return {
        icon: Clock,
        label: 'Pending',
        badgeClass:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      }
    case 'Approved':
      return {
        icon: ShieldCheck,
        label: 'Approved',
        badgeClass:
          'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
      }
    case 'Rejected':
      return {
        icon: ShieldX,
        label: 'Rejected',
        badgeClass:
          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
      }
    case 'Revoked':
      return {
        icon: ShieldX,
        label: 'Revoked',
        badgeClass:
          'bg-muted text-muted-foreground border-muted-foreground/30',
      }
  }
}

// --- Animation ---

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

// --- Skeleton ---

function SkeletonCard() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            <div className="flex gap-4">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-36 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Empty State ---

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70 max-w-xs">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

// --- Request Card ---

interface RequestCardProps {
  request: AccessRequest
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onRevoke: (id: string) => void
  actionLoading: string | null
}

function RequestCard({
  request,
  onApprove,
  onReject,
  onRevoke,
  actionLoading,
}: RequestCardProps) {
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const config = getStatusConfig(request.status)
  const StatusIcon = config.icon
  const avatarSrc = getAvatarUrl(request.requestingDoctorImg)
  const initials = getInitials(request.requestingDoctorName)
  const isLoading = actionLoading === request.id

  return (
    <motion.div {...fadeInUp} layout>
      <Card
        className={cn(
          'rounded-xl transition-all hover:shadow-md',
          request.status === 'Pending' &&
            'border-yellow-200 dark:border-yellow-800/60 hover:border-yellow-300 dark:hover:border-yellow-700',
          request.status === 'Approved' &&
            'border-teal-200 dark:border-teal-800/60 hover:border-teal-300 dark:hover:border-teal-700',
          (request.status === 'Rejected' || request.status === 'Revoked') &&
            'opacity-70'
        )}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Doctor Avatar */}
            <Avatar className="h-12 w-12 shrink-0 border-2 border-background shadow-sm">
              <AvatarImage src={avatarSrc} alt={request.requestingDoctorName} />
              <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Top row: name + status badge */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {request.requestingDoctorName}
                </h3>
                <Badge
                  variant="outline"
                  className={cn('gap-1 text-xs shrink-0', config.badgeClass)}
                >
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>

              {/* Specialization */}
              <p className="text-xs text-muted-foreground">
                {request.requestingDoctorSpecialization}
              </p>

              {/* Prescription details */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {request.prescriptionDisease || 'General consultation'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Prescribed by {request.originalDoctorName}
                  {request.originalDoctorSpecialization &&
                    ` (${request.originalDoctorSpecialization})`}
                </span>
                <span>
                  {format(new Date(request.prescriptionDate), 'MMM d, yyyy')}
                </span>
              </div>

              {/* Requested at */}
              <p className="text-xs text-muted-foreground/60">
                Requested{' '}
                {format(new Date(request.createdAt), "MMM d, yyyy \u2022 h:mm a")}
              </p>

              {/* Action buttons for Pending */}
              {request.status === 'Pending' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={isLoading}
                    onClick={() => onApprove(request.id)}
                  >
                    {actionLoading === `approve-${request.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                    disabled={isLoading}
                    onClick={() => onReject(request.id)}
                  >
                    {actionLoading === `reject-${request.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Reject
                  </Button>
                </div>
              )}

              {/* Revoke button for Approved */}
              {request.status === 'Approved' && !confirmRevoke && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:border-red-800 dark:hover:text-red-400 dark:hover:bg-red-950/40"
                    onClick={() => setConfirmRevoke(true)}
                  >
                    <ShieldX className="h-3.5 w-3.5 mr-1.5" />
                    Revoke Access
                  </Button>
                </div>
              )}

              {/* Revoke confirmation */}
              {request.status === 'Approved' && confirmRevoke && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-red-600 dark:text-red-400">
                    Are you sure?
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                    disabled={isLoading}
                    onClick={() => onRevoke(request.id)}
                  >
                    {actionLoading === `revoke-${request.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <ShieldX className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Confirm Revoke
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRevoke(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Error State ---

function ErrorState() {
  const queryClient = useQueryClient()
  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ShieldX className="h-8 w-8 text-red-500/50" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Failed to load requests
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ['prescription-access-requests'],
            })
          }
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

// --- Main Page ---

export default function PrescriptionAccessPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('Pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Map tab value to API status param
  const statusParam = activeTab === 'History' ? 'all' : activeTab

  // Fetch requests based on active tab
  const { data, isLoading, isError } = useQuery({
    queryKey: ['prescription-access-requests', statusParam],
    queryFn: () =>
      fetch(`/api/prescription-access/requests?status=${statusParam}`).then(
        (r) => {
          if (!r.ok) throw new Error('Failed to fetch requests')
          return r.json()
        }
      ),
  })

  const allRequests: AccessRequest[] = data?.requests || []
  const pendingCount: number = data?.pendingCount || 0

  // Filter client-side for the History tab
  const filteredRequests =
    activeTab === 'History'
      ? allRequests.filter(
          (r) => r.status === 'Rejected' || r.status === 'Revoked'
        )
      : allRequests

  // Optimistically update the query cache
  const updateCache = (
    requestId: string,
    updater: (req: AccessRequest) => AccessRequest
  ) => {
    for (const key of ['Pending', 'Approved', 'Rejected', 'all']) {
      queryClient.setQueryData(
        ['prescription-access-requests', key],
        (prev: { requests: AccessRequest[]; pendingCount: number } | undefined) => {
          if (!prev) return prev
          const updated = prev.requests.map((r) =>
            r.id === requestId ? updater(r) : r
          )
          const newPendingCount = updated.filter(
            (r) => r.status === 'Pending'
          ).length
          return { requests: updated, pendingCount: newPendingCount }
        }
      )
    }
  }

  const handleApprove = async (id: string) => {
    const loaderKey = `approve-${id}`
    setActionLoading(loaderKey)
    updateCache(id, (r) => ({ ...r, status: 'Approved' as const }))
    try {
      const res = await fetch(`/api/prescription-access/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(result.message || 'Access approved successfully')
    } catch {
      updateCache(id, (r) => ({ ...r, status: 'Pending' as const }))
      toast.error('Failed to approve request. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const loaderKey = `reject-${id}`
    setActionLoading(loaderKey)
    updateCache(id, (r) => ({ ...r, status: 'Rejected' as const }))
    try {
      const res = await fetch(`/api/prescription-access/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(result.message || 'Request rejected')
    } catch {
      updateCache(id, (r) => ({ ...r, status: 'Pending' as const }))
      toast.error('Failed to reject request. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (id: string) => {
    const loaderKey = `revoke-${id}`
    setActionLoading(loaderKey)
    updateCache(id, (r) => ({ ...r, status: 'Revoked' as const }))
    try {
      const res = await fetch(`/api/prescription-access/${id}/respond`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      toast.success(result.message || 'Access revoked successfully')
    } catch {
      updateCache(id, (r) => ({ ...r, status: 'Approved' as const }))
      toast.error('Failed to revoke access. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  // Render list content (reused across tabs)
  const renderList = (
    emptyIcon: React.ElementType,
    emptyTitle: string,
    emptyDesc: string
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )
    }
    if (isError) return <ErrorState />
    if (filteredRequests.length === 0) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDesc}
        />
      )
    }
    return (
      <div className="space-y-3">
        <AnimatePresence>
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onApprove={handleApprove}
              onReject={handleReject}
              onRevoke={handleRevoke}
              actionLoading={actionLoading}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Prescription Access
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage which doctors can view your prescription records
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="Pending" className="gap-1.5">
            Pending
            {pendingCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="Approved" className="gap-1.5">
            Approved
          </TabsTrigger>
          <TabsTrigger value="History" className="gap-1.5">
            History
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="Pending" className="mt-4">
          {renderList(
            ShieldCheck,
            'No pending requests',
            "When doctors request access to your prescriptions, they'll appear here for your approval."
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="Approved" className="mt-4">
          {renderList(
            ShieldCheck,
            'No approved access',
            "You haven't approved any prescription access requests yet."
          )}
        </TabsContent>

        {/* History Tab (Rejected + Revoked) */}
        <TabsContent value="History" className="mt-4">
          {renderList(
            Clock,
            'No history yet',
            'Rejected and revoked access requests will appear here.'
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
