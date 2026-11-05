'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutSchema, type CheckoutInput } from '@/lib/validations/order'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore, useCartItems, useCartSubtotal } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AddressForm } from '@/components/checkout/AddressForm'
import { CheckoutOrderSummary } from '@/components/checkout/OrderSummary'
import { PaymentMethod } from '@/components/checkout/PaymentMethod'
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Truck, Shield, CheckCircle } from 'lucide-react'
import { createOrder } from '@/lib/actions/order'
import { getSettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'

const STEPS = ['address', 'payment', 'review', 'confirmation'] as const
type Step = (typeof STEPS)[number]

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const clearCart = useCartStore((s) => s.clearCart)
  const [step, setStep] = useState<Step>('address')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'COD',
    },
  })

  const selectedAddressId = watch('addressId')
  const paymentMethod = watch('paymentMethod')

  // Fetch settings on mount
  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(step)
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(step)
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1])
    }
  }

  const onSubmit = async (data: CheckoutInput) => {
    setIsLoading(true)
    try {
      const result = await createOrder({
        ...data,
        items: items.map((i) => ({
          productId: i.productId,
          width: i.width,
          height: i.height,
          quantity: i.quantity,
          customization: i.customization ?? undefined,
        })),
      })
      if (result.success) {
        clearCart()
        setOrder(result.order)
        setStep('confirmation')
        toast.success('Order placed successfully')
      } else {
        toast.error((result as any)?.error || 'Could not place order')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] relative flex items-center justify-center px-4 pt-24">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="font-display text-2xl text-primary mb-4">Sign In Required</h1>
          <p className="text-[var(--ink)]/60 mb-6">Please sign in to complete your purchase.</p>
          <Button className="w-full" onClick={() => router.push('/login?callbackUrl=/checkout')}>
            Sign In
          </Button>
        </Card>
      </div>
    )
  }

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] relative flex items-center justify-center px-4 pt-24">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="font-display text-2xl text-primary mb-4">Cart is Empty</h1>
          <Button className="w-full" onClick={() => router.push('/cart')}>
            Go to Cart
          </Button>
        </Card>
      </div>
    )
  }

  // Calculate totals
  const taxAmount = settings?.globalTaxPercent ? (subtotal * settings.globalTaxPercent) / 100 : 0
  const deliveryCharge = settings?.deliveryEnabled && subtotal < (settings?.freeDeliveryThreshold || 2000)
    ? (settings?.insideDhakaCharge || 60)
    : 0
  const total = subtotal + taxAmount + deliveryCharge

  const renderStep = () => {
    switch (step) {
      case 'address':
        return (
          <AddressForm
            addresses={user?.addresses || []}
            selectedAddressId={selectedAddressId}
            onSelectAddress={(id) => setValue('addressId', id)}
            onAddAddress={async (address) => {
              const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(address),
              })
              if (res.ok) {
                const json = await res.json()
                if (json?.data?.id) setValue('addressId', json.data.id)
                toast.success('Address saved')
              } else {
                const json = await res.json().catch(() => null)
                toast.error(json?.error || 'Failed to save address')
              }
            }}
          />
        )
      case 'payment':
        return (
          <PaymentMethod
            selectedMethod={paymentMethod}
            onChange={(method) => setValue('paymentMethod', method)}
          />
        )
      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg text-primary mb-4">Shipping Address</h3>
              <AddressForm
                addresses={user?.addresses || []}
                selectedAddressId={selectedAddressId}
                onSelectAddress={() => {}}
              />
            </div>
            <div>
              <h3 className="font-display text-lg text-primary mb-4">Payment Method</h3>
              <PaymentMethod
                selectedMethod={paymentMethod}
                onChange={() => {}}
              />
            </div>
            <CheckoutOrderSummary
              items={items}
              subtotal={subtotal}
              taxAmount={taxAmount}
              deliveryCharge={deliveryCharge}
              discountAmount={0}
              total={total}
            />
          </div>
        )
      case 'confirmation':
        return order ? (
          <OrderConfirmation order={order} />
        ) : null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] relative pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm',
                  index < STEPS.indexOf(step)
                    ? 'bg-primary text-white'
                    : index === STEPS.indexOf(step)
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : 'bg-[var(--light)] text-[var(--ink)]/40'
                )}>
                  {index < STEPS.indexOf(step) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'w-16 h-1 mx-2',
                    index < STEPS.indexOf(step) ? 'bg-primary' : 'bg-[var(--light)]'
                  )} />
                )}
                <span className={cn(
                  'text-xs font-medium hidden sm:block mt-1',
                  index <= STEPS.indexOf(step) ? 'text-[var(--ink)]' : 'text-[var(--ink)]/40'
                )}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Steps */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {(step as string) !== 'confirmation' && (
                <>
                  <h2 className="font-display text-xl text-primary mb-6">
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {renderStep()}
                    {step !== 'confirmation' && (
                      <div className="flex justify-between mt-8 pt-6 border-t border-[var(--light)]">
                        {step !== 'address' && (
                          <Button type="button" variant="secondary" onClick={handleBack}>
                            Back
                          </Button>
                        )}
                        {step === 'review' ? (
                          <Button type="submit" variant="primary" size="lg" loading={isLoading}>
                            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Place Order'}
                          </Button>
                        ) : (
                          <Button type="button" variant="primary" size="lg" onClick={handleNext}>
                            Continue
                            <Truck className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    )}
                  </form>
                </>
              )}
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <CheckoutOrderSummary
              items={items}
              subtotal={subtotal}
              taxAmount={taxAmount}
              deliveryCharge={deliveryCharge}
              discountAmount={0}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  )
}