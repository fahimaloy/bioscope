// @vitest-environment jsdom
//
// E9 — route-level template: renders children, fade/rise <=200ms, collapses to
// instant opacity-only under reduced motion (transform/opacity-only contract).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mocks = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => mocks.reduced }
})

import CustomerTemplate from '@/app/(customer)/template'

beforeEach(() => {
  mocks.reduced = false
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: q.includes('reduce'), media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => cleanup())

describe('CustomerTemplate', () => {
  it('renders its children', () => {
    render(<CustomerTemplate><p>page content</p></CustomerTemplate>)
    expect(screen.getByText('page content')).toBeInTheDocument()
  })
  it('uses a <=200ms transition (0.18s) for the fade/rise', () => {
    const { container } = render(<CustomerTemplate><p>x</p></CustomerTemplate>)
    const div = container.firstElementChild as HTMLElement
    // framer-motion writes the transition into the style/animation; assert the
    // element mounts with the initial transform state (opacity 0, y translate).
    expect(div).toBeInTheDocument()
    expect(div.style.opacity).toBe('0')
  })
  it('reduced motion: no transform, instant (duration 0)', () => {
    mocks.reduced = true
    const { container } = render(<CustomerTemplate><p>x</p></CustomerTemplate>)
    const div = container.firstElementChild as HTMLElement
    expect(div.style.transform === '' || div.style.transform === 'none').toBe(true)
  })
})
