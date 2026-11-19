'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * E9 — route-level page transition. `template.tsx` re-mounts on every navigation
 * (unlike layout), giving a brief fade/rise between customer routes. Contract §4:
 * transform/opacity-only, ≤200ms (0.18s), and collapses to an instant opacity-only
 * fade under reduced motion (also covered globally by MotionConfig reducedMotion).
 * No new JS animation loop — framer-motion only.
 */
export default function CustomerTemplate({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
