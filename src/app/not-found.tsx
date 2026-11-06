'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { DoodleShape, WashiTape } from '@/components/decorative/DoodleElements'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="relative w-full max-w-md text-center">
        {/* Background doodle shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <DoodleShape size="xl" color="primary" animation="float" style={{ top: '-20%', left: '-10%', opacity: 0.15 }} />
          <DoodleShape size="lg" color="secondary" animation="float" style={{ bottom: '-10%', right: '-15%', opacity: 0.15, animationDelay: '-5s' }} />
          <DoodleShape size="md" color="accent" animation="pulse" style={{ top: '30%', right: '10%', opacity: 0.1, animationDelay: '-10s' }} />
          <DoodleShape size="sm" color="ink" animation="rotate" style={{ bottom: '20%', left: '15%', opacity: 0.08, animationDelay: '-3s' }} />
        </div>

        <div className="relative bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card p-10 shadow-card space-y-6">
          {/* Lost sticker character - skull sticker */}
          <div className="relative mx-auto w-48 h-48">
            <DoodleShape size="xl" color="primary" animation="float" className="opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/images/stickers/skull_sticker.png"
                alt="Lost sticker character"
                width={180}
                height={180}
                className="w-full h-full object-contain drop-shadow-[4px_4px_0_var(--ink)]"
                priority
              />
            </div>
            {/* Speech bubble */}
            <div className="absolute -top-6 -right-4 w-48 bg-white border-3 border-[var(--ink)] rounded-card p-3 shadow-card animate-fade-in-up">
              <p className="font-display text-sm text-primary text-center">I'm lost!</p>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-4 border-transparent border-t-[var(--ink)]" />
            </div>
          </div>

          {/* Washi tape on top */}
          <WashiTape rotation={-3} width={160} height={32} className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Heading */}
          <h1 className="font-display text-3xl md:text-4xl text-primary tracking-wider">
            Page wandered off
          </h1>

          {/* Message */}
          <p className="text-body text-[var(--ink)]/70 leading-relaxed">
            This page must have peeled off and gotten stuck somewhere. Let's get you back on track.
          </p>

          {/* Go Home button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button 
                variant="doodle" 
                size="xl"
                className="w-full sm:w-auto min-w-[200px]"
              >
                <Home className="w-6 h-6 mr-3" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}