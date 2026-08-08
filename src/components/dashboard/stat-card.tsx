'use client'

import { motion } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  gradient?: string
  iconBg?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-teal-500 to-teal-600',
  iconBg = 'bg-teal-100 dark:bg-teal-900/50',
  className,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg',
        className
      )}
    >
      {/* Gradient bottom accent */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r',
          gradient
        )}
      />

      {/* Shimmer hover effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            iconBg
          )}
        >
          <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
      </div>
    </motion.div>
  )
}
