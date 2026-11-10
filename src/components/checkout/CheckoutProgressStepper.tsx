'use client'

import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface CheckoutProgressStepperProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  className?: string
}

export function CheckoutProgressStepper({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: CheckoutProgressStepperProps) {
  const stepColors = ['primary', 'secondary', 'accent', 'ink']

  return (
    <div className={cn('relative', className)}>
      {/* Connector line */}
      <div className="hidden lg:block absolute top-10 left-[50px] right-[50px] h-1">
        <div className="h-full bg-[var(--light)] relative overflow-hidden">
          {/* Dashed background */}
          <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(90deg, var(--ink) 0, var(--ink) 8px, transparent 8px, transparent 16px)`, opacity: 0.3 }} />
          {/* Active progress fill */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: currentStep / (totalSteps - 1) }}
            transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
            style={{ transformOrigin: 'left' }}
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const color = stepColors[index % stepColors.length]

          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="flex flex-col items-center relative z-10"
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'relative w-20 h-20 rounded-full flex items-center justify-center font-display text-2xl border-3 transition-all duration-300',
                  'shadow-card',
                  isCompleted
                    ? `bg-[var(--${color})] text-white border-[var(--${color})]`
                    : isCurrent
                    ? `bg-[var(--${color})]/10 text-[var(--${color})] border-[var(--${color})] animate-pulse-soft`
                    : 'bg-[var(--light)] text-[color-mix(in_srgb,var(--ink)_40%,transparent)] border-[color-mix(in_srgb,var(--ink)_30%,transparent)]'
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                ) : (
                  <span className="font-display">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                className={cn(
                  'mt-3 text-sm font-medium text-center max-w-[100px] hidden sm:block',
                  isCompleted || isCurrent ? 'text-[var(--ink)]' : 'text-[color-mix(in_srgb,var(--ink)_40%,transparent)]'
                )}
              >
                {label}
              </motion.span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}