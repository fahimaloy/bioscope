'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group'
import { CreditCard, Truck, Banknote, CheckCircle, Building2 } from 'lucide-react'

interface PaymentMethodProps {
  selectedMethod: 'COD' | 'BANK_TRANSFER'
  onChange: (method: 'COD' | 'BANK_TRANSFER') => void
  className?: string
}

export function PaymentMethod({ selectedMethod, onChange, className }: PaymentMethodProps) {
  const paymentMethods = [
    {
      value: 'COD' as const,
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives at your doorstep',
      icon: Truck,
      badge: 'Most Popular',
      fee: 0,
    },
    {
      value: 'BANK_TRANSFER' as const,
      label: 'Bank Transfer',
      description: 'Transfer to our account, order ships after confirmation',
      icon: Building2,
      badge: 'Secure',
      fee: 0,
    },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-display text-lg text-primary">Payment Method</h3>

      <RadioGroup value={selectedMethod} onValueChange={onChange}>
        {paymentMethods.map((method) => (
          <label
            key={method.value}
            className={cn(
              'relative p-4 rounded-input border-3 transition-all cursor-pointer',
              selectedMethod === method.value
                ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(255,107,107,0.2)]'
                : 'border-[var(--ink)]/30 hover:border-primary'
            )}
          >
            <RadioGroupItem value={method.value} className="sr-only" />

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center flex-shrink-0">
                <method.icon className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-body text-[var(--ink)]">{method.label}</span>
                  {method.badge && (
                    <Badge variant="primary" size="sm">{method.badge}</Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--ink)]/60">{method.description}</p>
                {method.fee > 0 && (
                  <p className="text-xs text-orange-600 mt-1">Processing fee: {method.fee} BDT</p>
                )}
              </div>

              <div className="flex items-center">
                <CheckCircle className={cn(
                  'w-5 h-5 transition-colors',
                  selectedMethod === method.value ? 'text-primary' : 'text-[var(--ink)]/20'
                )} />
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>

      {/* Payment Details */}
      <div className="bg-[var(--light)] rounded-input p-4 border-2 border-[var(--ink)]">
        <h4 className="font-medium text-body text-[var(--ink)] mb-3">Payment Information</h4>
        <ul className="space-y-2 text-sm text-[var(--ink)]/70">
          <li className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span>All payments are processed securely</span>
          </li>
          <li className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span>COD: Pay cash to delivery agent</span>
          </li>
          <li className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            <span>Bank transfer details provided after order</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

// Simple version for mobile
export function SimplePaymentMethod({ selectedMethod, onChange, className }: PaymentMethodProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="font-medium text-body text-[var(--ink)]">Payment Method</h4>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: 'COD', label: 'Cash on Delivery', icon: '💵' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
        ].map((method) => (
          <button
            key={method.value}
            onClick={() => onChange(method.value as any)}
            className={cn(
              'p-3 rounded-input border-3 text-center transition-all',
              selectedMethod === method.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
            )}
          >
            <div className="text-2xl mb-1">{method.icon}</div>
            <span className="text-sm font-medium">{method.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}