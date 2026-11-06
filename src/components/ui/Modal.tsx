'use client'

import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Card } from './Card'
import { TornEdge } from '@/components/decorative/DoodleElements'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      contentRef.current?.focus()
      setIsExiting(false)
    } else {
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen && !isExiting) return

      if (e.key === 'Escape' && closeOnEscape) {
        onClose()
      }

      if (e.key === 'Tab') {
        const focusableElements = contentRef.current?.querySelectorAll<
          HTMLElement
        >('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')

        if (!focusableElements?.length) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isExiting, closeOnEscape, onClose])

  const handleClose = () => {
    setIsExiting(true)
    // Allow exit animation to complete
    setTimeout(() => {
      onClose()
    }, 200)
  }

  if (!isOpen && !isExiting) return null

  return (
    <Fragment>
      <div
        ref={overlayRef}
        className={cn(
          'fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm z-[199] animate-fade-in',
          isExiting && 'animate-fade-out'
        )}
        onClick={closeOnOverlayClick ? handleClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          'fixed inset-0 z-[200] flex items-center justify-center p-4',
          isExiting ? 'animate-scale-out' : 'animate-scale-in'
        )}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <Card variant="doodle-elevated" className={cn(sizeStyles[size], className)} padding="none">
          <TornEdge position="top" className="h-4 bg-[var(--surface-card)] border-3 border-[var(--ink)] border-b-0" />
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-[var(--light)]">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-xl font-display text-[var(--ink)]">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-body text-[var(--ink)]/60">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  aria-label="Close modal"
                  className={cn(
                    'text-[var(--ink)]/50 hover:text-[var(--ink)] hover:bg-[var(--light)]',
                    'animate-wobble hover:animate-wobble'
                  )}
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}
          <div className="p-6">{children}</div>
        </Card>
      </div>
    </Fragment>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-body text-[var(--ink)]/70 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}