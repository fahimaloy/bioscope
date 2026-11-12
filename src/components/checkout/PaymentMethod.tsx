'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group'
import { CreditCard, Truck, Shield, Banknote, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface PaymentMethodProps {
  selectedMethod: 'COD' | 'BANK_TRANSFER'
  onChange: (method: 'COD' | 'BANK_TRANSFER') => void
  className?: string
  readOnly?: boolean
}

export function PaymentMethod({ selectedMethod, onChange, className, readOnly = false }: PaymentMethodProps) {
  const paymentMethods = [
    {
      value: 'COD' as const,
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives at your doorstep',
      icon: Truck,
      iconBg: 'primary',
      badge: 'Most Popular',
      fee: 0,
      color: 'primary',
    },
    {
      value: 'BANK_TRANSFER' as const,
      label: 'Online Payment',
      description: 'Secure payment via SSLCommerz gateway',
      icon: Shield,
      iconBg: 'secondary',
      badge: 'Secure',
      fee: 0,
      color: 'secondary',
    },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-display text-lg text-primary">Payment Method</h3>

      <RadioGroup value={selectedMethod} onValueChange={onChange} disabled={readOnly}>
        {paymentMethods.map((method, index) => (
          <motion.label
            key={method.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
            className={cn(
              'relative cursor-pointer transition-all duration-300',
              selectedMethod === method.value
                ? 'border-primary shadow-card-hover ring-2 ring-primary/30'
                : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] hover:border-primary'
            )}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <RadioGroupItem value={method.value} className="sr-only" disabled={readOnly} />

            <Card variant="doodle" padding="lg" className="relative overflow-visible">
              {/* Sticker peel corner for selected */}
              {selectedMethod === method.value && (
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-[var(--primary)] border-2 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)]" />
              )}

              <div className="flex items-start gap-4">
                {/* Animated Icon */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                    `bg-[var(--${method.iconBg})]/15`
                  )}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <method.icon className={cn('w-7 h-7', `text-[var(--${method.iconBg})]`)} />
                  </motion.div>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="font-display text-lg text-[var(--ink)]">{method.label}</span>
                    {method.badge && (
                      <Badge variant="primary" size="sm">{method.badge}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-2">{method.description}</p>
                  {method.fee > 0 && (
                    <p className="text-xs text-orange-600">Processing fee: {method.fee} BDT</p>
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
                      <CheckCircle className="w-4 h-4 text-primary" />
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
        <h4 className="font-display text-base text-primary mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Payment Information
        </h4>
        <ul className="space-y-2 text-sm text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
          <li className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span>All payments are processed securely via SSLCommerz</span>
          </li>
          <li className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span>COD: Pay cash to delivery agent upon arrival</span>
          </li>
          <li className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            <span>Online: Redirect to secure payment gateway</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

// Simple version for mobile/review step
export function SimplePaymentMethod({ selectedMethod, onChange, className, readOnly = false }: PaymentMethodProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="font-medium text-body text-[var(--ink)]">Payment Method</h4>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: 'COD', label: 'Cash on Delivery', icon: Truck, color: 'primary' },
          { value: 'BANK_TRANSFER', label: 'Online Payment', icon: Shield, color: 'secondary' },
        ].map((method) => (
          <motion.button
            key={method.value}
            onClick={() => !readOnly && onChange(method.value as any)}
            disabled={readOnly}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'p-4 rounded-card border-3 text-center transition-all duration-300',
              selectedMethod === method.value
                ? `border-[var(--${method.color})] bg-[var(--${method.color})]/10 text-[var(--${method.color})] shadow-card`
                : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--ink)] hover:border-primary'
            )}
          >
            <div className={cn('w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center', `bg-[var(--${method.color})]/15`)}>
              <method.icon className={cn('w-5 h-5', `text-[var(--${method.color})]`)} />
            </div>
            <span className="text-sm font-medium">{method.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}