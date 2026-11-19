'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPasswordSchema } from '@/lib/validations/profile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import { WashiTape, SketchUnderline } from '@/components/decorative/DoodleElements'
import { motion } from 'framer-motion'

// The token comes from the URL, not the form — omit it from the form schema,
// otherwise zod fails on the invisible missing field and refine never runs.
const resetFormSchema = resetPasswordSchema
  .omit({ token: true })
  .extend({ confirmPassword: z.string().min(1, 'Please confirm your new password') })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormInput = z.infer<typeof resetFormSchema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormInput>({ resolver: zodResolver(resetFormSchema) })

  const onSubmit = async (data: ResetFormInput) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Please wait a minute and try again.')
        } else if (json?.code === 'INVALID_TOKEN') {
          setError('This reset link is invalid or has expired. Request a new one below.')
        } else {
          setError(json?.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Card variant="doodle-elevated" padding="xl" className="w-full max-w-md relative">
        <WashiTape rotation={2} width={160} height={32} className="absolute -top-4 left-1/2 -translate-x-1/2 z-10" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="font-display text-3xl md:text-4xl text-primary">Choose a New Password</h1>
          <p className="text-[var(--text-subtle)] mt-2 text-body">
            {done ? 'Your password has been reset' : 'Enter a new password for your account'}
          </p>
        </div>

        {!token ? (
          <div className="text-center space-y-5" data-testid="reset-missing-token">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[color-mix(in_srgb,var(--warning)_20%,transparent)]">
              <AlertTriangle className="h-7 w-7 text-[var(--ink)]" aria-hidden="true" />
            </div>
            <p className="text-[var(--text)]">
              This page needs a reset link from your email. Request one and open the link it contains.
            </p>
            <Link href="/forgot-password" className="inline-block text-primary font-medium">
              <SketchUnderline>Request a reset link</SketchUnderline>
            </Link>
          </div>
        ) : done ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-5"
            data-testid="reset-success"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[color-mix(in_srgb,var(--success)_15%,transparent)]">
              <CheckCircle2 className="h-7 w-7 text-[var(--success)]" aria-hidden="true" />
            </div>
            <p className="text-[var(--text)]">You can now sign in with your new password.</p>
            <Button variant="doodle" size="xl" fullWidth onClick={() => router.push('/login')}>
              Go to Sign In
            </Button>
          </motion.div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-input border-2 border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] p-4 text-sm text-[var(--text)]"
              >
                {error}
                {error.includes('invalid or has expired') && (
                  <Link href="/forgot-password" className="mt-2 block font-medium text-primary">
                    <SketchUnderline>Request a new reset link</SketchUnderline>
                  </Link>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters, letters and numbers"
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
                icon={<Lock className="w-5 h-5" />}
                toggleIcon={{ show: <Eye className="w-5 h-5" />, hide: <EyeOff className="w-5 h-5" /> }}
                iconPosition="left"
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat your new password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                icon={<Lock className="w-5 h-5" />}
                toggleIcon={{ show: <Eye className="w-5 h-5" />, hide: <EyeOff className="w-5 h-5" /> }}
                iconPosition="left"
              />
              <Button type="submit" variant="doodle" size="xl" fullWidth loading={isLoading}>
                Reset Password
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}