'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { HoverCard } from '@/components/animations/HoverLift'
import type { Product } from '@/types'
import { ShoppingCart, Tag, Heart } from 'lucide-react'
import { useCartStore, useIsInCart, useGetItemQuantity } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion } from 'framer-motion'
import { motionVariants } from '@/lib/motion'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'featured'
  showActions?: boolean
  className?: string
}

export function ProductCard({ product, variant = 'default', showActions = true, className }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const defaultDimension = product.allowedDimensions.find((d) => d.isDefault) || product.allowedDimensions[0]
  const inCart = useIsInCart(product.id, defaultDimension?.width, defaultDimension?.height)
  const quantity = useGetItemQuantity(product.id, defaultDimension?.width, defaultDimension?.height)

  const basePrice = defaultDimension
    ? product.basePrice * defaultDimension.priceMultiplier
    : product.basePrice

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0

  const imageContainerClass = cn(
    'relative overflow-hidden bg-[var(--light)]',
    'rounded-card', // Card radius = 20px
    variant === 'compact' ? 'w-16 h-16 flex-shrink-0' : 'aspect-square mb-4',
    variant === 'featured' ? 'aspect-[4/5] mb-4' : ''
  )

  const imageClass = cn(
    'object-cover transition-transform duration-500 group-hover:scale-105',
    variant === 'compact' ? '' : 'w-full h-full'
  )

  if (variant === 'compact') {
    return (
      <Link
        href={`/shop/${product.slug}`}
        className={cn(
          'flex items-center gap-4 p-3 bg-white rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-primary/50 transition-colors',
          className
        )}
      >
        <div className={imageContainerClass}>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={imageClass}
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
              <Tag className="w-12 h-12" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-body text-[var(--ink)] truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-display text-primary">{basePrice.toLocaleString()} BDT</span>
            {hasDiscount && (
              <span className="text-sm text-[var(--text-subtle)] line-through">{product.compareAtPrice!.toLocaleString()} BDT</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <motion.div
      variants={motionVariants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <HoverCard className={cn('flex flex-col h-full', className)}>
        {/* Image */}
        <div className={imageContainerClass} role="group" aria-label={product.name}>
          {product.images[0] ? (
            <Link href={`/shop/${product.slug}`} className="block aspect-square overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className={imageClass}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
              <Tag className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="error" size="sm">
                -{discountPercent}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="accent" size="sm">
                Featured
              </Badge>
            )}
            {product.trackInventory && product.stock < product.lowStockThreshold && product.stock > 0 && (
              <Badge variant="warning" size="sm">
                Low Stock
              </Badge>
            )}
          </div>

          {/* Wishlist */}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <Link href={`/shop/${product.slug}`}>
            <h3 className="font-display text-xl text-primary mb-1 line-clamp-1">{product.name}</h3>
          </Link>

          {product.description && (
            <p className="text-body text-[var(--text-muted)] mb-3 line-clamp-2 flex-1 min-h-0">{product.description}</p>
          )}

          {/* Dimensions */}
          {product.allowedDimensions.length > 1 && (
            <div className="mb-3">
              <p className="text-xs text-[var(--text-subtle)] mb-1">Available sizes:</p>
              <div className="flex flex-wrap gap-1">
                {product.allowedDimensions.slice(0, 4).map((dim) => (
                  <span
                    key={`${dim.width}x${dim.height}`}
                    className="px-2 py-0.5 text-xs bg-[var(--light)] text-[color-mix(in_srgb,var(--ink)_70%,transparent)] rounded-full"
                  >
                    {dim.label}
                  </span>
                ))}
                {product.allowedDimensions.length > 4 && (
                  <span className="px-2 py-0.5 text-xs bg-[var(--light)] text-[var(--text-subtle)] rounded-full">
                    +{product.allowedDimensions.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--light)]">
            <div>
              <span className="text-2xl font-display text-primary">{basePrice.toLocaleString()} BDT</span>
              {hasDiscount && (
                <span className="ml-2 text-sm text-[var(--text-subtle)] line-through">{product.compareAtPrice!.toLocaleString()} BDT</span>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-2">
                {inCart ? (
                  <div className="flex items-center gap-2 bg-primary text-white rounded-pill px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (quantity > 1 && defaultDimension) {
                          // Would need updateQuantity action
                        }
                      }}
                      className="p-1"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="font-medium px-2">{quantity}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (defaultDimension) {
                          // Would need updateQuantity action
                        }
                      }}
                      className="p-1"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (defaultDimension && isAuthenticated) {
                        addItem({
                          productId: product.id,
                          product,
                          width: defaultDimension.width,
                          height: defaultDimension.height,
                          quantity: 1,
                          customization: null,
                        })
                      } else if (!isAuthenticated) {
                        // Redirect to login
                        window.location.href = `/login?redirect=/shop/${product.slug}`
                      }
                    }}
                    disabled={!isAuthenticated}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </HoverCard>
    </motion.div>
  )
}

// Product grid component
interface ProductGridProps {
  products: Product[]
  variant?: 'default' | 'compact' | 'featured'
  className?: string
  emptyMessage?: string
}

export function ProductGrid({ products, variant = 'default', className, emptyMessage = 'No products found' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Tag className="w-16 h-16 text-[var(--text-subtle)] mx-auto mb-4" />
        <p className="text-body text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    )
  }

  const gridColumns = variant === 'compact' ? 1 : '1 sm:2 lg:3 xl:4'

  return (
    <motion.div
      className={cn('grid gap-6', `grid-cols-${gridColumns}`, className)}
      variants={motionVariants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={motionVariants.staggerItem}>
          <ProductCard product={product} variant={variant} />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Featured product showcase
export function FeaturedProduct({ product }: { product: Product }) {
  return (
    <HoverCard className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="md:w-1/2 relative aspect-square md:aspect-auto md:min-h-[500px]">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover rounded-card"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>

      <div className="md:w-1/2 flex flex-col justify-center p-4 md:p-8">
        <span className="text-sm font-medium text-secondary uppercase tracking-wider mb-2">
          {product.category?.name || 'Featured'}
        </span>
        <h1 className="font-display text-4xl md:text-5xl text-[var(--ink)] mb-4">{product.name}</h1>
        <p className="text-lg text-[color-mix(in_srgb,var(--ink)_70%,transparent)] mb-6 leading-relaxed">{product.description}</p>

        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-display text-primary">{product.basePrice.toLocaleString()} BDT</span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="text-xl text-[var(--text-subtle)] line-through">{product.compareAtPrice.toLocaleString()} BDT</span>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="lg" className="flex-1 min-w-[200px]">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
          <Button variant="secondary" size="lg">
            <Heart className="w-5 h-5 mr-2" />
            Wishlist
          </Button>
        </div>
      </div>
    </HoverCard>
  )
}