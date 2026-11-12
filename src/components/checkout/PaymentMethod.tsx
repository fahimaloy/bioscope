'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group'
import { CreditCard, Truck, Shield, Banknote, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'

interface PaymentMethodProps {
  selectedMethod: 'COD' | 'BANK_TRANSFER'
  onChange: (method: 'COD' | 'BANK_TRANSFER') => void
  className?: string
  readOnly?: boolean
}

interface PaymentOption {
  value: 'COD' | 'BANK_TRANSFER'
  label: string
  description: string
  icon: typeof Truck
  iconBg: string
  iconColor: string
  badge: string
  fee: number
}

/**
 * Static class literals, never `bg-[var(--${color})]` template strings:
 * Tailwind scans source text, so a dynamically constructed class emits no CSS.
 */
const PAYMENT_METHODS: PaymentOption[] = [
  {
    value: 'COD',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives at your doorstep',
    icon: Truck,
    iconBg: 'bg-[color-mix(in_srgb,var(--brand)_15%,transparent)]',
    iconColor: 'text-[var(--brand)]',
    badge: 'Most Popular',
    fee: 0,
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Online Payment',
    description: 'Secure payment via SSLCommerz gateway',
    icon: Shield,
    iconBg: 'bg-[color-mix(in_srgb,var(--violet)_15%,transparent)]',
    iconColor: 'text-[var(--violet)]',
    badge: 'Secure',
    fee: 0,
  },
]

export function PaymentMethod({ selectedMethod, onChange, className, readOnly = false }: PaymentMethodProps) {
  const variants = useMotionVariants()

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-display text-lg text-[var(--brand)]">Payment Method</h3>

      <RadioGroup value={selectedMethod} onValueChange={onChange} disabled={readOnly}>
        {PAYMENT_METHODS.map((method, index) => (
          <motion.label
            key={method.value}
            variants={variants.slideInLeft}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
            className={cn(
              'relative cursor-pointer transition-colors duration-300 block',
              selectedMethod === method.value
                ? 'border-[var(--brand)] shadow-ink-3 ring-2 ring-[var(--brand)]'
                : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] hover:border-[var(--brand)]'
            )}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <RadioGroupItem value={method.value} className="sr-only" disabled={readOnly} />

            <Card variant="doodle" padding="lg" className="relative overflow-visible">
              {/* Sticker peel corner for selected */}
              {selectedMethod === method.value && (
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-[var(--brand)] border-2 border-[var(--ink)] rounded-tr-full shadow-ink-1" />
              )}

              <div className="flex items-start gap-4">
                {/* Animated Icon — CSS loops, disabled under prefers-reduced-motion. */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 animate-float-gentle',
                    method.iconBg
                  )}
                >
                  <method.icon className={cn('w-7 h-7 animate-wobble', method.iconColor)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="font-display text-lg text-[var(--text)]">{method.label}</span>
                    {method.badge && (
                      <Badge variant="primary" size="sm">{method.badge}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-subtle)] mb-2">{method.description}</p>
                  {method.fee > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">Processing fee: {method.fee} BDT</p>
                  )}
                </div>

                {/* Selection indicator */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: selectedMethod === method.value ? 1 : 0,
                    rotate: selectedMethod === method.value ? 0 : -180,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="flex items-center justify-center w-10 h-10 flex-shrink-0"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] flex items-center justify-center">
                    {selectedMethod === method.value && (
                      <CheckCircle className="w-4 h-4 text-[var(--brand)]" />
                    )}
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.label>
        ))}
      </RadioGroup>

      {/* Payment Details */}
      <Card variant="outlined" padding="md" className="border-[color-mix(in_srgb,var(--ink)_30%,transparent)]">
        <h4 className="font-display text-base text-[var(--brand)] mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Payment Information
        </h4>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--brand)]" />
            <span>All payments are processed securely via SSLCommerz</span>
          </li>
          <li className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[var(--brand)]" />
            <span>COD: Pay cash to delivery agent upon arrival</span>
          </li>
          <li className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[var(--brand)]" />
            <span>Online: Redirect to secure payment gateway</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

// Simple version for mobile/review step
export function SimplePaymentMethod({ selectedMethod, onChange, className, readOnly = false }: PaymentMethodProps) {
  const options = [
    {
      value: 'COD' as const,
      label: 'Cash on Delivery',
      icon: Truck,
      selectedClasses: 'border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] shadow-ink-3',
      iconBg: 'bg-[color-mix(in_srgb,var(--brand)_15%,transparent)]',
      iconColor: 'text-[var(--brand)]',
    },
    {
      value: 'BANK_TRANSFER' as const,
      label: 'Online Payment',
      icon: Shield,
      selectedClasses: 'border-[var(--violet)] bg-[color-mix(in_srgb,var(--violet)_10%,transparent)] shadow-ink-3',
      iconBg: 'bg-[color-mix(in_srgb,var(--violet)_15%,transparent)]',
      iconColor: 'text-[var(--violet)]',
    },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="font-medium text-[var(--text)]">Payment Method</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((method) => (
          <motion.button
            key={method.value}
            onClick={() => !readOnly && onChange(method.value)}
            disabled={readOnly}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'p-4 rounded-[var(--radius-lg)] border-[3px] text-center transition-colors duration-300',
              selectedMethod === method.value
                ? method.selectedClasses
                : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--text)] hover:border-[var(--brand)]'
            )}
          >
            <div className={cn('w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center', method.iconBg)}>
              <method.icon className={cn('w-5 h-5', method.iconColor)} />
            </div>
            <span className="text-sm font-medium">{method.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
