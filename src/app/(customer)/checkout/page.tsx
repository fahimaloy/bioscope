'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutSchema, type CheckoutInput } from '@/lib/validations/order'
import type { Order } from '@/types'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore, useCartItems, useCartSubtotal } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AddressForm } from '@/components/checkout/AddressForm'
import { CheckoutOrderSummary } from '@/components/checkout/OrderSummary'
import { PaymentMethod } from '@/components/checkout/PaymentMethod'
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation'
import { CheckoutProgressStepper } from '@/components/checkout/CheckoutProgressStepper'
import { Loader2, Truck, CheckCircle } from 'lucide-react'
import { createOrder } from '@/lib/actions/order'
import type { Prisma } from '@prisma/client'
import { getSettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { DoodleScatter } from '@/components/decorative'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'

const STEPS = ['address', 'payment', 'review', 'confirmation'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS = ['Address', 'Payment', 'Review', 'Confirmation']

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth()
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const clearCart = useCartStore((s) => s.clearCart)
  const variants = useMotionVariants()
  const [step, setStep] = useState<Step>('address')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<Record<string, string | number | boolean> | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  const {
    handleSubmit,
    watch,
    setValue,
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
          customization: (i.customization as Prisma.InputJsonValue | null) ?? undefined,
        })),
      })
      if (result.success) {
        clearCart()
        setOrder(result.order as unknown as Order)
        setStep('confirmation')
        toast.success('Order placed successfully')
      } else {
        toast.error((result as { error?: string })?.error || 'Could not place order')
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
   <div className="min-h-screen relative flex items-center justify-center px-4 pt-24">
        <Card variant="doodle" padding="xl" className="w-full max-w-md text-center relative">
          <motion.h1
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="font-display text-2xl text-[var(--text)] mb-4"
          >
            Sign In Required
          </motion.h1>
          <motion.p
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
            className="text-[var(--text-muted)] mb-6"
          >
            Please sign in to complete your purchase.
          </motion.p>
          <motion.div
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            {/* Ruling 3: the login page reads `callbackUrl`, not `redirect`. */}
            <Link href="/login?callbackUrl=/checkout" className="block">
              <Button className="w-full" variant="primary" size="lg">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </Card>
      </div>
    )
  }

  // Redirect to cart if empty. The confirmation step keeps its card: placing an
  // order clears the cart, so an empty cart is the *result* of the last step,
  // not a reason to leave it.
  if (items.length === 0 && step !== 'confirmation') {
    return (
   <div className="min-h-screen relative flex items-center justify-center px-4 pt-24">
        <Card variant="doodle" padding="xl" className="w-full max-w-md text-center relative">
          <motion.h1
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="font-display text-2xl text-[var(--text)] mb-4"
          >
            Cart is Empty
          </motion.h1>
          <motion.div
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <Link href="/cart" className="block">
              <Button className="w-full" variant="primary" size="lg">
                <Truck className="w-4 h-4 mr-2" />
                Go to Cart
              </Button>
            </Link>
          </motion.div>
        </Card>
      </div>
    )
  }

  // Calculate totals. `getSettings()` returns a flat map keyed by the database
  // key (snake_case); `parseSettingValue` already returns numbers for NUMBER and
  // booleans for BOOLEAN, so coerce defensively and keep the original defaults.
  const taxPercent = Number(settings?.global_tax_percent) || 0
  const taxAmount = taxPercent ? (subtotal * taxPercent) / 100 : 0
  const freeDeliveryThreshold = Number(settings?.free_delivery_threshold) || 2000
  const insideDhakaCharge = Number(settings?.delivery_inside_dhaka_charge) || 60
  const deliveryCharge =
    settings?.delivery_enabled === true && subtotal < freeDeliveryThreshold
      ? insideDhakaCharge
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
                // `POST /api/addresses` returns `created({ address })`, so the
                // id is at `data.address.id` — not `data.id`.
                const addressId = json?.data?.address?.id ?? json?.data?.id
                if (addressId) setValue('addressId', addressId)
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
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            <div>
              <h3 className="font-display text-lg text-[var(--brand)] mb-4">Shipping Address</h3>
              <AddressForm
                addresses={user?.addresses || []}
                selectedAddressId={selectedAddressId}
                onSelectAddress={() => {}}
                readOnly
              />
            </div>
            <div>
              <h3 className="font-display text-lg text-[var(--brand)] mb-4">Payment Method</h3>
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
      default:
        return null
    }
  }

  const stepTitle = step.charAt(0).toUpperCase() + step.slice(1)

  return (
  <div className="min-h-screen relative pt-24 pb-12 px-4">
      {/* One decor accent per section (contract §3). */}
      <DoodleScatter count={6} seed="checkout" />

      <div className="max-w-7xl mx-auto relative">
        {/* Progress Stepper */}
        <motion.div
          variants={variants.fadeInDown}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <CheckoutProgressStepper
            currentStep={currentStepIndex}
            totalSteps={STEPS.length}
            stepLabels={STEP_LABELS}
          />
        </motion.div>

        <motion.div
          variants={variants.fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Form Steps / Confirmation */}
          <div className="lg:col-span-2">
            <Card variant="doodle" padding="lg" className="relative">
              {step === 'confirmation' ? (
                order ? <OrderConfirmation order={order} /> : null
              ) : (
                <>
                  <motion.h2
                    variants={variants.fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.3 }}
                    className="font-display text-xl text-[var(--brand)] mb-6"
                  >
                    {stepTitle}
                  </motion.h2>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {renderStep()}
                    <motion.div
                      variants={variants.fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: 0.4 }}
                      className="flex justify-between mt-8 pt-6 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]"
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
                  </form>
                </>
              )}
            </Card>
          </div>

          {/* Order Summary - Sticky Sidebar */}
          <div className="lg:col-span-1">
            {step !== 'confirmation' && (
              <motion.div
                variants={variants.fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
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
