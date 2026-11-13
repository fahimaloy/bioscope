// @vitest-environment jsdom
//
// Task 2.6 — custom sticker builder surfaces.
//
// Pins the brief's Step 1 contract:
//   1. the builder renders the tools / canvas / preview panels on desktop;
//   2. the mobile tab control switches which panel is rendered (jsdom cannot
//      observe CSS visibility, so "the visible one" is asserted as the one
//      that is rendered — the `lg:hidden` panels are all in the DOM);
//   3. the canvas area carries the grid-paper surface;
//   4. the eight owned files carry none of the legacy classes/tokens, no
//      `from-${}`/`to-${}` interpolation, no emoji, no `var(--primary)` fill
//      default, and no hardcoded colour.
//
// `next/navigation` is mocked so the page mounts outside the App Router and
// `fabric` is mocked because jsdom has no canvas 2D implementation. The mock
// is deliberately a behaviour stub, not a rendering one: nothing here claims
// the canvas actually draws.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CustomStickerPage from '@/app/(customer)/custom-sticker/page'
import { useStickerBuilderStore } from '@/lib/hooks/useStickerBuilder'
import type { DesignLayer } from '@/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/custom-sticker',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({
    fill,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    <img {...props} />
  ),
}))

/**
 * `fabric` needs a canvas 2D context jsdom does not implement. The mock keeps
 * the real component code paths (init, loadDesign, selection handlers) while
 * stubbing every drawing call.
 */
vi.mock('fabric', () => {
  class FakeFabricObject {
    constructor(public options: Record<string, unknown> = {}) {
      Object.assign(this, options)
    }
    set() {
      return this
    }
    on() {
      return this
    }
    off() {
      return this
    }
  }

  class FakeCanvas {
    backgroundColor: string | undefined
    viewportTransform = [1, 0, 0, 1, 0, 0]
    constructor(
      public el: unknown,
      public options: Record<string, unknown> = {},
    ) {}
    on() {
      return this
    }
    off() {
      return this
    }
    getContext() {
      return {}
    }
    setDimensions() {
      return this
    }
    getWidth() {
      return 0
    }
    getHeight() {
      return 0
    }
    renderAll() {}
    clear() {
      return this
    }
    add() {
      return this
    }
    sendToBack() {
      return this
    }
    setActiveObject() {
      return this
    }
    getObjects() {
      return [] as FakeFabricObject[]
    }
    setZoom() {
      return this
    }
    dispose() {}
    toDataURL() {
      return 'data:image/png;base64,'
    }
  }

  return {
    fabric: {
      Canvas: FakeCanvas,
      Text: FakeFabricObject,
      Rect: FakeFabricObject,
      Circle: FakeFabricObject,
      Triangle: FakeFabricObject,
      Image: {
        fromURL: (_url: string, callback: (img: FakeFabricObject) => void) =>
          callback(new FakeFabricObject()),
      },
    },
  }
})

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(
    <SessionProvider session={null}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </SessionProvider>,
  )
}

/** A minimal text layer, so EditingTools / LayerPanel render their real trees. */
function seedTextLayer() {
  useStickerBuilderStore.getState().reset()
  useStickerBuilderStore.getState().addLayer({
    type: 'text',
    text: 'Hello sticker',
    fontFamily: 'Outfit',
    fontSize: 40,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textColor: '#000000',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: 0,
    x: 5,
    y: 5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  } as Omit<DesignLayer, 'id' | 'zIndex'>)
}

/* ------------------------------------------------------------------ */
/* Source scan                                                         */
/* ------------------------------------------------------------------ */

const REPO_ROOT = process.cwd()

/** The page plus the seven component files this task owns. */
const OWNED_FILES = [
  'src/app/(customer)/custom-sticker/page.tsx',
  'src/components/custom-sticker/StickerCanvas.tsx',
  'src/components/custom-sticker/UploadZone.tsx',
  'src/components/custom-sticker/EditingTools.tsx',
  'src/components/custom-sticker/DimensionControls.tsx',
  'src/components/custom-sticker/ColorAdjustments.tsx',
  'src/components/custom-sticker/PreviewPanel.tsx',
  'src/components/custom-sticker/LayerPanel.tsx',
]

/**
 * Legacy class names / tokens from the brief's measurement tables. Each entry
 * is a literal substring, so `bg-primary` also catches `bg-primary/10`.
 */
const LEGACY_TOKENS = [
  'text-primary',
  'hover:text-primary',
  'border-primary',
  'fill-primary',
  'text-body',
  'text-secondary',
  'text-accent',
  'bg-[var(--light)]',
  'border-[var(--light)]',
  'bg-white',
  'rounded-card',
  'rounded-input',
  'border-3',
  'shadow-card',
  'text-red-500',
  'hover:text-red-500',
  'bg-red-50',
  'text-green-600',
  'bg-green-50',
  'border-green-200',
  'bg-accent/10',
  'border-accent',
  'bg-primary',
  'bg-secondary',
  'bg-gradient',
  'DoodleElements',
]

/** Tokens the default theme never defines (only under prefers-contrast: high). */
const UNDEFINED_TOKENS = /var\(--(?:primary|secondary|light|bg-color)\)/g

/** Emoji, including the variation-selector forms (`✂️` = U+2702 U+FE0F). */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu

