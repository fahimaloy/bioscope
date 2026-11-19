'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema } from '@/lib/validations/profile'
import type { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Mail, MailCheck, ArrowLeft } from 'lucide-react'
import { WashiTape, SketchUnderline } from '@/components/decorative/DoodleElements'
import { motion } from 'framer-motion'

type ForgotInput = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  // Dev-only convenience: the API returns the token when NODE_ENV !== production
  // so the flow can be exercised without SMTP. Never present in production.
  const [devToken, setDevToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotInput) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Please wait a minute and try again.')
        } else {
          setError(json?.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setDevToken(typeof json?.data?.devToken === 'string' ? json.data.devToken : null)
      setSent(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Card variant="doodle-elevated" padding="xl" className="w-full max-w-md relative">
        <WashiTape rotation={-3} width={160} height={32} className="absolute -top-4 left-1/2 -translate-x-1/2 z-10" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="font-display text-3xl md:text-4xl text-primary">Reset Password</h1>
          <p className="text-[var(--text-subtle)] mt-2 text-body">
            {sent ? 'Check your inbox' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-5"
            data-testid="forgot-success"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[color-mix(in_srgb,var(--success)_15%,transparent)]">
              <MailCheck className="h-7 w-7 text-[var(--success)]" aria-hidden="true" />
            </div>
            <p className="text-[var(--text)]">
              If an account exists for that email, a reset link is on its way. The link expires in 1 hour.
            </p>
            {devToken && (
              <div
                className="rounded-input border-2 border-dashed border-[var(--ink)] bg-[var(--surface-sunken)] p-3 text-sm"
                data-testid="dev-token-panel"
              >
                <p className="font-medium text-[var(--text)]">Development shortcut (no SMTP configured)</p>
                <Link
                  href={`/reset-password?token=${devToken}`}
                  className="mt-1 inline-block text-primary font-medium break-all"
                >
                  <SketchUnderline>Continue to reset password</SketchUnderline>
                </Link>
              </div>
            )}
            <Link href="/login" className="inline-flex items-center gap-2 text-primary font-medium">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <SketchUnderline>Back to sign in</SketchUnderline>
            </Link>
          </motion.div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-input border-2 border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] p-4 text-sm text-[var(--text)]"
              >
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
                icon={<Mail className="w-5 h-5" />}
                iconPosition="left"
              />
              <Button type="submit" variant="doodle" size="xl" fullWidth loading={isLoading}>
                Send Reset Link
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-primary font-medium">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <SketchUnderline>Back to sign in</SketchUnderline>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}