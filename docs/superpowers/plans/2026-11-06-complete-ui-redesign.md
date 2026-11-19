# Complete UI Redesign Implementation Plan

> **SUPERSEDED (marked 2026-11-19):** this MAFTS-era plan (Bangers/Outfit, `--primary #FF6B6B`)
> was replaced the same day by `2026-11-06-bioscope-frontend-rebuild.md` +
> `docs/superpowers/specs/2026-11-06-bioscope-frontend-design.md`, executed under the SDD
> ledger `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/progress.md`. Kept for
> history only — do not dispatch from it. Live continuation:
> `2026-11-19-stability-and-completion.md` + `2026-11-19-completion-and-enhancement.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete redesign of all pages, components, and layout to achieve a cohesive, fun, doodle-styled cartoonish yet modern interactive UI with proper tokenized design system, consistent color combinations, visible text, correct sizing, and delightful animations — all reflecting the "bioscope" sticker shop brand identity.

**Architecture:** Multi-phase approach starting with design token overhaul and core UI primitives, then systematically updating each page/layout. Leverages existing MAFTS design tokens (Bangers/Outfit fonts, --primary #FF6B6B, --secondary #4ECDC4, --accent #FFE66D, --dark #2C3E50) while extending them with proper semantic tokens, motion system, and component variants. Uses ReUI (shadcn-compatible) free components where applicable, custom components for brand-specific patterns.

**Tech Stack:** Next.js 14.2 (App Router), Tailwind CSS, TypeScript, React 18, Framer Motion for complex animations, CSS Variables for theming, lucide-react for icons, next-auth v5, Prisma/PostgreSQL.

**Spec:** DESIGN_TOKENS.md, AGENTS.md, existing codebase at `/home/fahimaloy/Projects/bioscope`

---

## Global Constraints

- **Colors:** Must use CSS variables exclusively — never hardcode hex in components. Extend `:root` in `globals.css` with full semantic token set.
- **Fonts:** Display = `Bangers` (cursive), Body = `Outfit` (300/400/600/800). Import in `layout.tsx`.
- **Border Radius:** Pill = 50px, Card = 20px, Input = 10px (tokens: `rounded-pill`, `rounded-card`, `rounded-input`).
- **Shadows:** Offset shadows with colored offsets (4px/8px) — no blur-only shadows on interactive elements.
- **Animations:** Custom cubic-bezier `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for bounce; `transition-colors` for hover; max 1 entrance animation per view; no stagger on lists >20 items.
- **Assets:** Default product image = `/images/stickers/skull_sticker.png`; Site logo = `/images/bioscope-logo.png`.
- **Accessibility:** WCAG AA contrast, `prefers-reduced-motion`, `prefers-contrast: high`, focus-visible outlines (3px accent).
- **Responsive:** Mobile-first; breakpoints at 640px, 768px, 1024px, 1280px.
- **Code Style:** Server Components by default; `'use client'` only when needed. Server actions in `src/lib/actions/`. Zod schemas in `src/lib/validations/`.
- **No new heavyweight dependencies** — prefer ReUI free components, Framer Motion for animation, CSS for simple transitions.

---

## Review Focus

1. **Color contrast on interactive states** — hover/active/focus/disabled must meet AA on all backgrounds; test with high-contrast mode.
2. **Password toggle icon overflow** — must sit inside input bounds at all sizes; verify on mobile (320px) and with floating labels.
3. **ProductCard sizing** — grid items must not exceed container; image aspect ratio locked; text truncation works.
4. **Animation performance** — no layout thrashing; `transform`/`opacity` only; respect `prefers-reduced-motion`.
5. **Form validation UX** — floating labels don't overlap values; error states clear on input; accessible ARIA.

---

# Phase 0: Design Token System Overhaul

### Task 0.1: Extend CSS Variables with Complete Semantic Token Set

**Files:**
- Modify: `src/app/globals.css:1-50` (extend `:root` block)
- Create: `src/lib/design-tokens.ts` (TypeScript token exports for programmatic access)

**Interfaces:**
- Produces: Complete token object `{ colors, spacing, typography, shadows, borderRadius, animations, zIndex, breakpoints }`

- [ ] **Step 1: Audit current `:root` in globals.css and list missing semantic tokens**

Current has: `--primary`, `--secondary`, `--accent`, `--dark`, `--light`, `--bg-color`, `--ink`, `--error`, `--success`, `--warning`, `--info`, `--purple`, `--font-display`, `--font-body`, shadow tokens.

