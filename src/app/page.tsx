'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { DoodleStar, StickerPeel, TornEdge, WashiTape, SketchUnderline } from '@/components/decorative/DoodleElements'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motionVariants } from '@/lib/motion'

export default function HomePage() {
  // Staggered title letters
  const titleLines = [
    'Make Awesome',
    'Fun Things Stick'
  ]

  // Marquee items with doodle stars
  const marqueeItems = [
    'VINYL', 'PAPER', 'HOLOGRAPHIC', 'KRAFT', 'CUSTOM', 'BIODIVERSITY'
  ]

  // Featured products data (will be replaced with real data)
  const featuredProducts = [
    { id: '1', name: 'Vintage Doodle Pack', slug: 'vintage-doodle-pack', basePrice: 350, compareAtPrice: null, images: ['/placeholder.jpg'], allowedDimensions: [{ width: 50, height: 50, label: '5x5cm', priceMultiplier: 1, isDefault: true }], isFeatured: true, category: { name: 'vinyl' } },
    { id: '2', name: 'Retro Space Cat', slug: 'retro-space-cat', basePrice: 420, compareAtPrice: null, images: ['/placeholder.jpg'], allowedDimensions: [{ width: 50, height: 50, label: '5x5cm', priceMultiplier: 1, isDefault: true }], isFeatured: true, category: { name: 'holographic' } },
    { id: '3', name: 'Kraft Flower Kit', slug: 'kraft-flower-kit', basePrice: 280, compareAtPrice: null, images: ['/placeholder.jpg'], allowedDimensions: [{ width: 50, height: 50, label: '5x5cm', priceMultiplier: 1, isDefault: true }], isFeatured: true, category: { name: 'kraft' } },
  ]

  // How it works steps
  const steps = [
    { num: '01', title: 'Design', desc: 'Pick or doodle your own sticker art.', icon: '✏️' },
    { num: '02', title: 'Print', desc: 'We cut, print, and finish with craft.', icon: '🖨️' },
    { num: '03', title: 'Stick', desc: 'Add to journals, laptops, or life.', icon: '📎' },
  ]

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-color)] overflow-x-hidden relative">
      {/* Grain texture overlay */}
      <div className="grain" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 text-center min-h-[90vh] flex items-center justify-center">
        <DoodleBackground shapeCount={8} interactive={true} />
        
        {/* Floating emojis */}
        <div className="floating-emojis pointer-events-none absolute inset-0" aria-hidden="true">
          <span className="emoji e1">✨</span>
          <span className="emoji e2">🎨</span>
          <span className="emoji e3">✂️</span>
          <span className="emoji e4">📦</span>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          {/* Staggered Title */}
          <div className="staggered-title mb-8">
            {titleLines.map((line, lineIndex) => (
              <div key={lineIndex} className="w-full flex justify-center">
                {line.split('').map((char, charIndex) => (
                  <span
                    key={`${lineIndex}-${charIndex}`}
                    style={{
                      animationDelay: `${(lineIndex * line.length + charIndex) * 50}ms`,
                      display: char === ' ' ? 'inline-block' : 'inline-block',
                      width: char === ' ' ? '0.4em' : 'auto'
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Subtitle with sketch underline */}
          <motion.p 
            className="font-[var(--font-hand)] text-xl md:text-2xl text-[var(--ink)]/80 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <SketchUnderline className="inline-block">
              Design doodles. Print stickers. Spread nostalgia.
            </SketchUnderline>
          </motion.p>

          {/* CTA Buttons with StickerPeel */}
          <motion.div
            className="flex justify-center gap-4 flex-wrap mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Link href="/shop">
              <Button variant="doodle" size="lg">
                Browse Stickers
              </Button>
            </Link>
            <Link href="/custom-sticker">
              <Button variant="doodle-secondary" size="lg">
                Design Custom
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges with sketch underline */}
          <motion.div
            className="flex justify-center gap-3 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Badge size="lg" variant="doodle" className="relative">
              <SketchUnderline>Free Delivery over 2000 BDT</SketchUnderline>
            </Badge>
            <Badge variant="secondary" size="lg" className="relative">
              <SketchUnderline>Weatherproof</SketchUnderline>
            </Badge>
            <Badge variant="accent" size="lg" className="relative">
              <SketchUnderline>Custom Welcome</SketchUnderline>
            </Badge>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Marquee */}
      <div className="marquee py-4 mb-16 relative overflow-hidden">
        <WashiTape width={200} rotation={-3} className="top-0 left-1/4 -translate-x-1/2" />
        <WashiTape width={200} rotation={3} className="top-0 right-1/4 translate-x-1/2" />
        <div className="marquee-inner relative z-10">
          {marqueeItems.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {item}
              <DoodleStar size="sm" color="accent" animation="float" className="inline-block" />
            </span>
          ))}
          {marqueeItems.map((item, i) => (
            <span key={`${i}-dup`} className="flex items-center gap-2">
              {item}
              <DoodleStar size="sm" color="accent" animation="float" className="inline-block" />
            </span>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            className="font-[var(--font-display)] text-4xl md:text-6xl text-[var(--ink)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Stickers
          </motion.h2>
          <motion.p
            className="font-[var(--font-hand)] text-lg text-[var(--ink)]/60 mt-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Hand-picked favorites from our community
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={motionVariants.staggerContainer}
        >
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              variants={motionVariants.staggerItem}
              className="h-full"
            >
              <ProductCard
                product={product as any}
                variant="featured"
                showActions={true}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/shop">
            <Button variant="doodle-outline" size="lg" className="group">
              View All Stickers
              <DoodleStar size="sm" color="accent" className="ml-2 group-hover:animate-wobble transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto relative">
        <TornEdge position="top" className="absolute top-0 left-0 right-0 h-8 bg-[var(--bg-color)]" />
        <TornEdge position="bottom" className="absolute bottom-0 left-0 right-0 h-8 bg-[var(--bg-color)]" />

        <div className="relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2 className="font-[var(--font-display)] text-4xl md:text-5xl text-[var(--ink)]">
              How It Works
            </motion.h2>
            <motion.p className="font-[var(--font-hand)] text-lg text-[var(--ink)]/60 mt-3">
              Three simple steps to sticky happiness
            </motion.p>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="relative flex-1 max-w-xs"
              >
                {/* Doodle card with StickerPeel */}
                <div className="relative bg-[var(--paper)] border-3 border-[var(--ink)] rounded-[20px_4px_20px_4px] shadow-[8px_8px_0_var(--secondary)] hover:shadow-[12px_12px_0_var(--primary)] transition-all duration-500 p-8 text-center group">
                  <StickerPeel className="top-0 right-0" />
                  
                  {/* Step number with Bangers */}
                  <div className="mb-4">
                    <span className="font-[var(--font-display)] text-7xl md:text-8xl text-[var(--accent)]/30 group-hover:text-[var(--accent)]/60 transition-colors duration-500">
                      {step.num}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="text-6xl mb-4 animate-float-gentle" aria-hidden="true">
                    {step.icon}
                  </div>

                  {/* Title */}
                  <motion.h3 className="font-[var(--font-display)] text-2xl md:text-3xl text-[var(--ink)] mb-3">
                    {step.title}
                  </motion.h3>

                  {/* Description */}
                  <motion.p className="font-[var(--font-hand)] text-lg text-[var(--ink)]/70 max-w-xs mx-auto">
                    {step.desc}
                  </motion.p>

                  {/* Decorative accent */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DoodleStar size="md" color="primary" animation="float" />
                  </div>
                </div>

                {/* Connector line between steps (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--pink)] rounded-full opacity-50" aria-hidden="true" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 max-w-4xl mx-auto relative">
        {/* Torn edge background */}
        <div className="absolute inset-0 -z-10">
          <TornEdge position="top" className="w-full h-full bg-[var(--ink)]" />
        </div>

        <div className="relative z-10 text-center">
          {/* Washi tape accent */}
          <div className="flex justify-center mb-8">
            <WashiTape width={280} rotation={-1} className="relative">
              <span className="font-[var(--font-display)] text-sm text-[var(--ink)] tracking-wider">
                SPECIAL OFFER
              </span>
            </WashiTape>
          </div>

          <motion.div
            className="bg-[var(--ink)] text-[var(--paper)] rounded-[30px_8px] p-10 md:p-14 shadow-[12px_12px_0_var(--accent)] relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Decorative scatter in CTA */}
            <DoodleBackground shapeCount={4} className="opacity-20" />
            
            <motion.h2
              className="font-[var(--font-display)] text-3xl md:text-5xl mb-4 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Can&apos;t Find It?
            </motion.h2>
            
            <motion.p
              className="font-[var(--font-hand)] text-xl mb-8 max-w-xl mx-auto relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Design your own custom sticker with our easy builder. Upload art, pick materials, done.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10"
            >
              <Link href="/custom-sticker">
                <Button
                  variant="doodle-secondary"
                  size="xl"
                  className="animate-pulse-soft group relative"
                >
                  Design Custom Stickers
                  <DoodleStar size="sm" color="primary" className="ml-3 group-hover:animate-wobble transition-transform" aria-hidden="true" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicator */}
            <motion.p
              className="font-[var(--font-hand)] text-sm text-[var(--paper)]/60 mt-8 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              10,000+ happy creators · 50,000+ stickers printed · Made with 💛 in Bangladesh
            </motion.p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}