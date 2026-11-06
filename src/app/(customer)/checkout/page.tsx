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
import { CheckoutProgressStepper } from '@/components/checkout/CheckoutProgressStepper'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Truck, Shield, CheckCircle } from 'lucide-react'
import { createOrder } from '@/lib/actions/order'
import { getSettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { motion } from 'framer-motion'

const STEPS = ['address', 'payment', 'review', 'confirmation'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS = ['Address', 'Payment', 'Review', 'Confirmation']

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

  const currentStepIndex = STEPS.indexOf(step)

  const handleNext = () => {
    if (step === 'address' && !selectedAddressId) {
      toast.error('Please select or add a shipping address')
      return
    }
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1])
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1])
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
        <Card variant="doodle" padding="xl" className="w-full max-w-md text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl text-primary mb-4"
          >
            Sign In Required
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--ink)]/60 mb-6"
          >
            Please sign in to complete your purchase.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push('/login?callbackUrl=/checkout')}
            className="w-full"
          >
            <Button className="w-full" variant="primary" size="lg">
              Sign In
            </Button>
          </motion.button>
        </Card>
      </div>
    )
  }

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] relative flex items-center justify-center px-4 pt-24">
        <Card variant="doodle" padding="xl" className="w-full max-w-md text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl text-primary mb-4"
          >
            Cart is Empty
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push('/cart')}
          >
            <Button className="w-full" variant="primary" size="lg">
              <Truck className="w-4 h-4 mr-2" />
              Go to Cart
            </Button>
          </motion.button>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-display text-lg text-primary mb-4">Shipping Address</h3>
              <AddressForm
                addresses={user?.addresses || []}
                selectedAddressId={selectedAddressId}
                onSelectAddress={() => {}}
                readOnly
              />
            </div>
            <div>
              <h3 className="font-display text-lg text-primary mb-4">Payment Method</h3>
              <PaymentMethod
                selectedMethod={paymentMethod}
                onChange={() => {}}
                readOnly
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
          </motion.div>
        )
      case 'confirmation':
        return order ? (
          <OrderConfirmation order={order} />
        ) : null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] relative pt-24 pb-12 px-4">
      <DoodleScatter count={6} />
      
      <div className="max-w-7xl mx-auto">
        {/* Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="mb-8"
        >
          <CheckoutProgressStepper
            currentStep={currentStepIndex}
            totalSteps={STEPS.length}
            stepLabels={STEP_LABELS}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Form Steps */}
          <div className="lg:col-span-2">
            <Card variant="doodle" padding="lg" className="relative">
              {(step as string) !== 'confirmation' && (
                <>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-display text-xl text-primary mb-6"
                  >
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </motion.h2>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {renderStep()}
                    {step !== 'confirmation' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-between mt-8 pt-6 border-t border-[var(--light)]"
                      >
                        {step !== 'address' && (
                          <Button type="button" variant="secondary" onClick={handleBack}>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                          </Button>
                        )}
                        {step === 'review' ? (
                          <Button type="submit" variant="primary" size="lg" loading={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Placing Order...
                              </>
                            ) : (
                              <>
                                Place Order
                                <CheckCircle className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button type="button" variant="primary" size="lg" onClick={handleNext}>
                            Continue
                            <Truck className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </form>
                </>
              )}
            </Card>
          </div>

          {/* Order Summary - Sticky Sidebar */}
          <div className="lg:col-span-1">
            {(step as string) !== 'confirmation' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <CheckoutOrderSummary
                  items={items}
                  subtotal={subtotal}
                  taxAmount={taxAmount}
                  deliveryCharge={deliveryCharge}
                  discountAmount={0}
                  total={total}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}