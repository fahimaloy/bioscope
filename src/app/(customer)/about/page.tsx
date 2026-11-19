'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DoodleScatter, WashiTape, SketchUnderline } from '@/components/decorative'
import { StaggeredText } from '@/components/animations/StaggeredText'
import { Shield, RotateCcw, Heart, Sparkles, Palette, Leaf } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'

// C2 / ruling 2: fabricated marketing numbers ("500 Happy Customers", "150
// Projects Done", "50 Awards Won", "500+ Clients") and the invented team
// roster are REMOVED — no unapproved claims. Honest copy carries a TODO marker
// where the owner must supply real content. Materials/values are factual
// product information and stay.

const values = [
  { title: 'Creativity First', desc: 'Every design is a chance to create something amazing', icon: Sparkles },
  { title: 'Customer Obsessed', desc: 'Your satisfaction is our top priority', icon: Heart },
  { title: 'Sustainable Practices', desc: 'Eco-friendly materials and responsible production', icon: Leaf },
]

const materials = [
  { name: 'Vinyl', desc: 'Durable, weatherproof, perfect for outdoor use', icon: Shield },
  { name: 'Paper', desc: 'Eco-friendly, matte finish, great for indoor', icon: Leaf },
  { name: 'Kraft', desc: 'Natural brown texture, rustic & sustainable', icon: RotateCcw },
  { name: 'Holographic', desc: 'Iridescent shine that changes with light', icon: Sparkles },
]

const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}
const sectionItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
}

export default function AboutPage() {
  const variants = useMotionVariants()
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-12 pt-24">
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Hero — one decor accent (DoodleScatter, capped 6) */}
        <section className="relative py-20 text-center">
          <DoodleScatter count={6} seed="about-hero" />
          <WashiTape rotation={-3} width={180} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <motion.div variants={variants.fadeInUp} initial="initial" animate="animate" className="relative z-10">
            <StaggeredText as="h1" className="mb-6" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
              ABOUT US
            </StaggeredText>
            <p className="mx-auto mb-8 max-w-2xl text-2xl text-[var(--text-muted)] md:text-3xl">
              Making awesome fun things happen with custom stickers
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="primary" size="lg">Since 2020</Badge>
              <Badge variant="accent" size="lg">Bangladesh Made</Badge>
            </div>
          </motion.div>
        </section>

        {/* Our Story — honest copy, owner to approve/expand */}
        <section className="relative py-16" id="story">
          <WashiTape rotation={3} width={180} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10"
          >
            <div className="mx-auto max-w-4xl px-6">
              <motion.div variants={sectionItemVariants} className="mb-12 text-center">
                <span className="font-display text-3xl text-[var(--text)] md:text-4xl">
                  <SketchUnderline>Our Story</SketchUnderline>
                </span>
              </motion.div>
              <motion.div variants={sectionItemVariants} className="space-y-8 text-lg leading-relaxed text-[var(--text-muted)]">
                <p>
                  BioScope started with a simple idea: everyone deserves to express themselves through custom
                  designs. What began as a small home-based sticker printing operation in Dhaka has grown into a
                  custom sticker platform for creators, businesses, and dreamers.
                </p>
                <p>
                  We believe that stickers are more than just adhesive paper — they&apos;re tiny canvases for big
                  ideas. Whether you&apos;re a small business owner branding your packages, an artist sharing your
                  illustrations, or someone who just wants to decorate their laptop, we&apos;re here to make your
                  vision stick.
                </p>
                {/* TODO: owner copy — approved mission statement / real milestones */}
                <p className="font-semibold text-[var(--text)]">
                  Every sticker we print carries a piece of someone&apos;s story. That&apos;s a responsibility we
                  take seriously.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Materials — factual product info */}
        <section className="relative py-16" id="materials">
          <WashiTape rotation={-3} width={200} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10"
          >
            <motion.div variants={sectionItemVariants} className="mb-12 text-center">
              <span className="font-display text-3xl text-[var(--text)] md:text-4xl">
                <SketchUnderline>Our Materials</SketchUnderline>
              </span>
            </motion.div>
            <motion.div variants={sectionItemVariants} className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
              {materials.map((material) => (
                <Card key={material.name} variant="doodle" padding="lg" className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]">
                    <material.icon className="h-8 w-8 text-[var(--ink)]" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-display text-xl text-[var(--text)]">{material.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{material.desc}</p>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Team — invented roster removed; owner to supply real team content */}
        <section className="relative py-16" id="team">
          <WashiTape rotation={2} width={180} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <span className="font-display text-3xl text-[var(--text)] md:text-4xl">
              <SketchUnderline>Meet Our Team</SketchUnderline>
            </span>
            {/* TODO: owner copy — real team members, roles and photos */}
            <p className="mt-4 text-[var(--text-muted)]">
              We&apos;re a small Dhaka-based team of designers, printers and builders. Team profiles are coming soon.
            </p>
          </div>
        </section>

        {/* Values — ink band (contract §5: paper text on ink, no dark-mode toggle) */}
        <section className="relative bg-[var(--ink)] py-16 text-[var(--paper)]" id="values">
          <WashiTape rotation={-2} width={200} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            animate="visible"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="relative z-10 mx-auto max-w-4xl"
          >
            <motion.div variants={sectionItemVariants} className="mb-12 text-center">
              <span className="font-display text-3xl text-[var(--paper)] md:text-4xl">
                <SketchUnderline>Our Values</SketchUnderline>
              </span>
            </motion.div>
            <motion.div variants={sectionItemVariants} className="grid gap-8 md:grid-cols-3">
              {values.map((value) => (
                <Card key={value.title} variant="doodle" padding="lg" className="relative border-[var(--paper)] bg-[var(--ink)] text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border-2 border-[var(--paper)] bg-[color-mix(in_srgb,var(--paper)_15%,transparent)]">
                    <value.icon className="h-7 w-7 text-[var(--paper)]" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-display text-xl text-[var(--paper)]">{value.title}</h3>
                  <p className="text-[color-mix(in_srgb,var(--paper)_75%,transparent)]">{value.desc}</p>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="relative py-16 text-center">
          <WashiTape rotation={3} width={180} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          <motion.div variants={variants.fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true }} className="relative z-10">
            <h2 className="mb-6 font-display text-3xl text-[var(--text)] md:text-4xl">Ready to Create?</h2>
            <p className="mx-auto mb-8 max-w-xl text-xl text-[var(--text-muted)]">
              Browse the shop or design your own custom sticker.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/shop">
                <Button variant="primary" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
                  Shop Now
                </Button>
              </Link>
              <Link href="/custom-sticker">
                <Button variant="secondary" size="lg">
                  <Palette className="mr-2 h-5 w-5" aria-hidden="true" />
                  Design Custom
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
