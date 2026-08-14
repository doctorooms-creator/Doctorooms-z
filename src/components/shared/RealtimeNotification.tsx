'use client'

import { useEffect } from 'react'
import { useAuthSocket } from '@/hooks/useSocket'
import { toast } from 'sonner'
import {
  BedDouble,
  Activity,
  TestTube2,
  FlaskConical,
  Receipt,
  CreditCard,
  LogOut,
  Cross,
  AlertTriangle,
} from 'lucide-react'

// Event → toast configuration per role
interface EventConfig {
  title: string
  icon: React.ElementType
  color: string
  roles: string[] // which roles should see this toast
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  'new-admission': {
    title: 'New Admission',
    icon: BedDouble,
    color: 'text-teal-600',
    roles: ['receptionist', 'hospital', 'nurse', 'admin'],
  },
  'vital-recorded': {
    title: 'Vitals Updated',
    icon: Activity,
    color: 'text-rose-500',
    roles: ['doctor', 'nurse', 'hospital'],
  },
  'sample-ordered': {
    title: 'Sample Ordered',
    icon: TestTube2,
    color: 'text-amber-600',
    roles: ['nurse', 'lab_technician', 'doctor'],
  },
  'lab-result-ready': {
    title: 'Lab Result Ready',
    icon: FlaskConical,
    color: 'text-emerald-600',
    roles: ['doctor', 'hospital', 'lab_technician'],
  },
  'bill-generated': {
    title: 'Bill Generated',
    icon: Receipt,
    color: 'text-violet-600',
    roles: ['receptionist', 'hospital', 'admin'],
  },
  'payment-received': {
    title: 'Payment Received',
    icon: CreditCard,
    color: 'text-emerald-600',
    roles: ['receptionist', 'hospital', 'admin'],
  },
  'discharge-advised': {
    title: 'Discharge Advised',
    icon: LogOut,
    color: 'text-sky-600',
    roles: ['receptionist', 'hospital', 'nurse', 'admin'],
  },
  'ot-scheduled': {
    title: 'OT Scheduled',
    icon: Cross,
    color: 'text-rose-600',
    roles: ['doctor', 'nurse', 'hospital', 'admin'],
  },
  'low-stock-alert': {
    title: 'Low Stock Alert',
    icon: AlertTriangle,
    color: 'text-red-500',
    roles: ['hospital', 'admin', 'pharmacist'],
  },
}

// Dedup: avoid showing duplicate toasts for same event within 5 seconds
const shownEvents = new Map<string, number>()
const DEDUP_WINDOW = 5000

export function RealtimeNotification() {
  const socket = useAuthSocket()

  useEffect(() => {
    if (!socket) return

    const handler = (eventName: string, payload: Record<string, unknown>) => {
      // Check role filter
      const roleCookie = getCookie('doctorooms_role')
      const config = EVENT_CONFIG[eventName]
      if (!config) return
      if (roleCookie && !config.roles.includes(roleCookie)) return

      // Dedup check
      const dedupKey = `${eventName}:${JSON.stringify(payload)}`
      const now = Date.now()
      const lastShown = shownEvents.get(dedupKey)
      if (lastShown && now - lastShown < DEDUP_WINDOW) return
      shownEvents.set(dedupKey, now)

      // Clean old entries
      for (const [key, ts] of shownEvents) {
        if (now - ts > DEDUP_WINDOW * 2) shownEvents.delete(key)
      }

      // Show toast
      const Icon = config.icon
      const message = (payload.message as string) || `${config.title} — ${(payload.patientName as string) || ''}`.trim()
      toast(message || config.title, {
        icon: <Icon className={`h-4 w-4 ${config.color}`} />,
        duration: 4000,
      })
    }

    // Listen for all valid events
    const events = Object.keys(EVENT_CONFIG)
    for (const event of events) {
      socket.on(event, (payload: Record<string, unknown>) => {
        handler(event, payload)
      })
    }

    return () => {
      for (const event of events) {
        socket.off(event)
      }
    }
  }, [socket])

  // This component renders nothing visible
  return null
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : ''
}