/** Hex colour literals (`#fff`, `#FBC02D`). */
const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/g

/** Dynamic Tailwind class construction, invisible to the scanner. */
const DYNAMIC_INTERPOLATION = /(?:from|to|via)-\$\{/g

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (match) => ' '.repeat(match.length))
}

function ownedSources(): Array<{ file: string; raw: string; stripped: string }> {
  return OWNED_FILES.map((file) => {
    const raw = readFileSync(path.join(REPO_ROOT, file), 'utf8')
    return { file, raw, stripped: stripComments(raw) }
  })
}

beforeAll(() => {
  // jsdom implements neither observer, and its canvas 2D context is a stub
  // that only reports "Not implemented" — the ruler canvases are real DOM
  // nodes, so they get a no-op 2D context to keep the test output honest.
  class ObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', ObserverStub)
  vi.stubGlobal('ResizeObserver', ObserverStub)

  const fake2d = new Proxy(
    {},
    {
      get: (_target, prop) => (prop === 'canvas' ? { width: 0, height: 0 } : () => {}),
      set: () => true,
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => fake2d) as never)
})

beforeEach(() => {
  seedTextLayer()
})

afterEach(() => {
  useStickerBuilderStore.getState().reset()
  vi.clearAllMocks()
})

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('custom sticker builder — desktop layout', () => {
  it('renders the tools, canvas and preview panels', () => {
    renderWithProviders(<CustomStickerPage />)

    expect(screen.getByTestId('builder-panel-tools')).toBeInTheDocument()
    expect(screen.getByTestId('builder-panel-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('builder-panel-preview')).toBeInTheDocument()
  })

  it('carries the grid-paper surface on the canvas area', () => {
    renderWithProviders(<CustomStickerPage />)

    const canvasPanel = screen.getByTestId('builder-panel-canvas')
    expect(canvasPanel.querySelector('[data-testid="canvas-grid-paper"]')).not.toBeNull()
  })
})

describe('custom sticker builder — mobile tab control', () => {
  it('switches between the tools and preview panels', () => {
    renderWithProviders(<CustomStickerPage />)

    // The default tab is `canvas`.
    expect(screen.getByTestId('mobile-panel-canvas')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-panel-preview')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('mobile-tab-tools'))
    expect(screen.getByTestId('mobile-panel-tools')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-panel-canvas')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-panel-preview')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('mobile-tab-preview'))
    expect(screen.getByTestId('mobile-panel-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-panel-tools')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-panel-canvas')).not.toBeInTheDocument()
  })
})

describe('custom sticker builder — source scan', () => {
  it('leaves no legacy class name or token in the owned files', () => {
    const offences = ownedSources().flatMap(({ file, stripped }) =>
      LEGACY_TOKENS.filter((token) => stripped.includes(token)).map((token) => `${file}: ${token}`),
    )
    expect(offences, `legacy classes/tokens remaining:\n${offences.join('\n')}`).toEqual([])
  })

  it('leaves no undefined theme token', () => {
    const offences = ownedSources().flatMap(({ file, stripped }) =>
      Array.from(stripped.matchAll(UNDEFINED_TOKENS)).map(() => `${file}: var(--primary|secondary|light|bg-color)`),
    )
    expect(offences, `undefined tokens remaining:\n${offences.join('\n')}`).toEqual([])
  })

  it('builds no dynamic Tailwind class names', () => {
    const offences = ownedSources().flatMap(({ file, stripped }) => {
      const matches = Array.from(stripped.matchAll(DYNAMIC_INTERPOLATION))
      return matches.map((match) => `${file}: ${match[0]}`)
    })
    expect(offences, `dynamic class interpolation:\n${offences.join('\n')}`).toEqual([])
  })

  it('uses no emoji', () => {
    const offences = ownedSources().flatMap(({ file, raw }) => {
      const matches = Array.from(raw.matchAll(EMOJI))
      return matches.map((match) => `${file}: ${match[0]}`)
    })
    expect(offences, `emoji remaining:\n${offences.join('\n')}`).toEqual([])
  })

  it('hardcodes no colour literal', () => {
    const offences = ownedSources().flatMap(({ file, stripped }) => {
      const matches = Array.from(stripped.matchAll(HEX_LITERAL))
      return matches.map((match) => `${file}: ${match[0]}`)
    })
    expect(offences, `hardcoded colour literals:\n${offences.join('\n')}`).toEqual([])
  })

  it('uses no Button `doodle` variant and no static motionVariants import', () => {
    const offences = ownedSources().flatMap(({ file, stripped }) => {
      const buttonDoodle = /<Button\b[^>]*variant="doodle"/.test(stripped)
        ? ['<Button variant="doodle">']
        : []
      const staticMotion = /\bimport\s*\{[^}]*\bmotionVariants\b/.test(stripped)
        ? ['import { motionVariants }']
        : []
      const motionVariantsUsage = /\bmotionVariants\./.test(stripped) ? ['motionVariants.'] : []
      return [...buttonDoodle, ...staticMotion, ...motionVariantsUsage].map((label) => `${file}: ${label}`)
    })
    expect(offences, `legacy variants/imports:\n${offences.join('\n')}`).toEqual([])
  })
})