Missing semantic tokens needed:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-inverse`
- `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-inverse`, `--text-link`
- `--border-primary`, `--border-secondary`, `--border-focus`, `--border-error`
- `--surface`, `--surface-hover`, `--surface-active`, `--surface-elevated`
- `--overlay`, `--overlay-backdrop`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-inner`
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`
- `--transition-fast`, `--transition-base`, `--transition-slow`
- `--font-size-xs` through `--font-size-4xl` with line heights
- `--space-1` through `--space-16` (already in Tailwind but need CSS var equivalents for non-Tailwind contexts)

- [ ] **Step 2: Add complete token set to `:root` in globals.css**

```css
:root {
  /* Existing tokens... */
  
  /* Semantic Backgrounds */
  --bg-primary: var(--bg-color);
  --bg-secondary: #FFFFFF;
  --bg-tertiary: var(--light);
  --bg-inverse: var(--dark);
  --bg-brand: var(--primary);
  --bg-brand-hover: #FF5252;
  --bg-brand-subtle: rgba(255, 107, 107, 0.1);
  
  /* Semantic Text */
  --text-primary: var(--dark);
  --text-secondary: #5D6D7E;
  --text-tertiary: #85929E;
  --text-inverse: #FFFFFF;
  --text-link: var(--primary);
  --text-link-hover: #FF5252;
  --text-on-brand: #FFFFFF;
  
  /* Semantic Borders */
  --border-primary: var(--dark);
  --border-secondary: var(--light);
  --border-focus: var(--primary);
  --border-error: var(--error);
  --border-success: var(--success);
  --border-warning: var(--warning);
  
  /* Semantic Surfaces */
  --surface: #FFFFFF;
  --surface-hover: var(--light);
  --surface-active: #E8ECEF;
  --surface-elevated: #FFFFFF;
  --surface-card: #FFFFFF;
  
  /* Overlay */
  --overlay: rgba(44, 62, 80, 0.5);
  --overlay-backdrop: blur(10px);
  
  /* Shadows - offset style (MAFTS) */
  --shadow-xs: 2px 2px 0px var(--dark);
  --shadow-sm: 4px 4px 0px var(--dark);
  --shadow-md: 6px 6px 0px var(--secondary);
  --shadow-lg: 8px 8px 0px var(--secondary);
  --shadow-xl: 12px 12px 0px var(--primary);
  --shadow-inner: inset 2px 2px 0px var(--dark);
  --shadow-input: 4px 4px 0px var(--primary);
  --shadow-glass: 0 4px 30px rgba(0, 0, 0, 0.05);
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 50px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --transition-base: 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --transition-slow: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --transition-colors: 200ms ease;
  
  /* Typography Scale */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */
  --font-size-6xl: 3.5rem;    /* 56px */
  --font-size-7xl: 4.5rem;    /* 72px */
  --font-size-8xl: 6rem;      /* 96px */
  --font-size-9xl: 8rem;      /* 128px */
  
  --line-height-tight: 1.1;
  --line-height-snug: 1.375;
  --line-height-normal: 1.6;
  --line-height-relaxed: 1.75;
  
  /* Z-Index Scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
}
```

- [ ] **Step 3: Add high-contrast and dark mode overrides in globals.css**

```css
@media (prefers-contrast: high) {
  :root {
    --primary: #CC0000;
    --secondary: #008080;
    --accent: #CC9900;
    --dark: #000000;
    --light: #CCCCCC;
    --bg-color: #FFFFFF;
    --ink: #000000;
    --error: #CC0000;
    --success: #008000;
    --warning: #CC9900;
    --info: #0000CC;
    --purple: #660099;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1A1A1A;
    --bg-secondary: #242424;
    --bg-tertiary: #2D2D2D;
    --bg-inverse: #FFFFFF;
    --text-primary: #F5F5F5;
    --text-secondary: #BDBDBD;
    --text-tertiary: #8E8E8E;
    --text-inverse: #1A1A1A;
    --surface: #242424;
    --surface-hover: #2D2D2D;
    --surface-active: #383838;
    --surface-elevated: #2D2D2D;
    --surface-card: #242424;
    --border-primary: #FFFFFF;
    --border-secondary: #404040;
    --border-focus: var(--primary);
    --shadow-xs: 2px 2px 0px #FFFFFF;
    --shadow-sm: 4px 4px 0px #FFFFFF;
    --shadow-md: 6px 6px 0px var(--secondary);
    --shadow-lg: 8px 8px 0px var(--secondary);
    --shadow-xl: 12px 12px 0px var(--primary);
    --shadow-inner: inset 2px 2px 0px #FFFFFF;
  }
}
```

- [ ] **Step 4: Create `src/lib/design-tokens.ts` with typed token exports**

```typescript
export const designTokens = {
  colors: {
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    accent: 'var(--accent)',
    dark: 'var(--dark)',
    light: 'var(--light)',
    bgColor: 'var(--bg-color)',
    ink: 'var(--ink)',
    error: 'var(--error)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    info: 'var(--info)',
    purple: 'var(--purple)',
    // Semantic
    bg: { primary: 'var(--bg-primary)', secondary: 'var(--bg-secondary)', ... },
    text: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', ... },
    border: { primary: 'var(--border-primary)', focus: 'var(--border-focus)', ... },
    surface: { base: 'var(--surface)', hover: 'var(--surface-hover)', ... },
  },
  spacing: { ... },
  typography: { ... },
  shadows: { ... },
  borderRadius: { ... },
  transitions: { ... },
  zIndex: { ... },
} as const;

export type DesignTokens = typeof designTokens;
```

- [ ] **Step 5: Update tailwind.config.ts to map all new semantic tokens**

```typescript
colors: {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  ink: 'var(--ink)',
  light: 'var(--light)',
  bg: 'var(--bg-color)',
  // Semantic
  'bg-primary': 'var(--bg-primary)',
  'bg-secondary': 'var(--bg-secondary)',
  'bg-tertiary': 'var(--bg-tertiary)',
  'bg-brand': 'var(--bg-brand)',
  'bg-brand-hover': 'var(--bg-brand-hover)',
  'bg-brand-subtle': 'var(--bg-brand-subtle)',
  'text-primary': 'var(--text-primary)',
  'text-secondary': 'var(--text-secondary)',
  'text-tertiary': 'var(--text-tertiary)',
  'text-inverse': 'var(--text-inverse)',
  'text-link': 'var(--text-link)',
  'border-primary': 'var(--border-primary)',
  'border-focus': 'var(--border-focus)',
  'border-error': 'var(--border-error)',
  'surface': 'var(--surface)',
  'surface-hover': 'var(--surface-hover)',
  'surface-card': 'var(--surface-card)',
},
```

- [ ] **Step 6: Verify all tokens work — run `pnpm dev` and inspect computed styles in DevTools**

Run: `pnpm dev` → open browser → inspect root element → verify all CSS variables present and correct.

---

### Task 0.2: Create Motion/Animation Token System

**Files:**
- Modify: `src/app/globals.css` (add animation keyframes and utility classes)
- Create: `src/lib/motion.ts` (Framer Motion variants and presets)

**Interfaces:**
- Produces: `motionVariants` object with named variants for entrance, hover, tap, focus, exit

- [ ] **Step 1: Add comprehensive animation keyframes to globals.css**

```css
/* Entrance Animations */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes slide-in-right { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slide-in-left { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

/* Doodle-specific */
@keyframes wobble { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes pulse-soft { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Staggered letter reveal (MAFTS) */
@keyframes reveal-letter { 
  from { opacity: 0; transform: translateY(50px) rotate(-10deg); } 
  to { opacity: 1; transform: translateY(0) rotate(0); } 
}

/* Shimmer for loading */
@keyframes shimmer { 
  0% { background-position: -200% 0; } 
  100% { background-position: 200% 0; } 
}

/* Utility Classes */
.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-fade-in-up { animation: fade-in-up 0.4s var(--transition-base); }
.animate-fade-in-down { animation: fade-in-down 0.4s var(--transition-base); }
.animate-scale-in { animation: scale-in 0.3s var(--transition-base); }
.animate-slide-in-right { animation: slide-in-right 0.3s var(--transition-base); }
.animate-slide-in-left { animation: slide-in-left 0.3s var(--transition-base); }
.animate-wobble { animation: wobble 0.5s ease-in-out; }
.animate-float-gentle { animation: float-gentle 3s ease-in-out infinite; }
.animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
.animate-rotate-slow { animation: rotate-slow 20s linear infinite; }

/* Stagger delays for children */
.stagger-1 > * { animation-delay: 0ms; }
.stagger-2 > * { animation-delay: 100ms; }
.stagger-3 > * { animation-delay: 200ms; }
.stagger-4 > * { animation-delay: 300ms; }
.stagger-5 > * { animation-delay: 400ms; }
```

- [ ] **Step 2: Create Framer Motion variant presets in `src/lib/motion.ts`**

```typescript
import { Variants } from 'framer-motion';

export const motionVariants = {
  // Entrance
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } },
  fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  fadeInDown: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 }, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  scaleIn: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  slideInRight: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  slideInLeft: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  
  // Doodle-specific
  wobble: { animate: { rotate: [-3, 3, -3, 0] }, transition: { duration: 0.5, ease: 'easeInOut' } },
  float: { animate: { y: [0, -8, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  pulseSoft: { animate: { scale: [1, 1.02, 1] }, transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
  bounceIn: { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  
  // Interactive
  hoverLift: { scale: 1.02, y: -4, boxShadow: 'var(--shadow-xl)', transition: { type: 'spring', stiffness: 300, damping: 20 } },
  hoverScale: { scale: 1.05, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  tapPress: { scale: 0.98, transition: { duration: 0.1 } },
  focusRing: { boxShadow: '0 0 0 3px var(--accent)', transition: { duration: 0.2 } },
  
  // Stagger container
  staggerContainer: { animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } },
  staggerItem: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  
  // Page transitions
  pageEnter: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] } },
} as const;

export type MotionVariantKey = keyof typeof motionVariants;
```

- [ ] **Step 3: Add reduced-motion guards to all animations**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .animate-float-gentle, .animate-pulse-soft, .animate-rotate-slow {
    animation: none !important;
  }
}
```

---

### Task 0.3: Create Doodle Decorative System

**Files:**
- Create: `src/components/decorative/DoodleElements.tsx` (reusable doodle components)
- Create: `src/components/decorative/DoodleBackground.tsx` (animated background shapes)
- Modify: `src/components/decorative/DoodleScatter.tsx` (enhance existing)

**Interfaces:**
- Consumes: design tokens, motion variants
- Produces: `<DoodleShape />`, `<DoodleScribble />`, `<DoodleStar />`, `<WashiTape />`, `<StickerPeel />`, `<TornEdge />`, `<SketchUnderline />`, `<DoodleBackground />`

- [ ] **Step 1: Create DoodleElements.tsx with SVG-based decorative components**

```tsx
// DoodleShape - organic blob shapes
export function DoodleShape({ 
  className, 
  size = 'md', 
  color = 'primary', 
  animation = 'float',
  ...props 
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'ink';
  animation?: 'float' | 'wobble' | 'pulse' | 'rotate' | 'none';
}) {
  const sizes = { sm: 60, md: 120, lg: 200, xl: 300 };
  const animations = {
    float: 'animate-float-gentle',
    wobble: 'animate-wobble',
    pulse: 'animate-pulse-soft',
    rotate: 'animate-rotate-slow',
    none: '',
  };
  
  // Generate organic SVG path
  const pathData = `M${size * 0.5},0 
    C${size * 0.8},${size * 0.1} ${size * 0.9},${size * 0.4} ${size},${size * 0.5}
    C${size * 0.9},${size * 0.6} ${size * 0.8},${size * 0.9} ${size * 0.5},${size}
    C${size * 0.2},${size * 0.9} ${size * 0.1},${size * 0.6} 0,${size * 0.5}
    C${size * 0.1},${size * 0.4} ${size * 0.2},${size * 0.1} ${size * 0.5},0`;
  
  return (
    <svg 
      width={sizes[size]} 
      height={sizes[size]} 
      viewBox={`0 0 ${sizes[size]} ${sizes[size]}`}
      className={cn('text-[var(--', color, ')]', animations[animation], className)}
      aria-hidden="true"
      {...props}
    >
      <path d={pathData} fill="currentColor" fillOpacity={0.15} />
    </svg>
  );
}

// WashiTape - decorative tape strip
export function WashiTape({ 
  children, 
  rotation = -2, 
  width = 140, 
  height = 28,
  className 
}: {
  children?: React.ReactNode;
  rotation?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        'relative',
        'bg-gradient-to-r from-[var(--accent)] to-[var(--pink)]',
        'border-2 border-[var(--ink)]',
        'shadow-[2px_2px_0_var(--ink)]',
        className
      )}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`
      }}
    >
      {children}
    </div>
  );
}

