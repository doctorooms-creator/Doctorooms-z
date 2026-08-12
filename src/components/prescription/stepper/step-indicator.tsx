'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrescriptionStore } from '@/lib/prescription-store'

const STEPS = [
  { num: 1, label: 'Complaints' },
  { num: 2, label: 'Vitals' },
  { num: 3, label: 'Tables' },
  { num: 4, label: 'Medicines' },
  { num: 5, label: 'Advice' },
  { num: 6, label: 'Finish' },
]

export function StepIndicator() {
  const currentStep = usePrescriptionStore((s) => s.currentStep)
  const completedSteps = usePrescriptionStore((s) => s.completedSteps)
  const setCurrentStep = usePrescriptionStore((s) => s.setCurrentStep)

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center w-full">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.num
          const isCompleted = completedSteps.includes(step.num)
          const isClickable = isCompleted || isActive

          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && setCurrentStep(step.num)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive && 'bg-teal-600 text-white shadow-md',
                  isCompleted && !isActive && 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60',
                  !isActive && !isCompleted && 'text-muted-foreground cursor-not-allowed',
                  isClickable && 'cursor-pointer'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0',
                    isActive && 'bg-teal-500 text-white',
                    isCompleted && !isActive && 'bg-teal-600 text-white',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.num
                  )}
                </span>
                <span className="hidden md:inline whitespace-nowrap">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1',
                    step.num < currentStep || isCompleted
                      ? 'bg-teal-500'
                      : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: icons only, horizontal scroll */}
      <div className="flex sm:hidden items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.num
          const isCompleted = completedSteps.includes(step.num)
          const isClickable = isCompleted || isActive

          return (
            <div key={step.num} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && setCurrentStep(step.num)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all min-w-[48px]',
                  isActive && 'bg-teal-600 text-white',
                  isCompleted && !isActive && 'text-teal-600 dark:text-teal-400',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold',
                    isActive && 'bg-teal-500 text-white',
                    isCompleted && !isActive && 'bg-teal-600 text-white',
                    !isActive && !isCompleted && 'bg-muted'
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.num
                  )}
                </span>
                <span>{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5',
                    step.num < currentStep || isCompleted
                      ? 'bg-teal-500'
                      : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
