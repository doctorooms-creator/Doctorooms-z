'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export interface BottomNavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'border-t bg-background/95 backdrop-blur-lg safe-area-bottom',
        className
      )}
      role="tablist"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around h-14">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px]',
                'text-muted-foreground transition-colors',
                isActive && 'text-primary'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Preset configurations for specific roles
import {
  LayoutDashboard,
  ClipboardList,
  PenLine,
  FileText,
  Pill,
  Users,
  BedDouble,
  BarChart3,
} from 'lucide-react'

export const nurseBottomNav: BottomNavItem[] = [
  { label: 'Home', href: '/dashboard/nurse', icon: LayoutDashboard },
  { label: 'Patients', href: '/dashboard/nurse/patients', icon: Users },
  { label: 'Ward', href: '/dashboard/nurse/ward-patients', icon: BedDouble },
  { label: 'Handover', href: '/dashboard/nurse/handover', icon: ClipboardList },
]

export const pharmacistBottomNav: BottomNavItem[] = [
  { label: 'Home', href: '/dashboard/pharmacist', icon: LayoutDashboard },
  { label: 'Rx', href: '/dashboard/pharmacist/prescriptions', icon: Pill },
  { label: 'Medicines', href: '/dashboard/pharmacist/medicines', icon: FileText },
]

export const labTechnicianBottomNav: BottomNavItem[] = [
  { label: 'Home', href: '/dashboard/lab-technician', icon: LayoutDashboard },
  { label: 'Worklist', href: '/dashboard/lab-technician/worklist', icon: ClipboardList },
  { label: 'Results', href: '/dashboard/lab-technician/result-entry', icon: PenLine },
  { label: 'Reports', href: '/dashboard/lab-technician/reports', icon: BarChart3 },
]
