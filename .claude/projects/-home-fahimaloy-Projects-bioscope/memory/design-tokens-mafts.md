---
name: design-tokens-mafts
description: MAFTS design system tokens - colors, typography, animations, components from DESIGN_TOKENS.md
metadata:
  type: reference
---

# MAFTS Design Tokens Reference

## Color Palette
- **Primary**: `#FF6B6B` (Coral/Orange-red) - Main accent, buttons, active states
- **Secondary**: `#4ECDC4` (Teal) - Secondary buttons, stats, highlights
- **Accent**: `#FFE66D` (Yellow) - Subtitles, form outlines, highlights
- **Dark**: `#2C3E50` (Dark blue-gray) - Primary text, borders
- **Light**: `#ECF0F1` (Light gray) - Subtle backgrounds
- **BG**: `#FAFAFA` (Off-white) - Page background

## Typography
- **Display**: Bangers (cursive) - Headings, logo, titles
- **Body**: Outfit (300/400/600/800) - Body text, navigation, forms

## Key Animations
- `revealLetter` (0.6s) - Staggered letter reveal for hero
- `float` (20s) - Background shape floating
- `bounce` (3s) - Emoji bounce
- `counter` (2s) - Number counter animation
- Custom easing: `cubic-bezier(0.175, 0.885, 0.32, 1.275)`

## Shadow System
- Button: `4px 4px 0px var(--dark)` → hover: `6px 8px 0px` → active: `0px 0px 0px`
- Card: `8px 8px 0px var(--secondary)` → hover: `12px 12px 0px var(--primary)`
- Stat: `6px 6px 0px var(--primary)`
- Form: `10px 10px 0px var(--accent)`
- Input focus: `4px 4px 0px var(--primary)`

## Border Radius
- Buttons: `50px` (pill)
- Cards: `20px`
- Inputs: `10px`
- Shapes: `50%`

## Glass Morphism
```css
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(10px);
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
```

## Responsive Breakpoints
- Mobile: `< 768px` (nav hidden, stacked CTAs, no floating emojis)
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## Component Classes Reference
- `.btn`, `.btn-primary`, `.btn-secondary`
- `.card`, `.card-icon`, `.card:hover`
- `.stat-item`
- `.form-group` with floating labels
- `.section-title` (3.5rem, text-shadow)
- `.staggered-title` (8rem desktop, 5rem mobile)
- `.bg-shapes` + `.shape-1` through `.shape-4`