// StickerPeel - corner peel effect
export function StickerPeel({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute top-[-4px] right-[-4px] w-4.5 h-4.5 bg-[var(--primary)] border-2 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)]" />
    </div>
  );
}

// TornEdge - paper tear effect
export function TornEdge({ position = 'top', className }: { position?: 'top' | 'bottom'; className?: string }) {
  const clipPaths = {
    top: 'polygon(0 0, 100% 0, 100% 92%, 92% 100%, 8% 92%, 0 100%)',
    bottom: 'polygon(0 0, 100% 0, 100% 100%, 92% 100%, 8% 92%, 0 92%)',
  };
  return (
    <div 
      className={cn('relative', className)}
      style={{ clipPath: clipPaths[position] }}
    />
  );
}

// SketchUnderline - hand-drawn underline
export function SketchUnderline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <span className="absolute bottom-[-4px] left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--pink)] rounded-[9999px_4px] opacity-70" />
    </span>
  );
}
```

- [ ] **Step 2: Create DoodleBackground.tsx with animated floating shapes**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DoodleShape } from './DoodleElements';

export function DoodleBackground({ 
  shapeCount = 8, 
  className,
  interactive = false 
}: {
  shapeCount?: number;
  className?: string;
  interactive?: boolean;
}) {
  const shapesRef = useRef<Array<{ 
    x: number; y: number; size: 'sm' | 'md' | 'lg'; color: string; delay: number; duration: number; 
  }>>([]);
  
  useEffect(() => {
    const colors = ['primary', 'secondary', 'accent', 'ink'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;
    
    shapesRef.current = Array.from({ length: shapeCount }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 15,
    }));
  }, [shapeCount]);
  
  return (
    <div 
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {shapesRef.current.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ 
            left: `${shape.x}%`, 
            top: `${shape.y}%`,
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <DoodleShape size={shape.size} color={shape.color} animation="none" />
        </motion.div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Enhance DoodleScatter.tsx to use new system**

```tsx
// Modify existing DoodleScatter to accept DoodleBackground props
export function DoodleScatter({ 
  count = 6, 
  className,
  interactive = false 
}: {
  count?: number;
  className?: string;
  interactive?: boolean;
}) {
  return <DoodleBackground shapeCount={count} className={className} interactive={interactive} />;
}
```

---

### Task 0.4: Update Core UI Primitives to Use New Token System

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Select.tsx`
- Modify: `src/components/ui/Checkbox.tsx`
- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Dropdown.tsx`
- Modify: `src/components/ui/Tabs.tsx`
- Modify: `src/components/ui/Tooltip.tsx`
- Modify: `src/components/ui/Skeleton.tsx`
- Modify: `src/components/ui/Pagination.tsx`

**Interfaces:**
- Consumes: design tokens, motion variants
- Produces: Updated components with consistent styling, proper focus states, doodle variants

- [ ] **Step 1: Update Button.tsx with new variants and doodle styling**

```tsx
// Add doodle variant
const variantStyles = {
  // ... existing
  doodle: 'bg-[var(--primary)] text-white border-[var(--ink)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active relative overflow-hidden',
  'doodle-secondary': 'bg-[var(--accent)] text-[var(--ink)] border-[var(--ink)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active relative overflow-hidden',
  'doodle-outline': 'bg-transparent border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--primary)] hover:text-white hover:border-primary relative overflow-hidden',
};

