'use client'

import { useState, useEffect } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { safeCallbackUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Mail, Lock, X, Eye, EyeOff } from 'lucide-react'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { WashiTape, SketchUnderline } from '@/components/decorative/DoodleElements'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // `redirect` is the alias used by shop/cart links; both are sanitised so a
  // crafted callback cannot bounce the user off-site after sign-in.
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl') || searchParams.get('redirect'))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  // Animate error in/out
  useEffect(() => {
    if (error) {
      setShowError(true)
    }
  }, [error])

  const dismissError = () => {
    setShowError(false)
    // Wait for animation to complete before clearing error
    setTimeout(() => setError(''), 300)
  }

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        // After successful signIn, fetch session to check user role
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        
        if (session?.user?.role === 'ADMIN') {
          // Sign out the admin user and redirect to admin login
          await signOut({ callbackUrl: '/admin/login' })
          toast.error('Admin users must sign in at /admin/login')
          return
        }
        router.push(callbackUrl)
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
      {/* Doodle background scatter */}
      <DoodleBackground shapeCount={4} className="pointer-events-none" />

      <Card variant="doodle-elevated" padding="xl" className="w-full max-w-md relative">
        {/* Washi tape accent on card */}
        <WashiTape rotation={-3} width={160} height={32} className="absolute -top-4 left-1/2 -translate-x-1/2 z-10" />
        
        {/* Sticker peel from Card component (already included via variant) */}
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="font-display text-3xl md:text-4xl text-primary">Welcome Back</h1>
          <p className="text-[var(--text-subtle)] mt-2 text-body">Sign in to your account</p>
        </div>

        {/* Error alert with doodle styling - shake on appear, slide out on dismiss */}
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="mb-6 p-4 bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border-2 border-[var(--error)] rounded-input text-[var(--text)] text-sm flex items-start justify-between gap-4 animate-shake"
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
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={isLoading}
            icon={<Mail className="w-5 h-5" />}
            iconPosition="left"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
            disabled={isLoading}
            icon={<Lock className="w-5 h-5" />}
            toggleIcon={{ show: <Eye className="w-5 h-5" />, hide: <EyeOff className="w-5 h-5" /> }}
            iconPosition="left"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 accent-[var(--ink)] border-2 border-[var(--ink)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              <span className="text-sm text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-primary">
              <SketchUnderline>Forgot password?</SketchUnderline>
            </Link>
          </div>

          <Button
            type="submit"
            variant="doodle"
            size="xl"
            fullWidth
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-subtle)]">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-medium">
              <SketchUnderline>Sign up</SketchUnderline>
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}