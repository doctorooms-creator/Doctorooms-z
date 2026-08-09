'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, Users, Clock, Hash, Video, UserRound, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface QueueItem {
  id: string
  appointmentNo: string
  patientName: string
  patientImg: string | null
  disease: string
  timeSlot: string | null
  bookingMode: string
  bookingType: string
  createdAt: string
  status: string
  queuePosition: number
}

interface QueueData {
  date: string
  totalInQueue: number
  queue: QueueItem[]
  opdLimit: number
  opdCompletedToday: number
}

export default function PrintQueuePage() {
  const { data, isLoading } = useQuery<QueueData>({
    queryKey: ['walkin-queue-print'],
    queryFn: () => fetch('/api/dashboard/receptionist/walk-in').then(r => r.json()),
    refetchInterval: 15000,
  })

  const handlePrint = () => {
    window.print()
  }

  const queue = data?.queue ?? []
  const totalInQueue = data?.totalInQueue ?? 0
  const opdLimit = data?.opdLimit ?? 0
  const opdCompletedToday = data?.opdCompletedToday ?? 0

  return (
    <div className="space-y-6">
      {/* Header - hidden in print */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
            <Printer className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Print Queue</h2>
            <p className="text-sm text-muted-foreground">
              Today's patient queue — {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button
          onClick={handlePrint}
          className="gap-2 bg-teal-600 text-white hover:bg-teal-700"
        >
          <Printer className="h-4 w-4" />
          Print Queue
        </Button>
      </div>

      {/* Print Header - only visible in print */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-xl font-bold">Patient Queue — {format(new Date(), 'MMMM d, yyyy')}</h1>
        <p className="text-sm text-gray-500">Generated: {format(new Date(), 'h:mm a')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="print:hidden flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Users className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">No patients in queue</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Queue will populate as patients are registered</p>
        </div>
      ) : (
        <>
          {/* Summary bar - visible both on screen and in print */}
          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3 print:bg-gray-100 print:border print:border-gray-300">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4 text-teal-600" />
              <span className="font-medium">{totalInQueue}</span>
              <span className="text-muted-foreground">in queue</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{opdCompletedToday}</span>
              <span className="text-muted-foreground">completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{opdLimit}</span>
              <span className="text-muted-foreground">limit</span>
            </div>
          </div>

          {/* Queue Table — print-friendly */}
          <div className="rounded-xl border border-border overflow-hidden print:border-gray-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 print:bg-gray-100 print:border-gray-300">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Disease / Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time Slot</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-gray-200">
                {queue.map((item, i) => {
                  const ModeIcon = item.bookingMode === 'VideoCall' ? Video : UserRound
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="transition-colors hover:bg-muted/30 print:hover:bg-transparent"
                    >
                      <td className="px-4 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 print:bg-gray-200 print:text-gray-700">
                          {item.queuePosition}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium print:text-black">{item.patientName}</td>
                      <td className="px-4 py-3 text-muted-foreground print:text-gray-600">{item.disease || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground print:text-gray-600">
                        {item.timeSlot ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.timeSlot}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground print:text-gray-600">
                          <ModeIcon className="h-3.5 w-3.5" />
                          {item.bookingMode === 'VideoCall' ? 'Video' : 'In-Person'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px]',
                            item.status === 'Approve'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 print:bg-amber-100 print:text-amber-700'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 print:bg-emerald-100 print:text-emerald-700'
                          )}
                        >
                          {item.status === 'Approve' ? 'Waiting' : 'In Consultation'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.bookingType === 'By Receptionist' && (
                          <Badge variant="outline" className="text-[10px] text-teal-600 print:text-teal-700 print:border-teal-300">
                            Walk-in
                          </Badge>
                        )}
                        {item.bookingType === 'By Self' && (
                          <span className="text-[10px] text-muted-foreground print:text-gray-500">Online</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer - only in print */}
          <div className="hidden print:block print:mt-4 print:border-t print:border-gray-300 print:pt-3">
            <p className="text-xs text-gray-400">Total patients in queue: {totalInQueue} | OPD completed today: {opdCompletedToday} | OPD limit: {opdLimit}</p>
          </div>
        </>
      )}
    </div>
  )
}