// Add sticker-peel effect for doodle variants
// In render, conditionally add <StickerPeel /> for doodle variants
```

- [ ] **Step 2: Fix Input.tsx password toggle positioning**

```tsx
// Current issue: icon positioned at `top-[38px]` which breaks with floating label
// Fix: Use flex container with proper alignment

// Change the input wrapper to:
<div className="relative flex items-center">
  <input 
    className={cn(
      'w-full bg-transparent transition-all duration-300',
      'border-2 rounded-input',
      'placeholder:text-transparent',
      'focus:outline-none focus:border-primary focus:shadow-input',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      'text-body text-[var(--ink)]',
      'py-3 px-4',  // consistent padding
      iconPosition === 'left' && 'pl-12',
      iconPosition === 'right' && 'pr-12',
      // ...
    )}
  />
  {icon && iconPosition === 'right' && (
    <button
      type="button"
      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 hover:text-primary transition-colors p-1"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {icon}
    </button>
  )}
</div>
```

- [ ] **Step 3: Update Card.tsx with doodle variant and proper shadows**

```tsx
const variantStyles = {
  default: 'bg-[var(--surface-card)] border-3 border-[var(--border-primary)] shadow-card hover:shadow-card-hover',
  elevated: 'bg-[var(--surface-elevated)] border-3 border-[var(--border-primary)] shadow-xl hover:shadow-xl',
  outlined: 'bg-transparent border-3 border-[var(--border-primary)] hover:border-primary',
  doodle: 'bg-[var(--surface-card)] border-3 border-[var(--ink)] shadow-card hover:shadow-card-hover relative',
  'doodle-elevated': 'bg-[var(--surface-card)] border-3 border-[var(--ink)] shadow-xl hover:shadow-card-hover relative',
};

// Add StickerPeel for doodle variants
```

- [ ] **Step 4: Update Badge.tsx with new semantic color tokens**

```tsx
const variantStyles = {
  primary: 'bg-[var(--primary)] text-white',
  secondary: 'bg-[var(--secondary)] text-white',
  accent: 'bg-[var(--accent)] text-[var(--ink)]',
  success: 'bg-[var(--success)] text-white',
  warning: 'bg-[var(--warning)] text-[var(--ink)]',
  error: 'bg-[var(--error)] text-white',
  info: 'bg-[var(--info)] text-white',
  outline: 'bg-transparent border-2 border-[var(--border-primary)] text-[var(--text-primary)]',
  doodle: 'bg-[var(--primary)] text-white border-2 border-[var(--ink)] shadow-btn',
};
```

- [ ] **Step 5: Add focus-visible styles to all interactive components**

```tsx
// Universal focus style:
'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]'
```

- [ ] **Step 6: Run type-check and verify no regressions**

Run: `pnpm type-check` → expect no errors.
Run: `pnpm test:run` → expect all unit tests pass.

---

# Phase 1: Layout & Navigation Overhaul

### Task 1.1: Redesign Navbar with Brand Logo and Doodle Styling

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/app/(customer)/layout.tsx` (if needed for padding-top)

**Interfaces:**
- Consumes: design tokens, auth context, cart store, ui store
- Produces: Updated Navbar with logo image, doodle styling, proper mobile UX

- [ ] **Step 1: Replace text logo with bioscope-logo.png**

```tsx
<Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
  <Image
    src="/images/bioscope-logo.png"
    alt="bioscope"
    width={120}
    height={40}
    className="h-10 w-auto"
    priority
  />
</Link>
```

- [ ] **Step 2: Apply doodle styling to nav links**

```tsx
// Add staggered entrance animation on mount
// Use motionVariants.fadeInUp with stagger for nav links
// Add wobble hover effect on nav links
```

- [ ] **Step 3: Fix mobile menu - add doodle background, proper animations**

```tsx
// Use AnimatePresence from framer-motion for enter/exit
// Add DoodleBackground to mobile menu backdrop
// Stagger menu items with motionVariants.staggerItem
```

- [ ] **Step 4: Update cart badge with bounce animation on count change**

```tsx
// Use motionVariants.bounceIn for badge when itemCount changes
// Add <StickerPeel /> to cart button for doodle feel
```

- [ ] **Step 5: Ensure glass-morphism uses new semantic tokens**

```tsx
// Update className to use bg-[var(--surface-card)]/90 backdrop-blur-md
// Border: border-[var(--border-secondary)]
// Shadow: shadow-glass
```

- [ ] **Step 6: Test responsive behavior at 320px, 768px, 1024px**

---

### Task 1.2: Create Global Layout Wrapper with Doodle Background

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/PageWrapper.tsx`

**Interfaces:**
- Consumes: children, optional background variant
- Produces: Consistent page structure with optional DoodleBackground

- [ ] **Step 1: Create PageWrapper component**

```tsx
interface PageWrapperProps {
  children: React.ReactNode;
  background?: 'default' | 'doodle' | 'grid' | 'none';
  className?: string;
}

export function PageWrapper({ children, background = 'doodle', className }: PageWrapperProps) {
  return (
    <div className={cn('min-h-screen bg-[var(--bg-primary)] relative', className)}>
      {background === 'doodle' && <DoodleBackground shapeCount={6} />}
      {background === 'grid' && <GridBackground />}
      <main className="relative z-10 pt-16 pb-12">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Update layout.tsx to use PageWrapper**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body text-[var(--text-primary)] bg-[var(--bg-primary)] antialiased">
        <Navbar />
        <PageWrapper background="doodle">{children}</PageWrapper>
        <Footer />
      </body>
    </html>
  );
}
```

---

### Task 1.3: Create Footer Component

**Files:**
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx` (import Footer)

**Interfaces:**
- Produces: Footer with brand links, social icons, newsletter signup, doodle accents

- [ ] **Step 1: Create Footer with doodle styling**

```tsx
// Sections: Brand, Shop Links, Support, Legal, Newsletter
// Use DoodleScatter at top
// WashiTape decorative element
// SketchUnderline on section titles
// Social icons with hover bounce
// Newsletter input with floating label
```

---

# Phase 2: Customer Pages Redesign

### Task 2.1: Redesign Home Page (/)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: PageWrapper, Button, Badge, DoodleScatter, ProductCard (for featured)
- Produces: Fully redesigned home page

