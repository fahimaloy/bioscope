'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { SketchUnderline } from '@/components/decorative'
import { useMotionVariants } from '@/lib/motion'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  productId: string
  className?: string
}

/**
 * E3 — review submission (revived; was zero-consumer dead code). Self-contained
 * client component mounted under ReviewList on the product page. Posts the real
 * `/api/reviews` route (requireUser). The route does NOT gate on purchase — it
 * creates the review for any signed-in customer and flags `isVerifiedPurchase`
 * when a DELIVERED order contains the product; the UI states that honestly.
 * Guests get a sign-in CTA that returns to this product (callbackUrl).
 */
export function ReviewForm({ productId, className }: ReviewFormProps) {
  const variants = useMotionVariants()
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [ratingError, setRatingError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rating === 0) {
      setRatingError(true)
      return
    }
    setRatingError(false)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Could not submit your review. Please try again.')
        return
      }
      toast.success('Thanks! Your review was posted.')
      setRating(0)
      setTitle('')
      setComment('')
      router.refresh() // re-fetch the server component's reviews
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card variant="doodle" padding="lg" className={cn('relative text-center', className)}>
        <p className="mb-4 text-[var(--text-muted)]">
          <SketchUnderline>Sign in to write a review</SketchUnderline>
        </p>
        <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>
          <Button variant="primary" size="md">Sign in</Button>
        </Link>
      </Card>
    )
  }

  return (
    <motion.div variants={variants.fadeInUp} initial="initial" animate="animate">
      <Card variant="doodle" padding="lg" className={cn('relative', className)}>
        <h3 className="mb-4 font-display text-xl text-[var(--text)]">
          <SketchUnderline>Write a review</SketchUnderline>
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="mb-2 block text-sm font-medium text-[var(--text)]">Your rating</span>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  onClick={() => { setRating(star); setRatingError(false) }}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="flex h-11 w-11 items-center justify-center rounded-md transition-colors"
                >
                  <Star
                    className={cn('h-7 w-7', (hover || rating) >= star ? 'text-[var(--gold)]' : 'text-[var(--text-subtle)]')}
                    fill={(hover || rating) >= star ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            {ratingError && <p className="mt-1 text-sm text-[var(--error)]">Please choose a rating.</p>}
          </div>

          <Input
            label="Title (optional)"
            placeholder="Sum it up in a few words"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            maxLength={100}
          />
          <Textarea
            label="Your review (optional)"
            placeholder="What did you like or dislike? How was the quality?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
            rows={4}
            maxLength={2000}
          />

          {error && (
            <div role="alert" className="rounded-md border-2 border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] p-3 text-sm text-[var(--text)]">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />Posting…</> : 'Post review'}
          </Button>
          <p className="text-xs text-[var(--text-subtle)]">
            Open to all customers. A &ldquo;Verified purchase&rdquo; badge is added automatically if you&apos;ve received this product.
          </p>
        </form>
      </Card>
    </motion.div>
  )
}
