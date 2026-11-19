'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { WashiTape, SketchUnderline } from '@/components/decorative'
import { motion } from 'framer-motion'
import { Check, X, Eye, EyeOff } from 'lucide-react'

function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  
  let score = 0
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  
  score = Object.values(checks).filter(Boolean).length
  
  if (score <= 1) return { score: 1, label: 'Very Weak', color: 'error' }
  if (score === 2) return { score: 2, label: 'Weak', color: 'error' }
  if (score === 3) return { score: 3, label: 'Fair', color: 'warning' }
  if (score === 4) return { score: 4, label: 'Good', color: 'success' }
  return { score: 5, label: 'Strong', color: 'success' }
}

function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const passwordStrength = calculatePasswordStrength(password)
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsMismatch = confirmPassword && password !== confirmPassword

  // Animate error in/out
  useEffect(() => {
    if (error) {
      setShowError(true)
    }
  }, [error])

  const dismissError = () => {
    setShowError(false)
    setTimeout(() => setError(''), 300)
  }

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Registration failed')
        return
      }

      // Sign in automatically after registration (next-auth/react credentials flow —
      // a raw fetch to /api/auth/signin cannot establish a session, and follows a
      // MissingCSRF redirect to an HTML page, which previously reported success wrongly)
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push('/login?registered=true')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Card variant="doodle-elevated" padding="xl" className="w-full max-w-md relative">
        {/* Washi tape accent on card */}
        <WashiTape rotation={-3} width={160} height={32} className="absolute -top-4 left-1/2 -translate-x-1/2 z-10" />
        
        {/* Sticker peel from Card component (already included via variant) */}

        <div className="text-center mb-8 relative z-10">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--text)]">Create Account</h1>
          <p className="text-[var(--text-subtle)] mt-2">Join us and start creating custom stickers</p>
        </div>

        {/* Error alert with doodle styling - shake on appear, slide out on dismiss */}
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="mb-6 p-4 bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border-2 border-[var(--error)] rounded-md text-[var(--text)] text-sm flex items-start justify-between gap-4 animate-shake"
            role="alert"
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3 flex-1">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-[var(--error)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={dismissError}
              className="flex-shrink-0 p-1 text-[var(--text-subtle)] hover:text-[var(--error)] transition-colors rounded-full hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)]"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            {...register('name')}
            error={errors.name?.message}
            disabled={isLoading}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            iconPosition="left"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={isLoading}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            iconPosition="left"
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="+8801XXXXXXXXX"
            {...register('phone')}
            error={errors.phone?.message}
            disabled={isLoading}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
            iconPosition="left"
          />

          {/* Password with strength indicator */}
          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              {...register('password')}
              error={errors.password?.message}
              disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              toggleIcon={{ show: <Eye className="w-5 h-5" />, hide: <EyeOff className="w-5 h-5" /> }}
              iconPosition="left"
            />
            
            {/* Password Strength Meter */}
            {password && (
              <div className="space-y-1.5" role="progressbar" aria-valuenow={passwordStrength.score} aria-valuemin={0} aria-valuemax={5} aria-label="Password strength">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-subtle)]">Password strength</span>
                  <span className="text-xs font-medium" style={{ color: `var(--${passwordStrength.color})` }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: passwordStrength.score / 5 }}
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: `var(--${passwordStrength.color})`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password with match validation */}
          <div className="relative space-y-2">
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              error={passwordsMismatch ? 'Passwords do not match' : errors.confirmPassword?.message}
              disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              toggleIcon={{ show: <Eye className="w-5 h-5" />, hide: <EyeOff className="w-5 h-5" /> }}
              iconPosition="left"
              className={passwordsMismatch ? 'animate-shake' : ''}
            />
            
            {/* Match indicator */}
            {confirmPassword && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <span className="flex items-center gap-1.5 text-[var(--green-strong)] text-sm">
                      <Check className="w-4 h-4" />
                      Passwords match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[var(--error)] text-sm animate-shake">
                      <X className="w-4 h-4" />
                      Passwords do not match
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-subtle)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--text)] font-medium">
              <SketchUnderline>Sign in</SketchUnderline>
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <RegisterForm />
  )
}