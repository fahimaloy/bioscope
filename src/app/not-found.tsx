'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { DoodleHeart, DoodleSparkle, DoodleStar, WashiTape } from '@/components/decorative'
import { useMotionVariants } from '@/lib/motion'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  const variants = useMotionVariants()
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-8">
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        className="relative w-full max-w-md text-center"
      >
        {/* One decor accent: a scatter of brand doodles, all aria-hidden
            (contract §3). Replaces the five deprecated DoodleShape accents. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <DoodleStar size={96} color="gold" animation="float" className="absolute -left-8 -top-8 opacity-20" />
          <DoodleHeart size={72} color="pink" animation="float" className="absolute -bottom-6 -right-8 opacity-20" />
          <DoodleSparkle size={48} color="violet" animation="pulse" className="absolute right-6 top-8 opacity-20" />
        </div>

        <div className="relative space-y-6 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-10 shadow-ink-3">
          {/* Lost sticker character */}
          <div className="relative mx-auto h-48 w-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/images/stickers/skull_sticker.png"
                alt="Lost sticker character"
                width={180}
                height={180}
                className="h-full w-full object-contain drop-shadow-[4px_4px_0_var(--ink)]"
                priority
              />
            </div>
            {/* Speech bubble */}
            <div className="absolute -top-6 -right-4 w-40 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-3 shadow-ink-2 sm:w-48">
              <p className="text-center font-display text-sm text-[var(--text)]">I&apos;m lost!</p>
              <div className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-1/2 border-4 border-transparent border-t-[var(--ink)]" />
            </div>
          </div>

          <WashiTape rotation={-3} width={160} height={32} className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2" />

          <h1 className="font-display text-3xl tracking-wider text-[var(--text)] md:text-4xl">
            Page wandered off
          </h1>

          <p className="leading-relaxed text-[var(--text-muted)]">
            This page must have peeled off and gotten stuck somewhere. Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" size="xl" className="w-full min-w-[200px] sm:w-auto">
                <Home className="mr-3 h-6 w-6" aria-hidden="true" />
                Go Home
              </Button>
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-[44px] items-center gap-2 font-medium text-[var(--text)]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Browse stickers
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
