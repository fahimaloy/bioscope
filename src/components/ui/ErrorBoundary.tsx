'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { DoodleHeart, DoodleSparkle, DoodleStar, WashiTape } from '@/components/decorative';
import { Home, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorBoundaryFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Paper + Pop fallback component
interface ErrorBoundaryFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

export function ErrorBoundaryFallback({ error, onRetry }: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="relative w-full max-w-md text-center">
        {/* One decor accent: a scatter of brand doodles, all aria-hidden. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <DoodleStar
            size={96}
            color="gold"
            animation="float"
            className="absolute -left-8 -top-8 opacity-20"
          />
          <DoodleHeart
            size={72}
            color="pink"
            animation="float"
            className="absolute -bottom-6 -right-8 opacity-20"
          />
          <DoodleSparkle
            size={48}
            color="violet"
            animation="pulse"
            className="absolute right-6 top-8 opacity-20"
          />
        </div>

        <div className="relative space-y-6 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-10 shadow-ink-3">
          {/* Sad sticker illustration */}
          <div className="relative mx-auto h-40 w-40">
            <DoodleStar
              size={160}
              color="gold"
              animation="wobble"
              className="absolute inset-0 m-auto opacity-20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full text-[var(--ink)]"
                aria-hidden="true"
              >
                {/* Sad face sticker */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="var(--gold)"
                  fillOpacity="0.2"
                  stroke="var(--ink)"
                  strokeWidth="3"
                />
                {/* Eyes - sad */}
                <ellipse
                  cx="35"
                  cy="42"
                  rx="8"
                  ry="12"
                  fill="var(--ink)"
                  transform="rotate(-15 35 42)"
                  opacity="0.8"
                />
                <ellipse
                  cx="65"
                  cy="42"
                  rx="8"
                  ry="12"
                  fill="var(--ink)"
                  transform="rotate(15 65 42)"
                  opacity="0.8"
                />
                {/* Sad mouth */}
                <path
                  d="M30 65 Q50 78 70 65"
                  stroke="var(--ink)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Tear drops */}
                <ellipse cx="28" cy="52" rx="3" ry="6" fill="var(--pink)" opacity="0.9" />
                <ellipse cx="72" cy="52" rx="3" ry="6" fill="var(--pink)" opacity="0.9" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl tracking-wider text-[var(--ink)] md:text-4xl">
            Something stuck
          </h1>

          {/* Message */}
          <p className="text-body leading-relaxed text-[var(--text-muted)]">
            Looks like our sticker machine jammed. Don't worry, it happens to the best of us.
          </p>

          {error && (
            <details className="group text-left">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--ink)]">
                <span className="font-display" aria-hidden="true">
                  ▸
                </span>
                Technical details
              </summary>
              <pre className="mt-3 max-h-40 overflow-auto rounded-[var(--radius-md)] border-2 border-[var(--paper-deep)] bg-[var(--paper-deep)] p-4 font-mono text-xs text-[var(--text-muted)]">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}

          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              onClick={onRetry}
              className="w-full min-w-[160px] sm:w-auto"
            >
              <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => (window.location.href = '/')}
              className="w-full min-w-[160px] sm:w-auto"
            >
              <Home className="mr-2 h-5 w-5" aria-hidden="true" />
              Go Home
            </Button>
          </div>
        </div>

        {/* Decorative washi tape */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <WashiTape color="gold" rotation={-3} width={128} height={32} />
        </div>
      </div>
    </div>
  );
}
