'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Trash2, Pencil, MoreHorizontal } from 'lucide-react'

interface SwipeAction {
  label: string
  icon?: ReactNode
  color?: string
  onClick: () => void
  variant?: 'default' | 'danger' | 'primary'
}

interface SwipeableItemProps {
  children: ReactNode
  actions?: SwipeAction[]
  className?: string
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
}

const defaultActions: Record<string, SwipeAction> = {
  edit: {
    label: 'Edit',
    icon: <Pencil className="w-4 h-4" />,
    color: 'bg-violet-500 text-white',
    variant: 'primary',
    onClick: () => {},
  },
  delete: {
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    color: 'bg-red-500 text-white',
    variant: 'danger',
    onClick: () => {},
  },
}

const SWIPE_THRESHOLD = 80
const MAX_SWIPE = 200

export function SwipeableItem({
  children,
  actions = [],
  className,
  onSwipeStart,
  onSwipeEnd,
}: SwipeableItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const x = useMotionValue(0)
  const bg = useTransform(x, [-MAX_SWIPE, 0], ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0)'])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x
      const velocity = info.velocity.x

      if (offset < -SWIPE_THRESHOLD || velocity < -300) {
        // Swiped left enough — open
        x.set(-MAX_SWIPE)
        setIsOpen(true)
      } else if (offset > SWIPE_THRESHOLD / 2 || velocity > 300) {
        // Swiped right — close
        x.set(0)
        setIsOpen(false)
      } else {
        // Bounce back
        x.set(isOpen ? -MAX_SWIPE : 0)
      }
      onSwipeEnd?.()
    },
    [x, isOpen, onSwipeEnd]
  )

  const handleDragStart = () => {
    onSwipeStart?.()
  }

  const closeSwipe = () => {
    x.set(0)
    setIsOpen(false)
  }

  const totalActionWidth = actions.length * 64

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
      onPointerDown={(e) => {
        // If clicking outside the swipe area, close
        if (isOpen && !(e.target as HTMLElement).closest('[data-swipe-action]')) {
          closeSwipe()
        }
      }}
    >
      {/* Background action buttons */}
      <motion.div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: totalActionWidth, x: totalActionWidth }}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            data-swipe-action
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
              closeSwipe()
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-2',
              action.variant === 'danger'
                ? 'bg-red-500 text-white active:bg-red-600'
                : action.variant === 'primary'
                  ? 'bg-violet-500 text-white active:bg-violet-600'
                  : 'bg-slate-600 text-white active:bg-slate-700'
            )}
            aria-label={action.label}
          >
            {action.icon || <MoreHorizontal className="w-4 h-4" />}
            <span className="text-[10px] font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Foreground content */}
      <motion.div
        style={{ x, background: bg }}
        drag="x"
        dragConstraints={{ left: -totalActionWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        className={cn('relative bg-background rounded-lg', className)}
      >
        {children}
      </motion.div>
    </div>
  )
}

export { defaultActions }
