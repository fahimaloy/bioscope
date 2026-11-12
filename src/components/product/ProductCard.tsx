'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Tag } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motionVariants } from '@/lib/motion'
import { useCartStore, useGetItemQuantity, useIsInCart } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Product } from '@/types'

/**
 * The one default product image (spec §13: "one default image per product").
 * Rendered whenever `product.images` is empty, so a card is never imageless.
 */
const DEFAULT_PRODUCT_IMAGE = '/images/stickers/skull_sticker.png'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'featured'
  showActions?: boolean
  className?: string
}

/**
 * ProductCard — the **Clean sheet** treatment (spec §13, contract §5).
 *
 * Flat 2px ink border, a colored offset shadow (`--shadow-color`), a uniform
 * 1:1 image area, and a spring hover that lifts 4px and grows the shadow one
 * step. No rotation, no die-cut outline: the card is the restrained surface
 * that repeats at scale, so the loud brand surfaces around it stay loud.
 *
 * `variant="featured"` is the same Clean sheet — the pre-rebuild 4:5 image
 * area is gone. `variant="compact"` is the dense list row (cart, order).
 */
export function ProductCard({
  product,
  variant = 'default',
  showActions = true,
  className,
}: ProductCardProps) {
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const defaultDimension =
    product.allowedDimensions.find((d) => d.isDefault) || product.allowedDimensions[0]
  const inCart = useIsInCart(product.id, defaultDimension?.width, defaultDimension?.height)
  const quantity = useGetItemQuantity(product.id, defaultDimension?.width, defaultDimension?.height)

  const basePrice = defaultDimension
    ? product.basePrice * defaultDimension.priceMultiplier
    : product.basePrice

  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.basePrice
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0

  const addToCart = () => {
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
      window.location.href = `/login?redirect=/shop/${product.slug}`
    }
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/shop/${product.slug}`}
        className={cn(
          'flex items-center gap-4 rounded-[var(--radius-lg)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]',
          'bg-[var(--surface-raised)] p-3 transition-colors hover:border-[var(--brand)]',
          className,
        )}
      >
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--paper-deep)]">
          <Image
            src={product.images[0] || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base text-[var(--text)]">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-lg text-[var(--brand)]">
              {formatCurrency(basePrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[var(--text-subtle)] line-through">
                {formatCurrency(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <motion.div
      whileHover={{
        // `hoverLift` carries the system spring (stiffness 500, damping 30);
        // the shadow steps one notch instantly while the lift rides the spring.
        ...motionVariants.hoverLift,
        scale: 1,
        boxShadow: '12px 12px 0 var(--accent)',
      }}
      className={cn(
        'group flex h-full flex-col rounded-[var(--radius-lg)] border-2 border-[var(--ink)]',
        'bg-[var(--surface-raised)] shadow-color',
        className,
      )}
    >
      {/* Image — uniform 1:1 (spec §13 "uniform 1:1 grid") */}
      <div className="relative aspect-square overflow-hidden rounded-t-[calc(var(--radius-lg)-2px)] bg-[var(--paper-deep)]">
        <Link
          href={`/shop/${product.slug}`}
          className="block h-full w-full"
          aria-label={product.name}
        >
          <Image
            src={product.images[0] || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-slow ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
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
          {product.trackInventory &&
            product.stock < product.lowStockThreshold &&
            product.stock > 0 && (
              <Badge variant="warning" size="sm">
                Low Stock
              </Badge>
            )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--surface-raised)] text-[var(--text-muted)] transition-colors hover:text-[var(--error)]"
          aria-label={`Add ${product.name} to wishlist`}
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col min-h-0 p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-display text-xl text-[var(--text)] line-clamp-1">{product.name}</h3>
        </Link>

        {product.description && (
          <p className="mb-3 text-base text-[var(--text-muted)] line-clamp-2 flex-1 min-h-0">
            {product.description}
          </p>
        )}

        {/* Dimensions */}
        {product.allowedDimensions.length > 1 && (
          <div className="mb-3">
            <p className="mb-1 text-xs text-[var(--text-subtle)]">Available sizes:</p>
            <div className="flex flex-wrap gap-1">
              {product.allowedDimensions.slice(0, 4).map((dim) => (
                <span
                  key={`${dim.width}x${dim.height}`}
                  className="rounded-full bg-[var(--paper-deep)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
                >
                  {dim.label}
                </span>
              ))}
              {product.allowedDimensions.length > 4 && (
                <span className="rounded-full bg-[var(--paper-deep)] px-2 py-0.5 text-xs text-[var(--text-subtle)]">
                  +{product.allowedDimensions.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price & Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)] pt-3">
          <div>
            <span className="font-display text-2xl text-[var(--brand)]">
              {formatCurrency(basePrice)}
            </span>
            {hasDiscount && (
              <span className="ml-2 text-sm text-[var(--text-subtle)] line-through">
                {formatCurrency(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {showActions &&
            (inCart ? (
              <div className="flex items-center gap-2 rounded-pill border-2 border-[var(--ink)] bg-[var(--pink-strong)] px-3 py-1 text-[var(--on-pink-strong)]">
                <button
                  type="button"
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
                <span className="px-2 font-medium">{quantity}</span>
                <button
                  type="button"
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
                aria-label={`Add ${product.name} to cart`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addToCart()
                }}
                disabled={!isAuthenticated}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            ))}
        </div>
      </div>
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

export function ProductGrid({
  products,
  variant = 'default',
  className,
  emptyMessage = 'No products found',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <Tag className="mx-auto mb-4 h-16 w-16 text-[var(--text-subtle)]" />
        <p className="text-base text-[var(--text-muted)]">{emptyMessage}</p>
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
    <div className="mx-auto flex max-w-4xl flex-col gap-8 md:flex-row">
      <div className="relative aspect-square md:min-h-[500px] md:w-1/2">
        <Image
          src={product.images[0] || DEFAULT_PRODUCT_IMAGE}
          alt={product.name}
          fill
          priority
          className="rounded-[var(--radius-lg)] border-2 border-[var(--ink)] object-cover shadow-color"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className="flex flex-col justify-center p-4 md:w-1/2 md:p-8">
        <span className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--teal)]">
          {product.category?.name || 'Featured'}
        </span>
        <h1 className="mb-4 font-display text-4xl text-[var(--text)] md:text-5xl">
          {product.name}
        </h1>
        <p className="mb-6 text-lg text-[var(--text-muted)] leading-relaxed">
          {product.description}
        </p>

        <div className="mb-6 flex items-center gap-4">
          <span className="font-display text-3xl text-[var(--brand)]">
            {formatCurrency(product.basePrice)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="text-xl text-[var(--text-subtle)] line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="lg" className="min-w-[200px] flex-1">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
          <Button variant="secondary" size="lg">
            <Heart className="mr-2 h-5 w-5" />
            Wishlist
          </Button>
        </div>
      </div>
    </div>
  )
}
