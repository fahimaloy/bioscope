'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Slider } from '@/components/ui/Slider'
import { Dropdown } from '@/components/ui/Dropdown'
import { HoverLift, ScaleOnHover } from '@/components/animations/HoverLift'
import { useCartStore, useIsInCart, useGetItemQuantity } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Product, DimensionConfig, QuantityConfig } from '@/types'
import { ShoppingCart, Heart, Share2, Truck, RotateCcw, Shield, Tag, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedDimension, setSelectedDimension] = useState<DimensionConfig | null>(
    product.allowedDimensions.find((d) => d.isDefault) || product.allowedDimensions[0] || null
  )
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedQtyConfig, setSelectedQtyConfig] = useState<QuantityConfig | null>(null)

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

  const handleAddToCart = () => {
    if (!selectedDimension) return
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/shop/${product.slug}`
      return
    }
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
    }
  }

  return (
    <div className="space-y-8">
      {/* Product Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="text-sm font-medium text-secondary uppercase tracking-wider">
            {product.category?.name || 'Product'}
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--ink)] mt-1">{product.name}</h1>
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
          <div className="relative aspect-square rounded-card overflow-hidden bg-[var(--light)]">
            <ScaleOnHover scale={1.02}>
              <Image
                src={product.images[selectedImage] || product.images[0]}
                alt={`${product.name} - View ${selectedImage + 1}`}
                fill
                className="object-cover transition-transform duration-500"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </ScaleOnHover>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'relative w-20 h-20 flex-shrink-0 rounded-input overflow-hidden border-3 transition-all',
                    selectedImage === index
                      ? 'border-primary scale-105'
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
            <span className="text-3xl font-display text-primary">{finalPrice.toLocaleString()} BDT</span>
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
              <p className="text-body text-[var(--ink)]/70 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Configuration */}
          <div className="space-y-6 border-t border-[var(--light)] pt-6">
            {/* Dimensions */}
            {product.allowedDimensions.length > 0 && (
              <fieldset>
                <legend className="font-medium text-body text-[var(--ink)] mb-3">Select Size</legend>
                <div className="flex flex-wrap gap-3">
                  {product.allowedDimensions.map((dim) => (
                    <button
                      key={`${dim.width}x${dim.height}`}
                      onClick={() => setSelectedDimension(dim)}
                      className={cn(
                        'px-4 py-3 rounded-input border-3 font-medium transition-all',
                        'min-w-[100px] text-center',
                        selectedDimension?.id === dim.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                      )}
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
              <div className="flex items-center gap-4">
                <div className="flex items-center border-3 border-[var(--ink)]/30 rounded-input overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={selectedQuantity <= 1}
                    className="w-12 h-12 flex items-center justify-center text-2xl text-[var(--ink)] hover:bg-[var(--light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      handleQuantityChange(val - selectedQuantity)
                    }}
                    className="w-20 h-12 text-center text-xl font-display text-[var(--ink)] border-none focus:outline-none"
                    min="1"
                    aria-label="Quantity"
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-12 h-12 flex items-center justify-center text-2xl text-[var(--ink)] hover:bg-[var(--light)] transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
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
                      <Dropdown
                        trigger={<Button variant="outline">Select cut type</Button>}
                        items={product.customizationOptions.cutTypes.map((cut) => ({
                          value: cut,
                          label: cut.replace('_', ' '),
                        }))}
                        placeholder="Select cut type"
                      />
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
          <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--light)]">
            <Button
              variant={inCart ? 'primary' : 'primary'}
              size="lg"
              className="flex-1 min-w-[200px]"
              onClick={handleAddToCart}
              disabled={!isAuthenticated || !selectedDimension}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {inCart ? 'Update Cart' : 'Add to Cart'}
            </Button>
            <Button variant="secondary" size="lg">
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
  </div>
)
}