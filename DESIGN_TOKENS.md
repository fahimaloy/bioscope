# MAFTS Design Tokens & Style Guide

A comprehensive design system documentation for recreating the MAFTS UI in Next.js projects.

---

## Project Overview

**Name:** MAFTS (Making Awesome Fun Things Happen)

**Style:** Fun, vibrant, animated web experience with a playful yet polished aesthetic. Features glass-morphism, 3D transforms, and colorful gradient accents.

---

## Color System

### Primary Color Palette

```css
:root {
  --primary: #FF6B6B;     /* Coral/Orange-red - main accent */
  --secondary: #4ECDC4;     /* Teal - secondary accent */
  --accent: #FFE66D;        /* Yellow - highlight color */
  --dark: #2C3E50;          /* Dark blue-gray - primary text/background */
  --light: #ECF0F1;         /* Light gray - subtle backgrounds */
  --bg-color: #FAFAFA;      /* Off-white - main background */
}
```

### Color Usage Guide

| Variable | Usage |
|----------|-------|
| `--primary` | Logo, button backgrounds, active states, hover effects |
| `--secondary` | Secondary buttons, stats cards, highlights |
| `--accent` | Subtitles, secondary text, form button outlines |
| `--dark` | Primary text, form borders, card borders |
| `--light` | Subtle backgrounds, borders |
| `--bg-color` | Page background, card backgrounds |

### Theme Switching Support

The design supports dynamic theme switching via JavaScript:

```javascript
// Change primary color
document.documentElement.style.setProperty('--primary', '#4ECDC4');
// Update all dependent text shadows and effects
```

---

## Typography

### Font Stack

```html
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
```

| Font | Usage | Style |
|------|-------|-------|
| **Bangers** | Display headings, logo, titles | `font-family: 'Bangers', cursive;` |
| **Outfit** | Body text, navigation, forms | `font-family: 'Outfit', sans-serif;` |

### Font Weights

- `300` - Light text
- `400` - Regular body text
- `600` - Medium weight (nav links, labels)
- `800` - Extra bold (stat numbers, section titles)

### Typography Scale

| Element | Size | Weight | Color | Notes |
|---------|------|--------|-------|-------|
| `h1.staggered-title` | 8rem (desktop) / 5rem (mobile) | Display | `--dark` | Letter-by-letter animation |
| `.subtitle` | 2rem (desktop) / 1.5rem (mobile) | 600 | `--secondary` | Hero tagline |
| `.section-title` | 3.5rem | Display | `--dark` | Text shadow: `2px 2px 0px var(--primary)` |
| `h2, h3` | Auto (body) | 800 | `--primary` | Card titles |
| `p` (body) | 1.1rem | 400 | --dark | Line height: 1.6 |
| Logo/Footer Logo | 2.5rem - 3rem | Display | Primary/Accent | Text shadow: `2px 2px 0px var(--dark)` |

---

## Spacing System

### Base Units

- **Container padding:** 5% horizontal (responsive)
- **Section padding:** 6rem vertical, 5% horizontal
- **Vertical rhythm:** Uses margin-bottom and padding-bottom consistently

### Component Spacing

| Component | Spacing |
|-----------|---------|
| Navbar | `1.5rem` padding |
| Buttons | `1rem` vertical / `2rem` horizontal padding |
| Cards | `2.5rem` padding |
| Form groups | `2rem` margin-bottom |
| Card icon | `1rem` margin-bottom |
| CTA buttons | `1.5rem` gap |
| Stats container | `4rem` gap between items |
| Social links | `1.5rem` gap |

---

## Border Radius

| Component | Radius |
|-----------|--------|
| Buttons | `50px` (pill-shaped) |
| Cards | `20px` (pill corners) |
| Form inputs | `10px` (rounded) |
| Background shapes | `50%` (circular) |
| Color switcher | `50%` (circular) |
| Stat items | `20px` |
| Contact form | `20px` |

---

## Shadows & Depth

### Box Shadow System

```css
/* Primary shadow style - offset with colored overlay */
box-shadow: 4px 4px 0px var(--color);

/* Hover active state - inset shadow */
box-shadow: 0px 0px 0px var(--dark);

/* Larger elements (cards) */
box-shadow: 8px 8px 0px var(--secondary);

/* Contact form */
box-shadow: 10px 10px 0px var(--accent);
```

### Glass Morphism (Navbar)

```css
.backdrop-blur-effect {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}
```

---

## Animations & Transitions

### Easing Functions

