'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ClipboardList,
  Clock,
  PlayCircle,
  ArrowRightCircle,
  User,
  Calendar,
  Droplets,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface QueueItem {
  id: string
  patientName: string
  age: number | null
  gender: string
  bloodGroup: string
  timeSlot: string
  bookingDate: string
  status: string
  prescription: {
    id: string
    status: string
    chiefComplaintsCount: number
  } | null
}

const statusConfig: Record<
  string,
  { className: string; label: string }
> = {
  Approve: {
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    label: 'Approved',
  },
  Visited: {
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    label: 'Visited',
  },
  'Draft Rx': {
    className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
    label: 'Draft Rx',
  },
}

function getDisplayStatus(item: QueueItem): string {
  if (item.prescription) return 'Draft Rx'
  return item.status
}

export default function AssistantPrescriptionQueuePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery<{ queue: QueueItem[] }>({
    queryKey: ['assistant-prescription-queue', search],
    queryFn: () =>
      fetch(
        `/api/dashboard/assistant/prescription-queue${search ? `?search=${encodeURIComponent(search)}` : ''}`
      ).then((r) => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      }),
  })

  const queue = data?.queue ?? []

  const handleAction = (item: QueueItem) => {
    router.push(`/dashboard/doctor/prescriptions/new?bookingId=${item.id}`)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Prescription Queue</h1>
              <p className="text-sm text-muted-foreground">
                Patients waiting for prescription — start with complaints & vitals
              </p>
            </div>
          </div>
          {queue.length > 0 && (
            <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
              {queue.length} patient{queue.length !== 1 ? 's' : ''} in queue
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Queue Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden sm:table-cell">Age</TableHead>
                  <TableHead className="hidden md:table-cell">Gender</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
                          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto h-8 w-20 animate-pulse rounded-md bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <p className="text-sm text-red-500">Failed to load queue. Please try again.</p>
                    </TableCell>
                  </TableRow>
                ) : queue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/20">
                          <ClipboardList className="h-8 w-8 text-teal-400" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {search ? 'No patients match your search' : 'Queue is clear'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground/70">
                            {search
                              ? 'Try a different patient name'
                              : 'All approved patients have been processed'}
                          </p>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {queue.map((item, i) => {
                      const displayStatus = getDisplayStatus(item)
                      const config = statusConfig[displayStatus] || statusConfig[item.status]
                      const hasDraft = !!item.prescription

                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                          className="group border-b border-border transition-colors hover:bg-muted/50"
                        >
                          {/* Patient Name */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
                                <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-tight">
                                  {item.patientName || 'Walk-in'}
                                </p>
                                {item.bloodGroup && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Droplets className="h-3 w-3" />
                                        {item.bloodGroup}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>Blood Group</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Age */}
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {item.age ? `${item.age} yr` : '—'}
                            </span>
                          </TableCell>

                          {/* Gender */}
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {item.gender || '—'}
                            </span>
                          </TableCell>

                          {/* Time Slot */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{item.timeSlot || '—'}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.bookingDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn('text-xs font-medium', config?.className)}
                            >
                              {hasDraft && (
                                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
                              )}
                              {config?.label || displayStatus}
                            </Badge>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleAction(item)}
                              className={cn(
                                'gap-1.5 transition-all',
                                hasDraft
                                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                                  : 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-400 dark:hover:bg-teal-900/60'
                              )}
                            >
                              {hasDraft ? (
                                <>
                                  <ArrowRightCircle className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Continue Rx</span>
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Start Rx</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Cards (shown below md as alternative) */}
        {queue.length > 0 && (
          <div className="flex flex-col gap-3 md:hidden">
            <AnimatePresence>
              {queue.map((item, i) => {
                const displayStatus = getDisplayStatus(item)
                const config = statusConfig[displayStatus] || statusConfig[item.status]
                const hasDraft = !!item.prescription

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
                              <User className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {item.patientName || 'Walk-in'}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                {item.age && <span>{item.age} yr</span>}
                                {item.gender && <span>· {item.gender}</span>}
                                {item.bloodGroup && (
                                  <span className="flex items-center gap-0.5">
                                    <Droplets className="h-3 w-3" />
                                    {item.bloodGroup}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn('shrink-0 text-xs', config?.className)}
                          >
                            {hasDraft && (
                              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
                            )}
                            {config?.label || displayStatus}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(item.bookingDate), 'MMM d, yyyy')}</span>
                          <span className="mx-1">·</span>
                          <Clock className="h-3 w-3" />
                          <span>{item.timeSlot || 'No time'}</span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAction(item)}
                          className={cn(
                            'mt-3 w-full gap-1.5 transition-all',
                            hasDraft
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-400 dark:hover:bg-teal-900/60'
                          )}
                        >
                          {hasDraft ? (
                            <>
                              <ArrowRightCircle className="h-3.5 w-3.5" />
                              Continue Rx
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3.5 w-3.5" />
                              Start Rx
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
