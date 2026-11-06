'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { DoodleShape } from '@/components/decorative/DoodleElements'
import { Home, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <ErrorBoundaryFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

// Doodle-style fallback component
interface ErrorBoundaryFallbackProps {
  error: Error | null
  onRetry: () => void
}

export function ErrorBoundaryFallback({ error, onRetry }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="relative w-full max-w-md text-center">
        {/* Background doodle shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <DoodleShape size="xl" color="primary" animation="float" style={{ top: '-20%', left: '-10%', opacity: 0.15 }} />
          <DoodleShape size="lg" color="secondary" animation="float" style={{ bottom: '-10%', right: '-15%', opacity: 0.15, animationDelay: '-5s' }} />
          <DoodleShape size="md" color="accent" animation="pulse" style={{ top: '30%', right: '10%', opacity: 0.1, animationDelay: '-10s' }} />
        </div>

        <div className="relative bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card p-10 shadow-card space-y-6">
          {/* Sad sticker illustration */}
          <div className="relative mx-auto w-40 h-40">
            <DoodleShape size="xl" color="primary" animation="wobble" className="opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full text-[var(--ink)]"
                aria-hidden="true"
              >
                {/* Sad face sticker */}
                <circle cx="50" cy="50" r="45" fill="var(--primary)" fillOpacity="0.15" stroke="var(--ink)" strokeWidth="3"/>
                {/* Eyes - sad */}
                <ellipse cx="35" cy="42" rx="8" ry="12" fill="var(--ink)" transform="rotate(-15 35 42)" opacity="0.8"/>
                <ellipse cx="65" cy="42" rx="8" ry="12" fill="var(--ink)" transform="rotate(15 65 42)" opacity="0.8"/>
                {/* Sad mouth */}
                <path 
                  d="M30 65 Q50 78 70 65" 
                  stroke="var(--ink)" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeLinecap="round"
                />
                {/* Tear drops */}
                <ellipse cx="28" cy="52" rx="3" ry="6" fill="var(--secondary)" opacity="0.8"/>
                <ellipse cx="72" cy="52" rx="3" ry="6" fill="var(--secondary)" opacity="0.8"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl md:text-4xl text-primary tracking-wider">
            Something stuck
          </h1>

          {/* Message */}
          <p className="text-body text-[var(--ink)]/70 leading-relaxed">
            Looks like our sticker machine jammed. Don't worry, it happens to the best of us.
          </p>

          {error && (
            <details className="text-left group">
              <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]/60 hover:text-primary transition-colors flex items-center gap-2">
                <span className="font-display">▸</span>
                Technical details
              </summary>
              <pre className="mt-3 p-4 bg-[var(--light)] rounded-input text-xs text-[var(--ink)]/70 overflow-auto max-h-40 font-mono">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              variant="doodle" 
              size="lg"
              onClick={onRetry}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retry
            </Button>
            <Button 
              variant="doodle-outline" 
              size="lg"
              onClick={() => window.location.href = '/'}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </div>
        </div>

        {/* Decorative washi tape */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rotate-[-3deg] w-32 h-8 bg-gradient-to-r from-[var(--accent)] to-[var(--pink)] border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] pointer-events-none" />
      </div>
    </div>
  )
}