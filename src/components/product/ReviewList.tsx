'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Review } from '@/types'
import { Star, Verified, Flag, ThumbsUp, ThumbsDown } from 'lucide-react'

interface ReviewListProps {
  reviews: Review[]
  productId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
  canReview?: boolean
  onWriteReview?: () => void
  className?: string
}

export function ReviewList({
  reviews,
  productId,
  averageRating,
  totalReviews,
  ratingDistribution,
  canReview = false,
  onWriteReview,
  className,
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest')
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')

  const filteredReviews = reviews
    .filter((review) => filterRating === 'all' || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'highest':
          return b.rating - a.rating
        case 'lowest':
          return a.rating - b.rating
        case 'helpful':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0)
        default:
          return 0
      }
    })

  return (
    <div className={cn('space-y-6', className)}>
      {/* Review Summary */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-display text-primary">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn('w-5 h-5', star <= Math.round(averageRating) ? 'fill-primary text-primary' : 'text-[var(--text-subtle)]')}
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--text-subtle)] mt-1">{totalReviews} reviews</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star] || 0
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-subtle)] w-8">{star}★</span>
                    <div className="flex-1 h-2 bg-[var(--light)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-subtle)] w-10 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {canReview && onWriteReview && (
            <Button variant="primary" className="w-full mt-4" onClick={onWriteReview}>
              Write a Review
            </Button>
          )}
        </div>

        {/* Rating Distribution Summary */}
        <div className="bg-[var(--light)] rounded-card p-6 border-2 border-[var(--ink)]">
          <h3 className="font-display text-xl text-[var(--ink)] mb-4">Rating Breakdown</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--ink)] w-8">{star}★</span>
                  <div className="flex-1 h-3 bg-dark/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text-subtle)]">{Math.round(percentage)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-subtle)]">Filter:</span>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>
                {star} Stars
              </option>
            ))}
            <option value="verified">Verified Purchases</option>
            <option value="with-photos">With Photos</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-subtle)]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-subtle)]">No reviews match your filters</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} productId={productId} />
          ))
        )}

        {/* Pagination would go here */}
      </div>
    </div>
  )
}

// Individual Review Card
function ReviewCard({ review, productId }: { review: Review; productId: string }) {
  const [showFull, setShowFull] = useState(false)
  const [helpful, setHelpful] = useState(false)
  const [notHelpful, setNotHelpful] = useState(false)

  const text = review.comment || ''
  const isLong = text.length > 300
  const displayText = showFull || !isLong ? text : text.substring(0, 300) + '...'

  return (
    <article className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-display text-lg">
              {review.user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium text-body text-[var(--ink)]">{review.user?.name || 'Anonymous'}</p>
            <p className="text-sm text-[var(--text-subtle)]">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={review.isVerifiedPurchase ? 'success' : 'outline'} size="sm" dot>
            {review.isVerifiedPurchase ? 'Verified Purchase' : 'Not Verified'}
          </Badge>
          {review.images.length > 0 && (
            <Badge variant="accent" size="sm" dot dotColor="var(--accent)">
              {review.images.length} Photos
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn('w-6 h-6', star <= review.rating ? 'fill-primary text-primary' : 'text-[var(--text-subtle)]')}
          />
        ))}
      </div>

      {review.title && (
        <h4 className="font-medium text-body text-[var(--ink)] mb-2">{review.title}</h4>
      )}

      <p className="text-body text-[color-mix(in_srgb,var(--ink)_70%,transparent)] leading-relaxed mb-3">{displayText}</p>

      {isLong && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFull(!showFull)}
          className="text-primary"
        >
          {showFull ? 'Show less' : 'Read more'}
        </Button>
      )}

      {/* Review Images */}
      {review.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {review.images.map((image, index) => (
            <div key={index} className="relative w-24 h-24 flex-shrink-0 rounded-input overflow-hidden">
              <Image src={image} alt={`Review photo ${index + 1}`} fill className="object-cover" sizes="96px" />
            </div>
          ))}
        </div>
      )}

      {/* Helpful Buttons */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--light)]">
        <button
          className={cn(
            'flex items-center gap-1 text-sm text-[var(--text-subtle)] hover:text-primary transition-colors',
            helpful && 'text-primary'
          )}
          onClick={() => setHelpful(!helpful)}
        >
          <ThumbsUp className={cn('w-4 h-4', helpful && 'fill-current')} />
          <span>Helpful</span>
        </button>
        <button
          className={cn(
            'flex items-center gap-1 text-sm text-[var(--text-subtle)] hover:text-red-500 transition-colors',
            notHelpful && 'text-red-500'
          )}
          onClick={() => setNotHelpful(!notHelpful)}
        >
          <ThumbsDown className={cn('w-4 h-4', notHelpful && 'fill-current')} />
          <span>Not Helpful</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-[var(--text-subtle)] hover:text-red-500 transition-colors ml-auto">
          <Flag className="w-4 h-4" />
          <span>Report</span>
        </button>
      </div>
    </article>
  )
}

// Review Summary Stats Component
export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  className,
}: {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="text-center">
        <div className="text-3xl font-display text-primary">{averageRating.toFixed(1)}</div>
        <div className="flex items-center justify-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn('w-4 h-4', star <= Math.round(averageRating) ? 'fill-primary text-primary' : 'text-[var(--text-subtle)]')}
            />
          ))}
        </div>
        <p className="text-sm text-[var(--text-subtle)] mt-1">{totalReviews} reviews</p>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star] || 0
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-subtle)] w-6">{star}★</span>
              <div className="flex-1 h-1.5 bg-dark/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-subtle)] w-8 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}