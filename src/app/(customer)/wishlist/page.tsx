'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { X, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { DoodleHeart, WashiTape, SketchUnderline } from '@/components/decorative'
import { useMotionVariants } from '@/lib/motion'
import { useWishlistItems, useWishlistActions } from '@/lib/stores/wishlistStore'

export default function WishlistPage() {
  const variants = useMotionVariants()
  const items = useWishlistItems()
  const { remove, clear } = useWishlistActions()

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="relative mb-12 text-center">
          <WashiTape rotation={-2} width={180} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <h1 className="font-display text-4xl text-[var(--text)] md:text-5xl">
            <SketchUnderline>Your Wishlist</SketchUnderline>
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            {items.length > 0 ? `${items.length} saved ${items.length === 1 ? 'item' : 'items'}` : 'Save the stickers you love'}
          </p>
        </header>

        {items.length === 0 ? (
          <motion.div variants={variants.fadeInUp} initial="initial" animate="animate" className="mx-auto max-w-md text-center">
            <DoodleHeart size={96} color="pink" animation="float" className="mx-auto mb-6 opacity-80" />
            <p className="mb-2 font-display text-2xl text-[var(--text)]">Nothing here yet</p>
            <p className="mb-8 text-[var(--text-muted)]">
              Tap the heart on any sticker to save it. Your wishlist stays on this device, even after you sign in.
            </p>
            <Link href="/shop">
              <Button variant="primary" size="lg">
                Browse stickers
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clear}>
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Clear wishlist
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => (
                <motion.div key={product.id} variants={variants.staggerItem} initial="initial" animate="animate" className="relative">
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--surface-raised)] text-[var(--text-muted)] transition-colors hover:text-[var(--error)]"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--text-subtle)]">
              <Heart className="h-4 w-4" aria-hidden="true" />
              Saved on this device. Prices and stock are confirmed on the product page.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
