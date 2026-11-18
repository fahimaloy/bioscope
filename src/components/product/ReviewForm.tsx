'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Star } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  onSubmit: (data: ReviewFormData) => Promise<void>
  onCancel: () => void
  initialRating?: number
  initialTitle?: string
  initialComment?: string
  isEditing?: boolean
  className?: string
}

interface ReviewFormData {
  rating: number
  title: string
  comment: string
  images: string[]
}

export function ReviewForm({
  onSubmit,
  onCancel,
  initialRating = 0,
  initialTitle = '',
  initialComment = '',
  isEditing = false,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [title, setTitle] = useState(initialTitle)
  const [comment, setComment] = useState(initialComment)
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const newErrors: Record<string, boolean> = {}

    if (rating === 0) {
      newErrors.rating = true
    }
    if (!title.trim()) {
      newErrors.title = true
    }
    if (!comment.trim()) {
      newErrors.comment = true
    }
    if (comment.trim().length < 10) {
      newErrors.comment = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit({ rating, title, comment, images })
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6 bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl text-primary">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-3">Your Rating <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                'p-2 rounded-input transition-colors',
                rating >= star
                  ? 'text-primary'
                  : 'text-[var(--text-subtle)] hover:text-primary'
              )}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              aria-checked={rating >= star}
              role="radio"
            >
              <Star className={cn('w-8 h-8', rating >= star ? 'fill-current' : '')} />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-500">Please select a rating</p>
        )}
      </div>

      {/* Title */}
      <Input
        label="Review Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Summarize your experience"
        error={errors.title ? 'Title is required' : undefined}
        required
        maxLength={100}
      />

      {/* Comment */}
      <Textarea
        label="Your Review"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your detailed experience with this product..."
        error={errors.comment ? 'Review must be at least 10 characters' : undefined}
        required
        minLength={10}
        maxLength={2000}
        rows={5}
      />

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-2">Photos (Optional)</label>
        <ImageUpload
          value={images}
          onChange={(files) =>
            setImages(files.map((f) => (typeof f === 'string' ? f : URL.createObjectURL(f))))
          }
          accept="image/*"
          maxSize={5}
          maxFiles={5}
          multiple
          showPreview
          removable
          hint="Add up to 5 photos (max 5MB each)"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--light)]">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting} size="lg">
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  )
}

// Star Rating Display Component
export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)} role={interactive ? 'radiogroup' : 'img'} aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= rating
        const partial = !filled && starValue - 0.5 <= rating

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => interactive && onChange?.(starValue)}
            disabled={!interactive}
            className={cn(
              'p-1 transition-colors',
              interactive ? 'hover:text-primary cursor-pointer' : '',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded'
            )}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            aria-checked={filled}
            role={interactive ? 'radio' : undefined}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled ? 'fill-primary text-primary' : partial ? 'fill-primary text-primary' : 'text-[var(--text-subtle)]'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

// Review Helpful Button
export function ReviewHelpfulButton({
  helpfulCount = 0,
  notHelpfulCount = 0,
  userVoted: initialVoted = null,
  onVote,
  className,
}: {
  helpfulCount?: number
  notHelpfulCount?: number
  userVoted?: 'helpful' | 'not-helpful' | null
  onVote?: (vote: 'helpful' | 'not-helpful') => void
  className?: string
}) {
  const [voted, setVoted] = useState<'helpful' | 'not-helpful' | null>(initialVoted)
  const [helpful, setHelpful] = useState(helpfulCount)
  const [notHelpful, setNotHelpful] = useState(notHelpfulCount)

  const handleVote = (vote: 'helpful' | 'not-helpful') => {
    if (voted === vote) return

    if (vote === 'helpful') {
      setHelpful((h) => h + (voted === 'not-helpful' ? 2 : 1))
      if (voted === 'not-helpful') setNotHelpful((n) => n - 1)
    } else {
      setNotHelpful((n) => n + (voted === 'helpful' ? 2 : 1))
      if (voted === 'helpful') setHelpful((h) => h - 1)
    }

    setVoted(vote)
    onVote?.(vote)
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <button
        onClick={() => handleVote('helpful')}
        className={cn(
          'flex items-center gap-1 text-sm transition-colors',
          voted === 'helpful' ? 'text-primary' : 'text-[var(--text-subtle)] hover:text-primary'
        )}
      >
        <svg className={cn('w-5 h-5', voted === 'helpful' && 'fill-current')} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span>{helpful}</span>
      </button>
      <button
        onClick={() => handleVote('not-helpful')}
        className={cn(
          'flex items-center gap-1 text-sm transition-colors',
          voted === 'not-helpful' ? 'text-red-500' : 'text-[var(--text-subtle)] hover:text-red-500'
        )}
      >
        <svg className={cn('w-5 h-5', voted === 'not-helpful' && 'fill-current')} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
          <path d="M10 15v4a3 3 0 0 1-3 3l4-9v-11H5.28a2 2 0 0 1-2-1.7l-1.38-9a2 2 0 0 1 2-2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
        </svg>
        <span>{notHelpful}</span>
      </button>
    </div>
  )
}