```css
/* Primary transition - custom bounce */
transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Hover lift effect */
transform: translateY(-5px);
box-shadow: 6px 8px 0px var(--dark);

/* Active press effect */
transform: translate(4px, 4px);
box-shadow: 0px 0px 0px var(--dark);
```

### Key Animations

| Animation | Duration | Description |
|-----------|----------|-------------|
| `revealLetter` | 0.6s | Staggered letter reveal for hero title |
| `float` | 20s | Background shape float animation |
| `bounce` | 3s | Emoji bounce effects |
| `counter` | 2s | Animated number counters |

```css
@keyframes revealLetter {
  from { opacity: 0; transform: translateY(50px) rotate(-10deg); }
  to { opacity: 1; transform: translateY(0) rotate(0); }
}

@keyframes float {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(100px, 100px) scale(1.2); }
}

@keyframes bounce {
  from { transform: translateY(0) rotate(0deg); }
  to { transform: translateY(-30px) rotate(15deg); }
}
```

---

## Layout System

### Grid System

```css
/* Cards container - flexbox */
.cards-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

/* 3-column grid variant */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### Responsive Breakpoints

```css
/* Mobile first - below 768px */
@media (max-width: 768px) {
  .staggered-title { font-size: 5rem; }
  .subtitle { font-size: 1.5rem; }
  .nav-links { display: none; } /* Mobile nav pattern */
  .cta-buttons { flex-direction: column; }
  .stats-container { gap: 2rem; }
  .floating-emojis { display: none; }
}
```

### Section Layout

```css
section {
  padding: 6rem 5%;
}

