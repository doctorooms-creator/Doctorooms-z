'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface MobileCardField {
  label: string
  value: ReactNode
  className?: string
}

interface MobileCardProps {
  title: string
  subtitle?: string
  fields?: MobileCardField[]
  actions?: ReactNode
  status?: {
    label: string
    variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary'
  }
  icon?: ReactNode
  onClick?: () => void
  className?: string
  children?: ReactNode
}

const statusColors: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  secondary: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

export function MobileCard({
  title,
  subtitle,
  fields,
  actions,
  status,
  icon,
  onClick,
  className,
  children,
}: MobileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-colors',
          onClick && 'cursor-pointer active:bg-accent/50',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            {status && (
              <span
                className={cn(
                  'flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  statusColors[status.variant]
                )}
              >
                {status.label}
              </span>
            )}
          </div>
        </CardHeader>

        {children ? (
          <CardContent className="pt-0">{children}</CardContent>
        ) : fields && fields.length > 0 ? (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {fields.map((field, i) => (
                <div key={i} className={cn('min-w-0', field.className)}>
                  <p className="text-[11px] text-muted-foreground leading-tight">{field.label}</p>
                  <p className="text-sm font-medium truncate mt-0.5">{field.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        ) : null}

        {actions && (
          <div className="flex items-center gap-2 px-4 pb-3 pt-0">
            {actions}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
