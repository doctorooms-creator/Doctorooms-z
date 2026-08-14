'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
  pullThreshold?: number
  disabled?: boolean
}

const PULL_THRESHOLD = 70
const MAX_PULL = 120

export function PullToRefresh({
  onRefresh,
  children,
  className,
  pullThreshold = PULL_THRESHOLD,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, pullThreshold], [0, 1])
  const scale = useTransform(y, [0, pullThreshold], [0.6, 1])
  const rotate = useTransform(y, [0, pullThreshold], [0, 360])
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, isRefreshing])

  const handleDragStart = useCallback(() => {
    if (disabled || isRefreshing) return
    const el = containerRef.current
    if (!el) return
    // Only allow pull from top when scrolled to top
    if (el.scrollTop <= 0) {
      startY.current = 0
      setIsPulling(true)
    }
  }, [disabled, isRefreshing])

  const handleDrag = useCallback(
    (_: any, info: { point: { y: number } }) => {
      if (disabled || isRefreshing || !isPulling) return
      const diff = info.point.y - startY.current
      // Apply resistance (pull harder = less movement)
      const dampened = Math.max(0, diff * 0.4)
      y.set(Math.min(dampened, MAX_PULL))
    },
    [disabled, isRefreshing, isPulling, y]
  )

  const handleDragEnd = useCallback(() => {
    if (disabled || isRefreshing) return
    const currentY = y.get()
    if (currentY >= pullThreshold) {
      // Trigger refresh
      y.set(0)
      setIsPulling(false)
      handleRefresh()
    } else {
      y.set(0)
      setIsPulling(false)
    }
  }, [disabled, isRefreshing, y, pullThreshold, handleRefresh])

  return (
    <div ref={containerRef} className={cn('overflow-y-auto overscroll-contain', className)}>
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            className="flex items-center justify-center py-2"
            style={{ opacity }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isPulling ? Math.max(40, y.get()) : 48, opacity: isPulling ? opacity.get() : 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <motion.div style={{ scale, rotate }}>
                <ArrowDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  )
}