- [ ] **Step 1: Hero section - staggered title with Bangers font**

```tsx
// Use .staggered-title class from globals.css
// Each letter wrapped in span with animation-delay
// Add DoodleScatter + floating emojis
// CTA buttons with doodle variants + StickerPeel
// Trust badges with sketch-underline
```

- [ ] **Step 2: Marquee - enhance with doodle icons**

```tsx
// Keep existing marquee but add emoji/icons between items
// Use DoodleStar or custom SVG icons
```

- [ ] **Step 3: Featured section - use ProductCard with proper sizing**

```tsx
// Replace hardcoded cards with <ProductCard variant="featured" />
// Grid: 1 col mobile, 2 tablet, 3 desktop
// Add "View All" link with doodle button
```

- [ ] **Step 4: How It Works - numbered steps with doodle illustrations**

```tsx
// Use Bangers for large numbers (01, 02, 03)
// Each step in doodle card with StickerPeel
// Custom SVG illustrations for each step
```

- [ ] **Step 5: CTA section - doodle card with torn edge**

```tsx
// Use TornEdge on background
// WashiTape accent
// Button with pulse-soft animation
```

---

### Task 2.2: Redesign Shop Page (/shop)

**Files:**
- Modify: `src/app/(customer)/shop/page.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/product/ProductGrid.tsx`

**Interfaces:**
- Consumes: Updated ProductCard, ProductGrid, Pagination, Button, Badge, Select
- Produces: Redesigned shop with proper grid sizing, filters, animations

- [ ] **Step 1: Fix ProductCard sizing - constrain image aspect ratio**

```tsx
// Image container: aspect-square, overflow-hidden
// Image: object-cover, fixed height per variant
// default: h-64 (256px), compact: h-16, featured: aspect-[4/5]
// Content area: flex-1, min-height-0 for truncation
```

- [ ] **Step 2: Redesign filter toolbar with doodle styling**

```tsx
// Category pills: use Button variant="doodle-outline" with active="doodle"
// Sort dropdown: custom styled Select with doodle arrow
// View toggle: Button group with doodle styling
// Add animation on filter change
```

- [ ] **Step 3: ProductGrid - responsive columns with proper gaps**

```tsx
// grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
// gap-6 (24px) consistent
// Add stagger entrance animation on load
// Skeleton loaders match card dimensions exactly
```

- [ ] **Step 4: Empty state - doodle illustration**

```tsx
// Use DoodleShape + friendly message
// CTA button to clear filters
```

- [ ] **Step 5: Pagination - doodle styled**

```tsx
// Buttons with pill radius, offset shadows
// Active state: bg-primary with sticker-peel
// Ellipsis with subtle styling
```

---

### Task 2.3: Redesign Product Detail Page (/shop/[slug])

**Files:**
- Modify: `src/app/(customer)/shop/[slug]/page.tsx`
- Modify: `src/components/product/ProductDetail.tsx`
- Modify: `src/components/product/DimensionSelector.tsx`
- Modify: `src/components/product/QuantitySelector.tsx`
- Modify: `src/components/product/ProductConfigurator.tsx`

**Interfaces:**
- Consumes: Updated UI primitives, ProductCard (for related), ReviewList
- Produces: Redesigned product page with image gallery, configurator, reviews

- [ ] **Step 1: Image gallery with thumbnail strip and zoom**

```tsx
// Main image: large, aspect-square, hover zoom
// Thumbnails: horizontal scroll, active border-primary
// Lightbox on click (modal with keyboard nav)
// Use skull_sticker.png as fallback
```

- [ ] **Step 2: Product info - typography hierarchy**

```tsx
// Category badge: doodle variant
// Title: Bangers, text-3xl md:text-4xl, text-primary
// Price: Bangers, text-4xl, text-primary with compareAtPrice line-through
// Description: Outfit, text-lg, text-secondary, leading-relaxed
```

- [ ] **Step 3: DimensionSelector - visual size chips with doodle style**

```tsx
// Each dimension: Button variant="doodle-outline" or "doodle" when selected
// Show price multiplier
// Default dimension pre-selected with pulse-soft
```

- [ ] **Step 4: QuantitySelector - animated stepper**

```tsx
// Button group: minus | input | plus
// Input: centered, width-auto, min-w-[3rem]
// Buttons: doodle variant, hover lift
// Max stock validation with shake animation
```

- [ ] **Step 5: Add to Cart button - prominent with StickerPeel**

```tsx
// Full width on mobile, auto on desktop
// Size xl, variant doodle
// Loading state with spinner
// Success animation: checkmark + bounce
```

- [ ] **Step 6: Related products - horizontal scroll**

```tsx
// ProductCard variant="compact" in flex overflow-x-auto
// Snap points, hide scrollbar
// "View All" link at end
```

---

### Task 2.4: Redesign Login Page (/login)

**Files:**
- Modify: `src/app/(customer)/login/page.tsx`

**Interfaces:**
- Consumes: Updated Input, Button, Card, DoodleScatter
- Produces: Redesigned login form with fixed password toggle

- [ ] **Step 1: Fix password toggle icon overflow**

```tsx
// Already addressed in Task 0.4 Step 2
// Verify: icon inside input bounds at all sizes
// Add show/hide animation (rotate 180deg)
```

- [ ] **Step 2: Apply doodle styling to form**

```tsx
// Card: variant="doodle-elevated" with StickerPeel
// Title: Bangers, text-primary
// Inputs: floating labels with primary color on focus
// Button: variant="doodle", size="xl", fullWidth
// Links: text-primary with sketch-underline on hover
```

- [ ] **Step 3: Add doodle background elements**

```tsx
// DoodleScatter count={4}
// Floating emoji decorations
// WashiTape accent on card
```

- [ ] **Step 4: Error state - doodle alert**

```tsx
// Red border, shake animation on appear
// Dismissible with slide-out
```

---

### Task 2.5: Redesign Register Page (/register)

**Files:**
- Modify: `src/app/(customer)/register/page.tsx`

**Interfaces:**
- Consumes: Same as Login
- Produces: Consistent register form

- [ ] **Step 1: Apply same fixes as Login page**

- [ ] **Step 2: Password strength indicator**

```tsx
// Visual meter below password input
// 4 segments, colored by strength (error→warning→success)
// Animated fill
```

- [ ] **Step 3: Confirm password - match validation**

```tsx
// Real-time match check
// Green checkmark when matching
// Error state with shake
```

---

### Task 2.6: Redesign Cart Page (/cart)

**Files:**
- Modify: `src/app/(customer)/cart/page.tsx`
- Modify: `src/components/cart/CartItem.tsx`
- Modify: `src/components/cart/CartSummary.tsx`

**Interfaces:**
- Consumes: Updated UI primitives, ProductCard (compact variant)
- Produces: Redesigned cart with better UX