.hero {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
```

---

## Components

### 1. Navbar

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 5%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}

.logo {
  font-size: 2.5rem;
  color: var(--primary);
  text-shadow: 2px 2px 0px var(--dark);
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--dark);
  font-weight: 600;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  position: relative;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 3px;
  background: var(--primary);
  transition: width 0.3s ease;
}

.nav-links a:hover::after {
  width: 100%;
}
```

### 2. Buttons

```css
.btn {
  display: inline-block;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  text-decoration: none;
  border-radius: 50px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 3px solid var(--dark);
  cursor: pointer;
  box-shadow: 4px 4px 0px var(--dark);
}

.btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px var(--dark);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: var(--accent);
  color: var(--dark);
}

.btn:hover {
  transform: translateY(-5px);
  box-shadow: 6px 8px 0px var(--dark);
}
```

### 3. Cards

```css
.card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  border: 3px solid var(--dark);
  box-shadow: 8px 8px 0px var(--secondary);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 12px 12px 0px var(--primary);
}

.card-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.card:hover .card-icon {
  transform: scale(1.2) rotate(10deg);
}

.card h3 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--primary);
}
```

### 4. Stat Items

```css
.stat-item {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  border: 3px solid var(--dark);
  box-shadow: 6px 6px 0px var(--primary);
  min-width: 150px;
}

.stat-item span {
  font-family: var(--font-display);
  font-size: 3rem;
  color: var(--primary);
}

.stat-item p {
  font-weight: 800;
  text-transform: uppercase;
}
```

### 5. Form Elements

```css
.contact-form {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 3rem;
  border-radius: 20px;
  border: 3px solid var(--dark);
  box-shadow: 10px 10px 0px var(--accent);
}

.form-group {
  position: relative;
  margin-bottom: 2rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--dark);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 1.1rem;
  background: transparent;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 4px 4px 0px var(--primary);
}

/* Floating Labels */
.form-group label {
  position: absolute;
  left: 1rem;
  top: 1rem;
  background: white;
  padding: 0 0.5rem;
  color: #7f8c8d;
  transition: all 0.3s ease;
  pointer-events: none;
  font-weight: 600;
}

.form-group input:focus ~ label,
.form-group input:not(:placeholder-shown) ~ label,
.form-group textarea:focus ~ label,
.form-group textarea:not(:placeholder-shown) ~ label {
  top: -0.6rem;
  font-size: 0.9rem;
  color: var(--primary);
}
```

### 6. Background Shapes

```css
.bg-shapes {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.2;
  filter: blur(40px);
  animation: float 20s infinite alternate ease-in-out;
}

.shape-1 { width: 300px; height: 300px; background: var(--primary); animation-delay: 0s; }
.shape-2 { width: 400px; height: 400px; background: var(--secondary); animation-delay: -5s; }
.shape-3 { width: 250px; height: 250px; background: var(--accent); animation-delay: -10s; }
.shape-4 { width: 200px; height: 200px; background: var(--primary); animation-delay: -15s; }
```

---

## JavaScript Interactions

### 1. Staggered Title Reveal

```javascript
const title = document.getElementById('hero-title');
const text = title.innerText;
title.innerHTML = '';

text.split('').forEach((char, index) => {
  const span = document.createElement('span');
  span.innerText = char;
  span.style.animationDelay = `${index * 0.15}s`;
  span.style.textShadow = `4px 4px 0px var(--primary)`;
  title.appendChild(span);
});
```

### 2. Counter Animation

```javascript
const counters = document.querySelectorAll('.counter');
let hasAnimated = false;

const animateCounters = () => {
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.innerText = Math.ceil(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.innerText = target;
      }
    };
    updateCounter();
  });
};

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !hasAnimated) {
    animateCounters();
    hasAnimated = true;
  }
}, { threshold: 0.5 });

observer.observe(document.getElementById('stats'));
```

### 3. Color Theme Switcher

```javascript
const colorBtns = document.querySelectorAll('.color-btn');
const root = document.documentElement;

colorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const newColor = btn.getAttribute('data-color');
    root.style.setProperty('--primary', newColor);
    
    // Update text shadows
    document.querySelectorAll('.staggered-title span').forEach(span => {
      span.style.textShadow = `4px 4px 0px ${newColor}`;
    });
    
    // Animation effect
    document.body.style.transform = 'scale(0.99)';
    setTimeout(() => {
      document.body.style.transform = 'scale(1)';
      document.body.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }, 50);
  });
});
```

### 4. Form Submission

```javascript
const form = document.getElementById('contactForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('.submit-btn');
  const originalText = btn.innerText;
  
  btn.innerText = 'Sent! 🚀';
  btn.style.backgroundColor = 'var(--secondary)';
  btn.style.borderColor = 'var(--secondary)';
  
  setTimeout(() => {
    btn.innerText = originalText;
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
    form.reset();
  }, 3000);
});
```

---

## Background & Visual Elements

### Floating Emojis

```css
.floating-emojis .emoji {
  position: absolute;
  font-size: 3rem;
  animation: bounce 3s infinite ease-in-out alternate;
  z-index: 1;
}

.e1 { top: 20%; left: 15%; }
.e2 { top: 30%; right: 15%; font-size: 4rem; }
.e3 { bottom: 30%; left: 20%; }
.e4 { bottom: 20%; right: 25%; }
```

---

## Next.js Implementation Notes

### CSS Variables in Tailwind

When implementing in Next.js with Tailwind, configure `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        dark: '#2C3E50',
        light: '#ECF0F1',
      },
      fontFamily: {
        display: ['Bangers', 'cursive'],
        body: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'pill': '50px',
        'card': '20px',
        'input': '10px',
      },
      boxShadow: {
        'btn': '4px 4px 0px #2C3E50',
        'card': '8px 8px 0px #4ECDC4',
        'stat': '6px 6px 0px #FF6B6B',
      },
    },
  },
}
```

### Component Structure

```
components/
  Navbar.tsx
  Button.tsx
  Card.tsx
  StatItem.tsx
  ContactForm.tsx
  Hero.tsx
  Section.tsx
  BackgroundShapes.tsx
  ColorSwitcher.tsx
```

### Recommended Global CSS (globals.css)

Extract the full CSS from `styles.css` and add to `app/globals.css` in Next.js App Router.

---

## Quick Reference

| Element | Class | Primary CSS Properties |
|---------|-------|----------------------|
| Page | body | `font-family: Outfit`, `background: #FAFAFA` |
| Main Title | .staggered-title | `font-size: 8rem`, `font-family: Bangers` |
| Section Title | .section-title | `font-size: 3.5rem`, `text-shadow: 2px 2px 0px #FF6B6B` |
| Primary Button | .btn-primary | `background: #FF6B6B`, `border-radius: 50px` |
| Secondary Button | .btn-secondary | `background: #FFE66D`, `color: #2C3E50` |
| Card | .card | `background: white`, `border-radius: 20px`, `border: 3px solid #2C3E50` |
| Form Input | .form-group input | `border: 2px solid #2C3E50`, `border-radius: 10px` |
| Background Shapes | .shape | `filter: blur(40px)`, `opacity: 0.2`, `animation: float 20s` |

---

## Export Instructions for Next.js Agent

When creating a new Next.js project, provide this file to the AI agent along with:

1. The Google Fonts import in `_document.tsx` or `layout.tsx`
2. The CSS variables in `globals.css`
3. Component files using the classes above
4. TypeScript interfaces for data props (if applicable)
5. Animation callbacks in `useEffect` hooks