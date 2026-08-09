'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  status: string
  createdAt: string
}

export default function ReceptionistNotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['receptionist-notifications'],
    queryFn: () => fetch('/api/receptionist/notifications').then((r) => r.json()),
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetch('/api/receptionist/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () =>
      fetch('/api/receptionist/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['receptionist-notifications'] })
    },
    onError: () => toast.error('Failed to mark all as read'),
  })

  return (
    <div className="space-y-6">
      {/* Header with mark all read */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
            <Bell className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="gap-1.5"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Bell className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            You&apos;ll see new booking requests and updates here
          </p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto space-y-2">
          <AnimatePresence>
            {notifications.map((notif, i) => {
              const isUnread = notif.status === 'UNREAD'
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => isUnread && markReadMutation.mutate(notif.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 transition-colors cursor-pointer',
                    isUnread
                      ? 'border-teal-200 bg-teal-50/50 hover:bg-teal-50 dark:border-teal-900/50 dark:bg-teal-950/20 dark:hover:bg-teal-950/30'
                      : 'border-border bg-card hover:bg-muted/50'
                  )}
                >
                  {/* Unread dot */}
                  {isUnread && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                  )}
                  {!isUnread && <div className="w-2 shrink-0" />}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm',
                          isUnread
                            ? 'font-semibold'
                            : 'font-medium text-muted-foreground'
                        )}
                      >
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {notif.message}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
