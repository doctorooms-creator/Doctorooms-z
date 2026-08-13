'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  BellOff,
  CheckCheck,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  status: 'READ' | 'UNREAD'
  createdAt: string
}

// Queue notification title → visual style mapping
function getNotificationStyle(title: string) {
  const t = title.toLowerCase()
  if (t.includes('consultation started')) {
    return {
      icon: Stethoscope,
      bgClass: 'bg-teal-100 dark:bg-teal-900/60',
      iconClass: 'text-teal-600 dark:text-teal-400',
      badgeClass: 'bg-teal-500 hover:bg-teal-600 text-white border-0',
      badgeLabel: 'Queue',
      cardClass: 'border-l-4 border-l-teal-400',
    }
  }
  if (t.includes('consultation complete')) {
    return {
      icon: CheckCircle2,
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/60',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white border-0',
      badgeLabel: 'Queue',
      cardClass: 'border-l-4 border-l-emerald-400',
    }
  }
  if (t.includes('turn is approaching')) {
    return {
      icon: AlertTriangle,
      bgClass: 'bg-amber-100 dark:bg-amber-900/60',
      iconClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-500 hover:bg-amber-600 text-white border-0',
      badgeLabel: 'Queue',
      cardClass: 'border-l-4 border-l-amber-400',
    }
  }
  if (t.includes('wait') && t.includes('extended')) {
    return {
      icon: Clock,
      bgClass: 'bg-orange-100 dark:bg-orange-900/60',
      iconClass: 'text-orange-600 dark:text-orange-400',
      badgeClass: 'bg-orange-500 hover:bg-orange-600 text-white border-0',
      badgeLabel: 'Queue',
      cardClass: 'border-l-4 border-l-orange-400',
    }
  }
  if (t.includes('canceled')) {
    return {
      icon: XCircle,
      bgClass: 'bg-red-100 dark:bg-red-900/60',
      iconClass: 'text-red-600 dark:text-red-400',
      badgeClass: 'bg-red-500 hover:bg-red-600 text-white border-0',
      badgeLabel: null,
      cardClass: '',
    }
  }
  // Default
  return {
    icon: Bell,
    bgClass: 'bg-muted',
    iconClass: 'text-muted-foreground',
    badgeClass: '',
    badgeLabel: null,
    cardClass: '',
  }
}

export default function PatientNotificationsPage() {
  const queryClient = useQueryClient()
  const [markingAll, setMarkingAll] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['patient-notifications'],
    queryFn: () =>
      fetch('/api/patient/notifications').then((r) => r.json()),
  })

  const notifications: Notification[] = data?.notifications || []
  const unreadCount: number = data?.unreadCount || 0

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/patient/notifications/${id}/read`, { method: 'PATCH' })
      queryClient.setQueryData(['patient-notifications'], (prev: { notifications: Notification[]; unreadCount: number } | undefined) => {
        if (!prev) return prev
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, status: 'READ' as const } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }
      })
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/patient/notifications/read-all', { method: 'PATCH' })
      queryClient.setQueryData(['patient-notifications'], (prev: { notifications: Notification[]; unreadCount: number } | undefined) => {
        if (!prev) return prev
        return {
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, status: 'READ' as const })),
          unreadCount: 0,
        }
      })
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-teal-500 hover:bg-teal-600 text-white">
                {unreadCount} unread
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            {markingAll ? 'Marking...' : 'Mark All as Read'}
          </Button>
        )}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BellOff className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              We&apos;ll notify you about appointment updates, reminders, and more.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((notif, i) => {
              const isUnread = notif.status === 'UNREAD'
              const style = getNotificationStyle(notif.title)
              const IconComp = style.icon
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/30',
                      isUnread && 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/40',
                      style.cardClass,
                    )}
                    onClick={() => isUnread && handleMarkAsRead(notif.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            isUnread ? style.bgClass : 'bg-muted'
                          )}
                        >
                          <IconComp
                            className={cn(
                              'h-4 w-4',
                              isUnread ? style.iconClass : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={cn(
                                'text-sm truncate',
                                isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                              )}
                            >
                              {notif.title}
                            </p>
                            {isUnread && style.badgeLabel && (
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', style.badgeClass)}>
                                {style.badgeLabel}
                              </Badge>
                            )}
                            {isUnread && !style.badgeLabel && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1.5">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
