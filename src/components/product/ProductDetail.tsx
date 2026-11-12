'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { priceLine } from '@/lib/pricing'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { HoverLift } from '@/components/animations/HoverLift'
import { FOCUS_VISIBLE_INK } from '@/components/ui/shared'
import { useCartStore, useIsInCart } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Product, DimensionConfig } from '@/types'
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  RotateCcw,
  Shield,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Check,
  Expand,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'
import { SketchUnderline } from '@/components/decorative'

interface ProductDetailProps {
  product: Product
}

const FALLBACK_IMAGE = '/images/stickers/skull_sticker.png'

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedDimension, setSelectedDimension] = useState<DimensionConfig | null>(
    product.allowedDimensions.find((d) => d.isDefault) || product.allowedDimensions[0] || null
  )
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [addToCartState, setAddToCartState] = useState<'idle' | 'loading' | 'success'>('idle')

  const variants = useMotionVariants()
  const { addItem, updateQuantity } = useCartStore()
  const { isAuthenticated } = useAuth()

  // Copy before sorting: `Array.prototype.sort` mutates in place, and
  // `allowedQuantities` is a React prop (tracked defect).
  const quantityConfigs = [...product.allowedQuantities].sort((a, b) => a.minQty - b.minQty)
  const matchingQtyConfig = quantityConfigs.find(
    (q) => selectedQuantity >= q.minQty && (q.maxQty === null || selectedQuantity <= q.maxQty)
  )

  // Coerce the Decimal-derived fields once (tracked defect): a Prisma Decimal
  // serialises to a string, so a raw `>` between two of them is lexicographic.
  const basePrice = Number(product.basePrice)
  const compareAtPrice = product.compareAtPrice == null ? null : Number(product.compareAtPrice)

  // Authoritative money math — `priceLine` rounds to 2dp and includes
  // `additionalCharge`, so the displayed price matches what the server charges.
  const priced = priceLine(
    {
      product,
      width: selectedDimension?.width ?? 0,
      height: selectedDimension?.height ?? 0,
      quantity: selectedQuantity,
    },
    0, // globalTaxPercent — display only; tax is computed server-side at checkout
  )
  const unitPrice = priced.unitPrice
  const totalPrice = priced.lineTotal

  const inCart = useIsInCart(product.id, selectedDimension?.width ?? 0, selectedDimension?.height ?? 0)

  const hasDiscount = compareAtPrice != null && compareAtPrice > basePrice
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : 0

  const handleAddToCart = async () => {
    if (!selectedDimension) return
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/shop/${product.slug}`
      return
    }

    setAddToCartState('loading')

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (inCart) {
      updateQuantity(product.id, selectedDimension.width, selectedDimension.height, selectedQuantity)
    } else {
      addItem({
        productId: product.id,
        product,
        width: selectedDimension.width,
        height: selectedDimension.height,
        quantity: selectedQuantity,
        customization: null,
      })
    }

    setAddToCartState('success')
    setTimeout(() => setAddToCartState('idle'), 2000)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, selectedQuantity + delta)
    // Check if new quantity is valid
    const validConfig = quantityConfigs.find(
      (q) => newQuantity >= q.minQty && (q.maxQty === null || newQuantity <= q.maxQty)
    )
    if (validConfig) {
      setSelectedQuantity(newQuantity)
    }
  }

  const handleImageSelect = (index: number) => {
    setSelectedImage(index)
  }

  const handleLightboxNav = (direction: 'prev' | 'next') => {
    setSelectedImage((prev) =>
      direction === 'prev'
        ? prev === 0
          ? product.images.length - 1
          : prev - 1
        : prev === product.images.length - 1
          ? 0
          : prev + 1,
    )
  }

  const handleLightboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handleLightboxNav('prev')
    else if (e.key === 'ArrowRight') handleLightboxNav('next')
    else if (e.key === 'Escape') setIsLightboxOpen(false)
  }

  const currentImage = product.images[selectedImage] || FALLBACK_IMAGE

  return (
    <div className="space-y-8">
      {/* Product header — one decor accent: the SketchUnderline on the h1. */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        className="flex items-start justify-between gap-4 mb-6"
      >
        <div>
          <Badge variant="doodle" size="sm" className="mb-2">
            {product.category?.name || 'Product'}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--text)]">
            <SketchUnderline>{product.name}</SketchUnderline>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Add to wishlist">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Share product">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div
            className="relative aspect-square rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] shadow-ink-3 overflow-hidden cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsLightboxOpen(true)
              }
            }}
            aria-label="Open image lightbox"
          >
            <HoverLift scale={1.02}>
              <Image
                src={currentImage}
                alt={`${product.name} - Main view`}
                fill
                className="object-cover transition-transform duration-slow ease-out hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE
                }}
              />
            </HoverLift>
            {/* Expand hint */}
            <div className="absolute bottom-3 right-3 bg-[var(--overlay)] text-[var(--paper)] px-3 py-1 rounded-pill text-sm flex items-center gap-1">
              <Expand className="w-4 h-4" />
              <span>Zoom</span>
            </div>
          </div>

          {product.images.length > 1 && (
            <div
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
              role="list"
              aria-label="Product thumbnails"
            >
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleImageSelect(index)}
                  className={cn(
                    'relative w-20 h-20 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden border-[3px] transition-all snap-center',
                    FOCUS_VISIBLE_INK,
                    selectedImage === index
                      ? 'border-[var(--brand)] scale-105 shadow-ink-2'
                      : 'border-transparent hover:border-[color-mix(in_srgb,var(--ink)_30%,transparent)]'
                  )}
                  aria-label={`View image ${index + 1}`}
                  aria-current={selectedImage === index ? 'true' : 'false'}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div
          variants={variants.fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="space-y-6"
        >
          {/* Price */}
          <div className="flex items-baseline gap-4 flex-wrap" data-testid="price-block">
            <span data-testid="unit-price" className="font-display text-4xl text-[var(--brand)]">
              {unitPrice.toLocaleString()} BDT
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-[var(--text-subtle)] line-through">
                  {compareAtPrice.toLocaleString()} BDT
                </span>
                <Badge variant="error" size="md">
                  -{discountPercent}%
                </Badge>
              </>
            )}
            {matchingQtyConfig && quantityConfigs.length > 1 && (
              <Badge variant="secondary" size="sm">
                {matchingQtyConfig.label}
              </Badge>
            )}
          </div>

          {/* Tax Info */}
          {product.taxPercent > 0 && (
            <p className="text-sm text-[var(--text-subtle)]">
              Price {product.isTaxInclusive ? 'includes' : 'excludes'} tax ({product.taxPercent}%)
            </p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-lg text-[var(--text-muted)] leading-relaxed">{product.description}</p>
          )}

          {/* Configuration */}
          <div className="space-y-6 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)] pt-6">
            {/* Dimensions */}
            {product.allowedDimensions.length > 0 && (
              <fieldset>
                <legend className="font-medium text-[var(--text)] mb-3">Select Size</legend>
                <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Size options">
                  {product.allowedDimensions.map((dim) => {
                    const multiplier = Number(dim.priceMultiplier)
                    const isSelected = selectedDimension?.id === dim.id
                    return (
                      <Button
                        key={`${dim.width}x${dim.height}`}
                        variant={isSelected ? 'primary' : 'outline'}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedDimension(dim)}
                        className={cn('min-w-[100px] flex-col gap-0.5', isSelected && 'shadow-ink-2 animate-pulse-soft')}
                      >
                        <span className="block font-display">{dim.label}</span>
                        {multiplier !== 1 && (
                          <span className="text-xs">
                            {multiplier > 1 ? '+' : ''}
                            {Math.round((multiplier - 1) * 100)}%
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </fieldset>
            )}

            {/* Quantity */}
            <fieldset>
              <legend className="font-medium text-[var(--text)] mb-3">Quantity</legend>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center border-[3px] border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-[var(--radius-md)] overflow-hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={selectedQuantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-12 h-12 p-0 rounded-none border-0 shadow-none hover:shadow-none"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      handleQuantityChange(val - selectedQuantity)
                    }}
                    className="w-auto min-w-[3rem] h-12 text-center text-xl font-display text-[var(--text)] border-none bg-transparent focus:outline-none"
                    min="1"
                    max={matchingQtyConfig?.maxQty || 999}
                    aria-label="Quantity"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    aria-label="Increase quantity"
                    className="w-12 h-12 p-0 rounded-none border-0 shadow-none hover:shadow-none"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {matchingQtyConfig && (
                  <span className="text-sm text-[var(--text-subtle)]">{matchingQtyConfig.label}</span>
                )}
              </div>
            </fieldset>

            {/* Customization Options */}
            {product.customizationOptions && (
              <fieldset>
                <legend className="font-medium text-[var(--text)] mb-3">Customize</legend>
                <div className="space-y-4">
                  {product.customizationOptions.materials?.length && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-2">Material</label>
                      <div className="flex flex-wrap gap-2">
                        {product.customizationOptions.materials.map((material) => (
                          <button
                            key={material}
                            type="button"
                            className={cn(
                              'px-4 py-2 rounded-[var(--radius-md)] border-2 text-sm transition-all',
                              'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--text)] hover:border-[var(--brand)]'
                            )}
                          >
                            {material.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.customizationOptions.finishes?.length && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-2">Finish</label>
                      <div className="flex flex-wrap gap-2">
                        {product.customizationOptions.finishes.map((finish) => (
                          <button
                            key={finish}
                            type="button"
                            className={cn(
                              'px-4 py-2 rounded-[var(--radius-md)] border-2 text-sm transition-all',
                              'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--text)] hover:border-[var(--brand)]'
                            )}
                          >
                            {finish}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.customizationOptions.cutTypes?.length && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-2">Cut Type</label>
                      <div className="flex flex-wrap gap-2">
                        {product.customizationOptions.cutTypes.map((cut) => (
                          <button
                            key={cut}
                            type="button"
                            className={cn(
                              'px-4 py-2 rounded-[var(--radius-md)] border-2 text-sm transition-all',
                              'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--text)] hover:border-[var(--brand)]'
                            )}
                          >
                            {cut.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>
            )}
          </div>

          {/* Total Price */}
          <div className="bg-[var(--paper-deep)] rounded-[var(--radius-lg)] p-4 border-2 border-[var(--ink)]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--text)]">
                Total ({selectedQuantity} × {unitPrice.toLocaleString()} BDT)
              </span>
              <span className="text-2xl font-display text-[var(--brand)]">{totalPrice.toLocaleString()} BDT</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
            <Button
              variant="primary"
              size="xl"
              className="w-full sm:w-auto flex-1 min-w-[200px]"
              onClick={handleAddToCart}
              disabled={!isAuthenticated || !selectedDimension || addToCartState === 'loading'}
              loading={addToCartState === 'loading'}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {addToCartState === 'success' && (
                <>
                  <Check className="w-5 h-5 mr-2 animate-bounce" />
                  Added!
                </>
              )}
              {addToCartState !== 'success' && (inCart ? 'Update Cart' : 'Add to Cart')}
            </Button>
            <Button variant="secondary" size="xl" className="w-full sm:w-auto">
              <Heart className="w-5 h-5 mr-2" />
              Wishlist
            </Button>
          </div>

          {/* Delivery Info */}
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
            <div className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <Truck className="w-6 h-6 text-[var(--brand)] flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-[var(--text)]">Free Delivery</p>
                <p className="text-xs text-[var(--text-subtle)]">On orders over 2000 BDT</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <RotateCcw className="w-6 h-6 text-[var(--brand)] flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-[var(--text)]">Easy Returns</p>
                <p className="text-xs text-[var(--text-subtle)]">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <Shield className="w-6 h-6 text-[var(--brand)] flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-[var(--text)]">Secure Payment</p>
                <p className="text-xs text-[var(--text-subtle)]">COD & Bank Transfer</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="description">
        <TabsList className="bg-[var(--paper-deep)] rounded-pill p-1 w-fit mx-auto mb-8">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="text-[var(--text)]">
          {product.description || <p className="text-[var(--text-subtle)]">No description available.</p>}
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          <dl className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <dt className="text-sm text-[var(--text-subtle)]">Base Price</dt>
              <dd className="font-display text-xl text-[var(--brand)]">{basePrice.toLocaleString()} BDT</dd>
            </div>
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <dt className="text-sm text-[var(--text-subtle)]">Tax</dt>
              <dd className="font-display text-xl text-[var(--brand)]">{product.taxPercent}%</dd>
            </div>
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <dt className="text-sm text-[var(--text-subtle)]">Dimensions Available</dt>
              <dd className="font-display text-xl text-[var(--brand)]">{product.allowedDimensions.length}</dd>
            </div>
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <dt className="text-sm text-[var(--text-subtle)]">Quantity Tiers</dt>
              <dd className="font-display text-xl text-[var(--brand)]">{product.allowedQuantities.length}</dd>
            </div>
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <dt className="text-sm text-[var(--text-subtle)]">Inventory</dt>
              <dd className="font-display text-xl text-[var(--brand)]">
                {product.trackInventory ? product.stock : 'Not tracked'}
              </dd>
            </div>
            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-4 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
              <dt className="text-sm text-[var(--text-subtle)]">Status</dt>
              <dd className="font-display text-xl text-[var(--brand)]">{product.isActive ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="text-center py-12">
            <p className="text-[var(--text-subtle)]">Reviews coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lightbox Modal */}
      <Modal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        size="full"
        closeOnOverlayClick
        closeOnEscape
        showCloseButton
      >
        <div
          className="relative h-[80vh] max-h-[80vh] flex items-center justify-center"
          onKeyDown={handleLightboxKeyDown}
        >
          {product.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[var(--surface-raised)] text-[var(--text)] z-10"
                onClick={() => handleLightboxNav('prev')}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--surface-raised)] text-[var(--text)] z-10"
                onClick={() => handleLightboxNav('next')}
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
          <div className="relative w-full h-full max-w-4xl">
            <Image
              src={currentImage}
              alt={`${product.name} - Full size view ${selectedImage + 1}`}
              fill
              className="object-contain"
              sizes="80vw"
              priority
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE
              }}
            />
          </div>
          {/* Thumbnail strip in lightbox */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4 justify-center overflow-x-auto scrollbar-hide snap-x" role="list">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'relative w-16 h-16 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden border-[3px] transition-all snap-center',
                    FOCUS_VISIBLE_INK,
                    selectedImage === index
                      ? 'border-[var(--brand)] scale-105'
                      : 'border-transparent hover:border-[color-mix(in_srgb,var(--ink)_30%,transparent)]'
                  )}
                  aria-label={`View image ${index + 1}`}
                  aria-current={selectedImage === index ? 'true' : 'false'}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
