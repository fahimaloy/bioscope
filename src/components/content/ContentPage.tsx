'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { WashiTape, SketchUnderline } from '@/components/decorative'
import { useMotionVariants } from '@/lib/motion'
import { Mail } from 'lucide-react'

export interface ContentSection {
  heading: string
  body: string[]
}

interface ContentPageProps {
  title: string
  eyebrow?: string
  sections?: ContentSection[]
  /** Honest "coming soon" shell for company pages with no content yet. */
  comingSoon?: boolean
  comingSoonNote?: string
  /** Extra interactive content (FAQ accordion, live shipping facts, tables). */
  children?: ReactNode
}

/**
 * C3 / rebuild tasks 2.11–2.12 — shared shell for the policy + company pages
 * so every Footer link resolves (no 404). Ruling 3: policy bodies are honest
 * "being finalized" placeholders marked TODO owner copy — NO invented legal
 * text — plus a working contact route. Company pages ship as coming-soon shells.
 */
export function ContentPage({ title, eyebrow, sections, comingSoon, comingSoonNote, children }: ContentPageProps) {
  const variants = useMotionVariants()
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <motion.div variants={variants.fadeInUp} initial="initial" animate="animate" className="relative z-10 mx-auto max-w-3xl">
        <header className="relative mb-12 text-center">
          <WashiTape rotation={-2} width={180} height={32} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4" />
          {eyebrow && (
            <Badge variant="secondary" size="md" className="mb-4">{eyebrow}</Badge>
          )}
          <h1 className="font-display text-4xl text-[var(--text)] md:text-5xl">
            <SketchUnderline>{title}</SketchUnderline>
          </h1>
        </header>

        {comingSoon ? (
          <Card variant="doodle" padding="xl" className="relative text-center">
            <p className="text-lg text-[var(--text-muted)]">
              {comingSoonNote ?? 'This page is coming soon.'}
            </p>
            {/* TODO: owner copy — real content for this page. */}
            <p className="mt-4 text-sm text-[var(--text-subtle)]">
              We&apos;re working on it. In the meantime, reach out and we&apos;ll help directly.
            </p>
          </Card>
        ) : (
          <div className="space-y-10">
            {sections?.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-4 font-display text-2xl text-[var(--text)]">{section.heading}</h2>
                <div className="space-y-4 leading-relaxed text-[var(--text-muted)]">
                  {section.body.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
            {children}
          </div>
        )}

        {/* Working contact route on every content page (ruling 3). */}
        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] items-center gap-2 font-medium text-[var(--text)]"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            <SketchUnderline>Questions? Contact us</SketchUnderline>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
