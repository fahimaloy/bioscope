'use client'

import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'

interface CheckoutProgressStepperProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  className?: string
}

/**
 * Numbered ink circles joined by a dashed connector (spec §5.8 / Task 2.5).
 *
 * The progress fill is a solid `--brand` bar — the legacy gradient is gone
 * (Ruling 6). The track is a 10% ink wash, the dashes are the connector, and
 * every circle is a static class literal so Tailwind can see it.
 */
export function CheckoutProgressStepper({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: CheckoutProgressStepperProps) {
  const variants = useMotionVariants()
  const progress = totalSteps > 1 ? currentStep / (totalSteps - 1) : 0

  return (
    <div className={cn('relative', className)}>
      {/* Connector: a dashed ink line with a solid brand fill growing over it. */}
      <div className="hidden lg:block absolute top-10 left-[50px] right-[50px] h-1">
        <div className="relative h-full w-full overflow-hidden rounded-pill bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]">
          {/* Dashed connector */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, var(--ink) 0, var(--ink) 8px, transparent 8px, transparent 16px)',
              opacity: 0.3,
            }}
          />
          {/* Active progress fill — solid brand, transform-only animation. */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
            style={{ transformOrigin: 'left' }}
            className="absolute inset-0 bg-[var(--brand)]"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <motion.div
              key={label}
              variants={variants.fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center relative z-10"
            >
              {/* Step Circle — smaller below sm so four circles fit 320px. */}
              <div
                className={cn(
                  'relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-display text-lg sm:text-2xl border-[3px] transition-colors duration-300 shadow-ink-3',
                  isCompleted
                    ? 'bg-[var(--brand)] text-[var(--text)] border-[var(--ink)]'
                    : isCurrent
                    ? 'bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] border-[var(--ink)] animate-pulse-soft'
                    : 'bg-[var(--paper-deep)] text-[var(--text-subtle)] border-[color-mix(in_srgb,var(--ink)_30%,transparent)]'
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                  >
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                  </motion.div>
                ) : (
                  <span className="font-display">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <motion.span
                variants={variants.fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 + 0.2 }}
                className={cn(
                  'mt-3 text-sm font-medium text-center max-w-[100px] hidden sm:block',
                  isCompleted || isCurrent ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]'
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
