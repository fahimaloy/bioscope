'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface PromoCodeProps {
  onApply?: (code: string) => void
  discountAmount?: number
  appliedCode?: string | null
  className?: string
}

export function PromoCode({ onApply, discountAmount = 0, appliedCode = null, className }: PromoCodeProps) {
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!code.trim() || applying) return

    setApplying(true)
    setError(null)

    try {
      await onApply?.(code.trim())
      // Success handled by parent updating appliedCode
    } catch (err) {
      setError('Invalid or expired promo code')
    } finally {
      setApplying(false)
    }
  }

  const handleRemove = () => {
    onApply?.('')
    setCode('')
  }

  if (appliedCode) {
    return (
      <div className={cn('bg-green-50 border-2 border-green-200 rounded-input p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Promo Applied</p>
              <p className="text-sm text-green-600">{appliedCode}</p>
            </div>
          </div>
          {discountAmount > 0 && (
            <span className="font-display text-green-700">-{discountAmount.toLocaleString()} BDT</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleRemove} className="text-red-500 hover:bg-red-50">
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm font-medium text-[var(--ink)]">Promo Code</label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null) }}
          placeholder="Enter code"
          disabled={applying}
          className="flex-1"
        />
        <Button
          variant={discountAmount > 0 ? 'secondary' : 'primary'}
          onClick={handleApply}
          disabled={applying || !code.trim()}
        >
          {applying ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            discountAmount > 0 ? 'Update' : 'Apply'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <XCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}