- [ ] **Step 1: CartItem - compact product display**

```tsx
// Use ProductCard variant="compact"
// Quantity selector inline
// Remove button with trash icon, hover shake
// Price breakdown: base × qty = line total
```

- [ ] **Step 2: CartSummary - doodle card with clear totals**

```tsx
// Subtotal, Tax, Delivery, Discount, Total
// Each row: label (text-secondary) | value (text-primary, Bangers for total)
// Free delivery progress bar (animated)
// Checkout button: variant="doodle", size="xl", StickerPeel
```

- [ ] **Step 3: Empty cart - doodle illustration**

```tsx
// DoodleShape + friendly message
// "Continue Shopping" button
```

---

### Task 2.7: Redesign Checkout Page (/checkout)

**Files:**
- Modify: `src/app/(customer)/checkout/page.tsx`
- Modify: `src/components/checkout/AddressForm.tsx`
- Modify: `src/components/checkout/PaymentMethod.tsx`
- Modify: `src/components/checkout/OrderSummary.tsx`
- Modify: `src/components/checkout/OrderConfirmation.tsx`

**Interfaces:**
- Consumes: Updated UI primitives, AddressForm, PaymentMethod
- Produces: Multi-step checkout with progress indicator

- [ ] **Step 1: Progress stepper - doodle styled**

```tsx
// 4 steps: Address → Payment → Review → Confirmation
// Connectors: dashed line, active step fills
// Step circles: Bangers numbers, doodle colors
// Completed: checkmark with bounce
// Current: pulse-soft
```

- [ ] **Step 2: AddressForm - doodle cards for each address**

```tsx
// Radio card selection with border-primary when selected
// Add new address: inline form with floating labels
// Save checkbox with doodle styling
```

- [ ] **Step 3: PaymentMethod - visual payment cards**

```tsx
// COD: doodle card with truck icon
// Online: card with shield icon
// Selected: border-primary, shadow-card-hover
// Icons with float-gentle animation
```

- [ ] **Step 4: OrderSummary - sticky sidebar**

```tsx
// Sticky on scroll (lg:sticky top-24)
// Doodle card with torn edge
// Item list with thumbnail, name, qty, price
// Totals with Bangers for total
```

- [ ] **Step 5: OrderConfirmation - celebration animation**

```tsx
// Confetti burst on mount (canvas-confetti or CSS)
// Order number: Bangers, large, text-primary
// Summary card with doodle styling
// "Continue Shopping" button with StickerPeel
```

---

### Task 2.8: Redesign Custom Sticker Page (/custom-sticker)

**Files:**
- Modify: `src/app/(customer)/custom-sticker/page.tsx`
- Modify: `src/components/custom-sticker/*.tsx` (StickerCanvas, UploadZone, EditingTools, DimensionControls, ColorAdjustments, PreviewPanel, LayerPanel)

**Interfaces:**
- Consumes: Updated UI primitives, fabric.js canvas
- Produces: Redesigned builder with better panel layout

- [ ] **Step 1: Layout - responsive 3-panel → stacked on mobile**

```tsx
// lg: 3-col (tools | canvas | preview)
// md: 2-col (tools+canvas | preview) with collapsible tools
// mobile: tabs for Tools / Canvas / Preview
// Use motionVariants.slideInLeft/Right for panel transitions
```

- [ ] **Step 2: Header - sticky with live price preview**

```tsx
// Material/Finish/Cut badges: doodle variant
// Quantity input with stepper
// Live price: Bangers, text-primary, pulse-soft on change
```

- [ ] **Step 3: Tools panel - accordion sections**

```tsx
// Upload, Editing, Layers, Settings as accordion items
// Each: SketchUnderline title, doodle cards
// Active: border-primary, open by default
```

- [ ] **Step 4: Canvas area - rulers, grid, zoom controls**

```tsx
// Rulers: top/left with cm marks
// Grid: toggle, snap-to-grid
// Zoom: +/- buttons, %, reset, fit-to-screen
// Canvas border: 3px ink with StickerPeel corner
```

- [ ] **Step 5: Preview panel - realistic mockup**

```tsx
// 3D sticker mockup (CSS transform)
// Material texture preview (vinyl shine, holographic shift)
// Cut line preview (kiss-cut vs die-cut)
// Download/Share buttons: doodle variant
```

- [ ] **Step 6: Request Quote - prominent CTA**

```tsx
// Fixed bottom on mobile, sticky on desktop
// Button: variant="doodle", size="xl", StickerPeel
// Loading: spinner + "Preparing..."
```

---

### Task 2.9: Redesign Profile Page (/profile)

**Files:**
- Modify: `src/app/(customer)/profile/page.tsx`

**Interfaces:**
- Consumes: Updated UI primitives, AddressForm
- Produces: Profile with tabs for Account, Addresses, Settings

- [ ] **Step 1: Tabbed layout with doodle tabs**

```tsx
// Tabs: Account | Addresses | Notifications | Security
// Tab trigger: variant="doodle" when active
// Staggered content entrance
```

- [ ] **Step 2: Account form - floating labels, avatar upload**

```tsx
// Avatar: circular, hover edit pencil
// Name, Email, Phone with floating labels
// Save button: doodle variant
```

- [ ] **Step 3: Addresses - card list with actions**

```tsx
// Each address: doodle card, default badge
// Edit/Delete/Set Default buttons
// Add new: inline form
```

---

### Task 2.10: Redesign Orders Pages (/orders, /orders/[id])

**Files:**
- Modify: `src/app/(customer)/orders/page.tsx`
- Modify: `src/app/(customer)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: Updated UI primitives, Badge, Button
- Produces: Order history and detail pages

- [ ] **Step 1: Orders list - card per order**

```tsx
// Card with: Order #, Date, Status badge, Total, Items count
// Status badge: doodle variant per status (pending=accent, processing=primary, shipped=secondary, delivered=success, cancelled=error)
// Hover: lift, expand to show items preview
// Click: navigate to detail
```

- [ ] **Step 2: Order detail - timeline**

```tsx
// Vertical timeline with dots and connectors
// Each step: icon, title, timestamp, description
// Current step: pulse-soft
// Items list with thumbnails
// Actions: Reorder, Download Invoice, Contact Support
```

---

### Task 2.11: Redesign About & Contact Pages

**Files:**
- Modify: `src/app/(customer)/about/page.tsx`
- Modify: `src/app/(customer)/contact/page.tsx`

**Interfaces:**
- Produces: Branded content pages

- [ ] **Step 1: About - story with doodle illustrations**

```tsx
// Hero with staggered title
// Sections: Our Story, Materials, Team, Values
// Each section: DoodleBackground, WashiTape accents
// Team cards: doodle variant with StickerPeel
```

- [ ] **Step 2: Contact - form with doodle styling**

```tsx
// Form in doodle card with torn edge
// Floating labels, floating emoji on focus
// Submit: doodle button with StickerPeel
// Success: confetti + toast
```

---

# Phase 3: Admin Pages Redesign

### Task 3.1: Redesign Admin Layout & Sidebar

**Files:**
- Modify: `src/app/(admin)/layout.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

