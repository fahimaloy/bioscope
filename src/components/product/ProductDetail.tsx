'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { HoverLift } from '@/components/animations/HoverLift'
import { useCartStore, useIsInCart, useGetItemQuantity } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Product, DimensionConfig, QuantityConfig } from '@/types'
import { ShoppingCart, Heart, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, Minus, Plus, Check, X, Expand } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionVariants } from '@/lib/motion'
import { StickerPeel, DoodleStar, WashiTape, SketchUnderline } from '@/components/decorative/DoodleElements'

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
  const [selectedQtyConfig, setSelectedQtyConfig] = useState<QuantityConfig | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [addToCartState, setAddToCartState] = useState<'idle' | 'loading' | 'success'>('idle')

  const { addItem, updateQuantity } = useCartStore()
  const { isAuthenticated } = useAuth()

  // Find matching quantity config
  const quantityConfigs = product.allowedQuantities.sort((a, b) => a.minQty - b.minQty)
  const matchingQtyConfig = quantityConfigs.find(
    (q) => selectedQuantity >= q.minQty && (q.maxQty === null || selectedQuantity <= q.maxQty)
  )

  // Calculate price
  const dimensionMultiplier = selectedDimension?.priceMultiplier || 1
  const unitPrice = matchingQtyConfig?.pricePerUnit || product.basePrice
  const finalPrice = unitPrice * dimensionMultiplier
  const totalPrice = finalPrice * selectedQuantity

  const inCart = useIsInCart(product.id, selectedDimension?.width ?? 0, selectedDimension?.height ?? 0)
  const cartQuantity = useGetItemQuantity(product.id, selectedDimension?.width ?? 0, selectedDimension?.height ?? 0)

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0

  // Set default dimension with pulse animation on mount
  useEffect(() => {
    if (selectedDimension && selectedDimension.isDefault) {
      // pulse-soft will be applied via className
    }
  }, [selectedDimension])

  // Sync quantity config when quantity changes
  useEffect(() => {
    if (matchingQtyConfig) {
      setSelectedQtyConfig(matchingQtyConfig)
    }
  }, [matchingQtyConfig])

  const handleAddToCart = async () => {
    if (!selectedDimension) return
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/shop/${product.slug}`
      return
    }

    setAddToCartState('loading')
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500))
    
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
      setSelectedQtyConfig(validConfig)
    } else {
      // Shake animation on invalid quantity - trigger via state
      // The shake will be handled by the QuantitySelector component
    }
  }

  const handleImageSelect = (index: number) => {
    setSelectedImage(index)
    if (isLightboxOpen) {
      setSelectedImage(index)
    }
  }

  const handleLightboxNav = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)
    } else {
      setSelectedImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)
    }
  }

  const handleLightboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handleLightboxNav('prev')
    else if (e.key === 'ArrowRight') handleLightboxNav('next')
    else if (e.key === 'Escape') setIsLightboxOpen(false)
  }

  const currentImage = product.images[selectedImage] || FALLBACK_IMAGE

  return (
    <div className="space-y-8">
      {/* Product Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Badge variant="doodle" size="sm" className="mb-2">
            {product.category?.name || 'Product'}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl text-primary">
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
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div 
            className="relative aspect-square rounded-card overflow-hidden bg-[var(--light)] cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsLightboxOpen(true); }} }
            aria-label="Open image lightbox"
          >
            <HoverLift scale={1.02}>
              <Image
                src={currentImage}
                alt={`${product.name} - Main view`}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
            </HoverLift>
            {/* Expand hint */}
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-pill text-sm flex items-center gap-1">
              <Expand className="w-4 h-4" />
              <span>Zoom</span>
            </div>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x" role="list" aria-label="Product thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(index)}
                  className={cn(
                    'relative w-20 h-20 flex-shrink-0 rounded-input overflow-hidden border-3 transition-all snap-center',
                    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                    selectedImage === index
                      ? 'border-primary scale-105 shadow-[0_0_0_3px_rgba(255,107,107,0.3)]'
                      : 'border-transparent hover:border-[var(--ink)]/30'
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
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Price */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="font-display text-4xl text-primary">{finalPrice.toLocaleString()} BDT</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-[var(--ink)]/40 line-through">{product.compareAtPrice!.toLocaleString()} BDT</span>
                <Badge variant="error" size="md">-{discountPercent}%</Badge>
              </>
            )}
            {matchingQtyConfig && quantityConfigs.length > 1 && (
              <Badge variant="secondary" size="sm">{matchingQtyConfig.label}</Badge>
            )}
          </div>

          {/* Tax Info */}
          {product.taxPercent > 0 && (
            <p className="text-sm text-[var(--ink)]/60">
              Price includes {product.isTaxInclusive ? '' : 'excludes '}tax ({product.taxPercent}%)
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div className="prose prose-dark max-w-none">
              <p className="text-lg text-secondary leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Configuration */}
          <div className="space-y-6 border-t border-[var(--light)] pt-6">
            {/* Dimensions */}
            {product.allowedDimensions.length > 0 && (
              <fieldset>
                <legend className="font-medium text-body text-[var(--ink)] mb-3">Select Size</legend>
                <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Size options">
                  {product.allowedDimensions.map((dim) => (
                    <button
                      key={`${dim.width}x${dim.height}`}
                      onClick={() => setSelectedDimension(dim)}
                      className={cn(
                        'px-4 py-3 rounded-input border-3 font-medium transition-all min-w-[100px] text-center',
                        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
                        selectedDimension?.id === dim.id
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_rgba(255,107,107,0.2)] animate-pulse-soft'
                          : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary hover:bg-[var(--light)]'
                      )}
                      aria-pressed={selectedDimension?.id === dim.id}
                      role="radio"
                    >
                      <span className="block font-display">{dim.label}</span>
                      {dim.priceMultiplier !== 1 && (
                        <span className="text-xs text-primary/80">
                          {dim.priceMultiplier > 1 ? '+' : ''}{(dim.priceMultiplier - 1) * 100}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Quantity */}
            <fieldset>
              <legend className="font-medium text-body text-[var(--ink)] mb-3">Quantity</legend>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center border-3 border-[var(--ink)]/30 rounded-input overflow-hidden">
                  <Button
                    variant="doodle-outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={selectedQuantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-12 h-12 p-0 hover:shadow-btn-hover active:shadow-btn-active"
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
                    className="w-auto min-w-[3rem] h-12 text-center text-xl font-display text-[var(--ink)] border-none focus:outline-none"
                    min="1"
                    max={matchingQtyConfig?.maxQty || 999}
                    aria-label="Quantity"
                  />
                  <Button
                    variant="doodle-outline"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    aria-label="Increase quantity"
                    className="w-12 h-12 p-0 hover:shadow-btn-hover active:shadow-btn-active"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {matchingQtyConfig && (
                  <span className="text-sm text-[var(--ink)]/60">{matchingQtyConfig.label}</span>
                )}
              </div>
            </fieldset>

            {/* Customization Options */}
            {product.customizationOptions && (
              <fieldset>
                <legend className="font-medium text-body text-[var(--ink)] mb-3">Customize</legend>
                <div className="space-y-4">
                  {product.customizationOptions.materials?.length && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--ink)] mb-2">Material</label>
                      <div className="flex flex-wrap gap-2">
                        {product.customizationOptions.materials.map((material) => (
                          <button
                            key={material}
                            className={cn(
                              'px-4 py-2 rounded-input border-2 text-sm transition-all',
                              'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
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
                      <label className="block text-sm font-medium text-[var(--ink)] mb-2">Finish</label>
                      <div className="flex flex-wrap gap-2">
                        {product.customizationOptions.finishes.map((finish) => (
                          <button
                            key={finish}
                            className={cn(
                              'px-4 py-2 rounded-input border-2 text-sm transition-all',
                              'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
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
                      <label className="block text-sm font-medium text-[var(--ink)] mb-2">Cut Type</label>
                      <div className="flex flex-wrap gap-2">
                        {product.customizationOptions.cutTypes.map((cut) => (
                          <button
                            key={cut}
                            className={cn(
                              'px-4 py-2 rounded-input border-2 text-sm transition-all',
                              'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
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
          <div className="bg-[var(--light)] rounded-card p-4 border-2 border-[var(--ink)]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-body text-[var(--ink)]">Total ({selectedQuantity} × {finalPrice.toLocaleString()} BDT)</span>
              <span className="text-2xl font-display text-primary">{totalPrice.toLocaleString()} BDT</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[var(--light)]">
            <Button
              variant="doodle"
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
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--light)]">
            <div className="flex items-center gap-3 p-3 bg-white rounded-input border border-[var(--ink)]/20">
              <Truck className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-[var(--ink)]">Free Delivery</p>
                <p className="text-xs text-[var(--ink)]/50">On orders over 2000 BDT</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-input border border-[var(--ink)]/20">
              <RotateCcw className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-[var(--ink)]">Easy Returns</p>
                <p className="text-xs text-[var(--ink)]/50">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-input border border-[var(--ink)]/20">
              <Shield className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-[var(--ink)]">Secure Payment</p>
                <p className="text-xs text-[var(--ink)]/50">COD & Bank Transfer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="description">
        <TabsList className="bg-[var(--light)] rounded-card p-1 w-fit mx-auto mb-8">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="prose prose-dark max-w-none">
          {product.description || <p className="text-[var(--ink)]/60">No description available.</p>}
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          <dl className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-input p-4 border border-[var(--ink)]/20">
              <dt className="text-sm text-[var(--ink)]/50">Base Price</dt>
              <dd className="font-display text-xl text-primary">{product.basePrice.toLocaleString()} BDT</dd>
            </div>
            <div className="bg-white rounded-input p-4 border border-[var(--ink)]/20">
              <dt className="text-sm text-[var(--ink)]/50">Tax</dt>
              <dd className="font-display text-xl text-primary">{product.taxPercent}%</dd>
            </div>
            <div className="bg-white rounded-input p-4 border border-[var(--ink)]/20">
              <dt className="text-sm text-[var(--ink)]/50">Dimensions Available</dt>
              <dd className="font-display text-xl text-primary">{product.allowedDimensions.length}</dd>
            </div>
            <div className="bg-white rounded-input p-4 border border-[var(--ink)]/20">
              <dt className="text-sm text-[var(--ink)]/50">Quantity Tiers</dt>
              <dd className="font-display text-xl text-primary">{product.allowedQuantities.length}</dd>
            </div>
            <div className="bg-white rounded-input p-4 border border-[var(--ink)]/20">
              <dt className="text-sm text-[var(--ink)]/50">Inventory</dt>
              <dd className="font-display text-xl text-primary">
                {product.trackInventory ? product.stock : 'Not tracked'}
              </dd>
            </div>
            <div className="bg-white rounded-input p-4 border border-[var(--ink)]/20">
              <dt className="text-sm text-[var(--ink)]/50">Status</dt>
              <dd className="font-display text-xl text-primary">{product.isActive ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="text-center py-12">
            <p className="text-[var(--ink)]/60">Reviews coming soon...</p>
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
        <div className="relative h-[80vh] max-h-[80vh] flex items-center justify-center" onKeyDown={handleLightboxKeyDown}>
          {product.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur text-[var(--ink)] hover:bg-primary hover:text-white z-10"
                onClick={() => handleLightboxNav('prev')}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur text-[var(--ink)] hover:bg-primary hover:text-white z-10"
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
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
            />
          </div>
          {/* Thumbnail strip in lightbox */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4 justify-center overflow-x-auto scrollbar-hide snap-x" role="list">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'relative w-16 h-16 flex-shrink-0 rounded-input overflow-hidden border-3 transition-all snap-center',
                    selectedImage === index
                      ? 'border-primary scale-105'
                      : 'border-transparent hover:border-white/50'
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
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
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