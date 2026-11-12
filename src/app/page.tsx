'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { DoodleScatter, MarqueeRibbon, SketchUnderline } from '@/components/decorative'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProductCard } from '@/components/product/ProductCard'
import { SkeletonProductCard } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useMotionVariants } from '@/lib/motion'
import { featuredProductsOptions } from '@/lib/queries/products'
import type { Product } from '@/types'

/**
 * Landing — spec §13 (visual board: hero = **Editorial**, card = **Clean
 * sheet**, landing leads with **featured products + custom sticker CTA**).
 *
 * Order: Editorial hero → `MarqueeRibbon` → featured products → custom-sticker
 * CTA band. One decor accent per section maximum (contract §3): the hero
 * carries a single `DoodleScatter`, the marquee band *is* the accent, the
 * featured grid is deliberately bare (the cards repeat at scale, so restraint
 * is the treatment), and the CTA band carries one `DoodleScatter`.
 *
 * The deprecated full-bleed doodle background is not in the spec §5.7 decor
 * set and is gone; the hero uses `DoodleScatter` (capped at 6, contract §3)
 * because the Editorial hero needs a scattered paper-craft field around the
 * headline, not a shape wash.
 *
 * Icons are Lucide, never emoji (spec §5.6): the pre-rebuild floating emoji
 * decoration and the emoji step icons are removed, and there is no
 * "How it works" section — the brief's landing is hero, marquee, featured
 * products, CTA band.
 */

const MARQUEE_ITEMS = ['VINYL', 'PAPER', 'HOLOGRAPHIC', 'KRAFT', 'CUSTOM', 'BIODIVERSITY']

const HERO_IMAGE = '/images/stickers/skull_sticker.png'

/** The shape of `GET /api/products?featured=true` (`ok()` envelope). */
interface FeaturedResponse {
  success: boolean
  data: { data: Product[]; pagination: unknown }
}

/**
 * The CTA link treatment. `Button` has no `href`/`asChild`, and an anchor
 * wrapping a `<button>` nests two interactives — so the CTAs are real anchors
 * carrying the Paper + Pop treatment (contract §6). Kept in sync with
 * `@/components/ui/Button`.
 */
const CTA_LINK_CLASSES = [
  'inline-flex min-h-[56px] items-center justify-center gap-2 rounded-pill border-[3px] border-[var(--ink)]',
  'px-8 py-4 font-display text-xl tracking-wide',
  'shadow-ink-2 transition-[transform,box-shadow] duration-fast ease-spring',
  'hover:-translate-y-1 hover:shadow-ink-3',
  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
].join(' ')

const CTA_LINK_FILLS = {
  primary: 'bg-[var(--gold)] text-[var(--ink)]',
  secondary: 'bg-[var(--pink-strong)] text-[var(--on-pink-strong)]',
} as const

/** Static fallback, rendered only when the featured query returns an empty list. */
function fallbackProduct(id: string, name: string, slug: string, basePrice: number): Product {
  return {
    id,
    name,
    slug,
    description: null,
    basePrice,
    compareAtPrice: null,
    images: [],
    categoryId: 'fallback',
    allowedDimensions: [
      {
        id: `${id}-d`,
        width: 5,
        height: 5,
        label: '5×5cm',
        priceMultiplier: 1,
        isDefault: true,
        sortOrder: 0,
      },
    ],
    allowedQuantities: [],
    customizationOptions: null,
    taxPercent: 0,
    additionalCharge: 0,
    isTaxInclusive: false,
    trackInventory: false,
    stock: 0,
    lowStockThreshold: 0,
    isActive: true,
    isFeatured: true,
    sortOrder: 0,
    metaTitle: null,
    metaDescription: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  }
}

const FALLBACK_FEATURED: Product[] = [
  fallbackProduct('fallback-1', 'Vintage Doodle Pack', 'vintage-doodle-pack', 350),
  fallbackProduct('fallback-2', 'Retro Space Cat', 'retro-space-cat', 420),
  fallbackProduct('fallback-3', 'Kraft Flower Kit', 'kraft-flower-kit', 280),
]