**Interfaces:**
- Consumes: auth (admin), navigation config
- Produces: Admin layout with collapsible sidebar

- [ ] **Step 1: Sidebar - doodle navigation items**

```tsx
// Logo: bioscope-logo.png
// Nav items: icon + label, hover lift + color change
// Active: bg-primary/10, border-l-4 border-primary
// Badges on items (pending counts) with pulse-soft
// Collapse: smooth width transition, icon-only mode
// Footer: user avatar, logout
```

- [ ] **Step 2: Header - breadcrumb + actions**

```tsx
// Breadcrumb with sketch-underline on current
// User menu with doodle dropdown
// Theme toggle (if implemented)
```

---

### Task 3.2: Redesign Admin Dashboard

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`
- Modify: `src/components/admin/StatsCards.tsx`

**Interfaces:**
- Consumes: Updated Card, Badge, Button, Chart components
- Produces: Dashboard with stat cards, charts, activity feed

- [ ] **Step 1: Stat cards - doodle variant with counters**

```tsx
// 4 cards: Orders, Revenue, Products, Customers
// Icon with float-gentle
// Value: Bangers, animated counter (motionVariants)
// Trend: up/down with color, sketch-underline
// Hover: lift + StickerPeel
```

- [ ] **Step 2: Revenue chart - doodle styled**

```tsx
// Area chart with gradient fill (primary→accent)
// Dots on hover with tooltip
// Grid lines: light, dashed
// Animation on mount: draw path
```

- [ ] **Step 3: Activity feed - timeline**

```tsx
// Same as customer orders timeline
// Icons per type: order=package, custom=sparkles
// Relative timestamps
```

---

### Task 3.3: Redesign Admin Products Page

**Files:**
- Modify: `src/app/(admin)/admin/products/page.tsx`
- Modify: `src/components/admin/ProductForm.tsx`
- Modify: `src/components/admin/ProductPreview.tsx`

**Interfaces:**
- Consumes: Updated DataTable, Modal, Form components
- Produces: Product management with inline editing

- [ ] **Step 1: DataTable - doodle styled**

```tsx
// Header: bg-tertiary, border-b-2 border-primary
// Rows: hover bg-surface-hover
// Actions: icon buttons with hover lift
// Pagination: doodle styled
// Empty: doodle illustration
```

- [ ] **Step 2: ProductForm - modal with tabs**

```tsx
// Tabs: Basic, Images, Variants, SEO, Advanced
// Each tab: doodle card
// Image upload: drag-drop zone with doodle border
// Dimension matrix: editable table
// Save: doodle button with StickerPeel
```

---

### Task 3.4: Redesign Admin Orders Page

**Files:**
- Modify: `src/app/(admin)/admin/orders/page.tsx`

**Interfaces:**
- Consumes: Updated DataTable, Badge, Button, Modal
- Produces: Order management with status workflow

- [ ] **Step 1: Orders table with status actions**

```tsx
// Status badge: dropdown with canTransition() validation
// Invalid transitions: disabled with tooltip
// Row click: expand for items + timeline
// Bulk actions: checkbox column, floating bar
```

---

### Task 3.5: Redesign Admin Custom Requests Page

**Files:**
- Modify: `src/app/(admin)/admin/custom-requests/page.tsx`

**Interfaces:**
- Consumes: Updated DataTable, Modal, ImagePreview
- Produces: Custom request review with pricing

- [ ] **Step 1: Request card with image preview**

```tsx
// Thumbnail, dimensions, material, quantity
// Price input with Bangers font
// Approve/Reject buttons: doodle variants
// Notes field for admin
```

---

### Task 3.6: Redesign Admin Analytics & Settings Pages

**Files:**
- Modify: `src/app/(admin)/admin/analytics/page.tsx`
- Modify: `src/app/(admin)/admin/settings/page.tsx`
- Modify: `src/app/(admin)/admin/customers/page.tsx`

**Interfaces:**
- Produces: Consistent admin pages

- [ ] **Step 1: Analytics - charts with doodle styling**

- [ ] **Step 2: Settings - form sections in doodle cards**

- [ ] **Step 3: Customers - table with doodle badges**

---

# Phase 4: Polish & Cross-Cutting Concerns

### Task 4.1: Global Loading & Error States

**Files:**
- Create: `src/components/ui/GlobalLoading.tsx`
- Create: `src/components/ui/ErrorBoundary.tsx`
- Modify: `src/app/global-error.tsx`
- Modify: `src/app/loading.tsx`

**Interfaces:**
- Produces: Consistent loading skeletons, error pages

- [ ] **Step 1: Skeleton components matching real content**

```tsx
// SkeletonProductCard, SkeletonProductGrid, SkeletonForm, SkeletonTable
// Use shimmer animation from globals.css
// Match exact dimensions of real components
```

- [ ] **Step 2: Error pages with doodle illustrations**

```tsx
// 404: Lost sticker character, "Page wandered off"
// 500: Sad sticker, "Something stuck"
// Buttons: Go Home, Retry
```

---

### Task 4.2: Toast & Notification System

**Files:**
- Modify: `src/components/ui/Toast.tsx` (or sonner config)

**Interfaces:**
- Produces: Doodle-styled toasts

- [ ] **Step 1: Customize sonner toasts**

```tsx
// Border: 3px ink
// Radius: card (20px)
// Shadow: card
// Success: border-success, shadow-stat
// Error: border-error, shadow-[8px_8px_0_var(--error)]
// Warning: border-warning
// Icons with bounceIn animation
```

---

### Task 4.3: Modal & Dialog System

**Files:**
- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Dropdown.tsx`

**Interfaces:**
- Produces: Consistent modals with doodle styling

- [ ] **Step 1: Modal - doodle card with torn edge**

```tsx
// Backdrop: overlay with backdrop-blur
// Container: variant="doodle-elevated", TornEdge top
// Close button: top-right, hover wobble
// Focus trap, ESC to close
// Enter: scaleIn, Exit: scaleOut
```

- [ ] **Step 2: Dropdown - doodle menu**

```tsx
// Menu: variant="doodle", border-3 ink
// Items: hover bg-surface-hover
// Divider: border-light
// Icons with float-gentle
```

---

### Task 4.4: Form Validation & Accessibility Audit

**Files:**
- Modify: `src/lib/validations/*.ts` (add custom messages)
- Review: All forms across codebase

**Interfaces:**
- Produces: Consistent validation UX

- [ ] **Step 1: Standardize error messages**