export default function HomePage() {
  const variants = useMotionVariants()
  const query = useQuery(featuredProductsOptions())

  const featured = (query.data as FeaturedResponse | undefined)?.data?.data ?? []
  // The static list is a fallback for an empty result, not a placeholder while
  // the query is in flight (that is what the skeletons are for).
  const products = featured.length > 0 ? featured : FALLBACK_FEATURED

  return (
    <PageWrapper>
      {/* ── Editorial hero ───────────────────────────────────────────────
          Oversized Shrikhand headline, the word "Fun" in `--pink` (display
          type on the vivid accent, contract §2), a hand-written line, two real
          CTAs, and the sticker in an organic blob frame (`--radius-wobble-lg`).
          Single decor accent: one DoodleScatter. */}
      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:pt-16">
        <DoodleScatter count={6} seed="landing-hero" />

        <motion.div
          initial="initial"
          animate="animate"
          variants={variants.staggerContainer}
          className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2"
        >
          <div>
            <motion.h1
              variants={variants.staggerItem}
              className="font-display text-5xl leading-[1.05] text-[var(--text)] md:text-6xl lg:text-7xl"
            >
              Make Awesome <span className="text-[var(--pink)]">Fun</span> Things Stick
            </motion.h1>

            {/* TODO: owner copy */}
            <motion.p
              variants={variants.staggerItem}
              className="mt-6 max-w-xl font-hand text-xl text-[var(--text-muted)] md:text-2xl"
            >
              <SketchUnderline color="pink">
                Design doodles. Print stickers. Spread nostalgia.
              </SketchUnderline>
            </motion.p>

            <motion.div
              variants={variants.staggerItem}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                href="/shop"
                className={cn(CTA_LINK_CLASSES, CTA_LINK_FILLS.primary)}
              >
                Browse Stickers
              </Link>
              <Link
                href="/custom-sticker"
                className={cn(CTA_LINK_CLASSES, CTA_LINK_FILLS.secondary)}
              >
                Design Custom
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>

          {/* Sticker in an organic blob frame — the Editorial hero image. */}
          <motion.div
            variants={variants.staggerItem}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="overflow-hidden rounded-[var(--radius-wobble-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] shadow-ink-4">
              <Image
                src={HERO_IMAGE}
                alt="bioscope sticker"
                width={640}
                height={640}
                priority
                className="h-auto w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Marquee ribbon (the band is the accent) ───────────────────── */}
      <MarqueeRibbon items={MARQUEE_ITEMS} />

      {/* ── Featured products ────────────────────────────────────────────
          Real data from `featuredProductsOptions()`. No decor accent here:
          the cards are the restrained surface that repeats at scale. */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          initial="initial"
          animate="animate"
          variants={variants.staggerContainer}
          className="mb-12 text-center"
        >
          <motion.h2
            variants={variants.staggerItem}
            className="font-display text-4xl text-[var(--text)] md:text-6xl"
          >
            Featured Stickers
          </motion.h2>
          {/* TODO: owner copy */}
          <motion.p
            variants={variants.staggerItem}
            className="mt-2 font-hand text-lg text-[var(--text-muted)]"
          >
            Hand-picked favorites from our community
          </motion.p>
        </motion.div>

        {query.isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonProductCard key={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={variants.staggerContainer}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={variants.staggerItem} className="h-full">
                <ProductCard product={product} variant="featured" showActions />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 text-center">
          <Link href="/shop" className={cn(CTA_LINK_CLASSES, CTA_LINK_FILLS.primary)}>
            View All Stickers
          </Link>
        </div>
      </section>

      {/* ── Custom-sticker CTA band ──────────────────────────────────────
          One color block (`--gold`) with an ink border and the 10px hero-scale
          offset shadow; one decor accent (DoodleScatter). */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...variants.staggerItem.transition, duration: 0.5 }}
          className="relative overflow-hidden rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--gold)] p-10 text-center text-[var(--ink)] shadow-ink-4 md:p-14"
        >
          <DoodleScatter count={4} seed="landing-cta" />

          <h2 className="relative z-10 mb-4 font-display text-3xl md:text-5xl">
            Can&apos;t Find It?
          </h2>
          {/* TODO: owner copy */}
          <p className="relative z-10 mx-auto mb-8 max-w-xl font-hand text-xl">
            Design your own custom sticker with our easy builder. Upload art, pick materials,
            done.
          </p>
          <div className="relative z-10">
            <Link
              href="/custom-sticker"
              className={cn(CTA_LINK_CLASSES, CTA_LINK_FILLS.secondary)}
            >
              Design Custom Stickers
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </section>
    </PageWrapper>
  )
}