```tsx
// Field-level: inline below input, red-500, flex items-center gap-1
// Form-level: toast + focus first error
// Floating label: turns red on error
// Clear on input: immediate
```

- [ ] **Step 2: Run accessibility audit**

```bash
# Check: color contrast, focus order, ARIA labels, landmarks
# Tools: axe-core, Lighthouse, manual keyboard nav
```

---

### Task 4.5: Animation Performance & Reduced Motion

**Files:**
- Review: All animated components

**Interfaces:**
- Produces: Performant animations respecting preferences

- [ ] **Step 1: Audit all Framer Motion usage**

```tsx
// Ensure: transform/opacity only, no layout triggers
// Use: layoutId for shared layout transitions
// Add: reducedMotion prop variants
```

- [ ] **Step 2: Test with prefers-reduced-motion**

```bash
# OS setting: reduce motion
# Verify: all animations disabled, instant transitions
```

---

### Task 4.6: Cross-Browser & Device Testing

**Files:**
- N/A (testing)

**Interfaces:**
- Produces: Verified compatibility

- [ ] **Step 1: Test matrix**

```
Desktop: Chrome, Firefox, Safari, Edge (latest 2)
Mobile: iOS Safari, Chrome Android
Viewports: 320, 375, 768, 1024, 1280, 1440
```

- [ ] **Step 2: Visual regression testing**

```bash
# Use: Playwright with pixelmatch
# Baseline: current implementation
# Compare: after each phase
```

---

### Task 4.7: Documentation & Storybook

**Files:**
- Create: `docs/design-system.md`
- Create: `.storybook/` (if not exists)
- Create stories for all UI primitives

**Interfaces:**
- Produces: Living documentation

- [ ] **Step 1: Document design tokens**

```md
# Design System Documentation
## Colors (with swatches)
## Typography (with examples)
## Spacing (with visual scale)
## Shadows (with examples)
## Border Radius
## Animations (with code snippets)
## Component API (props, variants)
```

- [ ] **Step 2: Add Storybook stories**

```tsx
// Button.stories.tsx: all variants, sizes, states
// Input.stories.tsx: with label, error, icon, password
// Card.stories.tsx: all variants
// etc.
```

---

# Phase 5: Cleanup & Final Verification

### Task 5.1: Remove Unused Code & Dead CSS

**Files:**
- Review: All modified files

**Interfaces:**
- Produces: Clean codebase

- [ ] **Step 1: Remove unused Tailwind classes**

```bash
# Run: pnpm dlx tailwindcss-unused-classes
# Remove dead utilities from globals.css
```

- [ ] **Step 2: Remove deprecated component variants**

```bash
# Search for: "deprecated", "legacy", "old"
# Remove or migrate
```

---

### Task 5.2: Final Build & Type Check

**Files:**
- N/A

**Interfaces:**
- Produces: Passing CI

- [ ] **Step 1: Run full build**

```bash
pnpm type-check  # Must pass
pnpm lint        # Must pass
pnpm test:run    # Must pass
pnpm build       # Must pass
```

- [ ] **Step 2: Run E2E smoke tests**

```bash
pnpm e2e  # e2e/smoke.spec.ts must pass
```

---

### Task 5.3: Visual Regression Baseline

**Files:**
- Create: `e2e/visual-baseline/` (screenshots)

**Interfaces:**
- Produces: Baseline for future regression detection

- [ ] **Step 1: Capture screenshots of all key pages**

```bash
# Pages: /, /shop, /shop/[slug], /login, /register, /cart, /checkout
# /custom-sticker, /profile, /orders, /orders/[id], /about, /contact
# Admin: /admin/dashboard, /admin/products, /admin/orders, /admin/custom-requests
# Viewports: mobile (375), tablet (768), desktop (1280)
```

---

## Execution Order & Dependencies

```
Phase 0 (Foundation)          → Must complete first
  0.1 Tokens → 0.2 Motion → 0.3 Doodle System → 0.4 UI Primitives

Phase 1 (Layout)              → After Phase 0
  1.1 Navbar → 1.2 PageWrapper → 1.3 Footer

Phase 2 (Customer Pages)      → After Phase 1 (can parallelize)
  2.1 Home → 2.2 Shop → 2.3 Product Detail → 2.4 Login → 2.5 Register
  2.6 Cart → 2.7 Checkout → 2.8 Custom Sticker → 2.9 Profile → 2.10 Orders → 2.11 About/Contact

Phase 3 (Admin Pages)         → After Phase 1 (can parallelize with Phase 2)
  3.1 Layout/Sidebar → 3.2 Dashboard → 3.3 Products → 3.4 Orders → 3.5 Custom Requests → 3.6 Analytics/Settings/Customers

Phase 4 (Polish)              → After Phase 2 & 3
  4.1 Loading/Error → 4.2 Toast → 4.3 Modal/Dropdown → 4.4 Forms/A11y → 4.5 Animation Perf → 4.6 Cross-Browser → 4.7 Docs

Phase 5 (Final)               → Last
  5.1 Cleanup → 5.2 Build/Tests → 5.3 Visual Baseline
```

---

## Estimated Effort

| Phase | Tasks | Est. Days |
|-------|-------|-----------|
| 0: Foundation | 4 | 3-4 |
| 1: Layout | 3 | 2 |
| 2: Customer Pages | 11 | 8-10 |
| 3: Admin Pages | 6 | 4-5 |
| 4: Polish | 7 | 3-4 |
| 5: Final | 3 | 1-2 |
| **Total** | **34** | **21-25** |

---

## Success Criteria

- [ ] All pages use semantic CSS variables — zero hardcoded colors in components
- [ ] Password toggle icons never overflow input bounds at any viewport
- [ ] ProductCard grid items fit container without horizontal scroll
- [ ] All interactive states (hover, focus, active, disabled) meet WCAG AA
- [ ] Animations respect `prefers-reduced-motion`
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test:run`, `pnpm build` all pass
- [ ] E2E smoke tests pass
- [ ] Visual baseline captured for all key pages at 3 viewports
- [ ] Design system documented with Storybook stories for all primitives

---

## Notes for Implementers

1. **Work in small commits** — each task should be a separate commit with clear message
2. **Test locally** — run `pnpm dev` and verify visual changes at each step
3. **Use the design tokens** — never hardcode `bg-red-500`, use `bg-[var(--error)]`
4. **Leverage ReUI free components** — check `c-card-*`, `c-navigation-menu-*`, `c-data-grid-*`, `c-skeleton-*`, `c-empty-*` before building custom
5. **Doodle ≠ clutter** — use decorative elements sparingly; one accent per section max
6. **Performance first** — animate `transform`/`opacity` only; avoid layout thrashing
7. **Accessibility is not optional** — every interactive element needs focus state, ARIA labels, keyboard support