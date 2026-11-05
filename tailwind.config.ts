import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        ink: 'var(--ink)',
        light: 'var(--light)',
        bg: 'var(--bg-color)',
        // Semantic colors
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
      fontFamily: {
        display: ['var(--font-display)', 'cursive'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        inner: 'var(--shadow-inner)',
        input: 'var(--shadow-input)',
        glass: 'var(--shadow-glass)',
        // Legacy MAFTS shadows
        btn: 'var(--shadow-btn)',
        'btn-hover': 'var(--shadow-btn-hover)',
        'btn-active': 'var(--shadow-btn-active)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        stat: 'var(--shadow-stat)',
        form: 'var(--shadow-form)',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
      },
      animation: {
        float: 'float 20s infinite alternate ease-in-out',
        'bounce-slow': 'bounce 3s infinite ease-in-out alternate',
        'reveal-letter': 'revealLetter 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        counter: 'counter 2s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.2s ease-in',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(100px, 100px) scale(1.2)' },
        },
        bounce: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateY(-30px) rotate(15deg)' },
        },
        revealLetter: {
          from: { opacity: '0', transform: 'translateY(50px) rotate(-10deg)' },
          to: { opacity: '1', transform: 'translateY(0) rotate(0)' },
        },
        counter: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(-100%)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'display-xl': ['8rem', { lineHeight: '1', letterSpacing: '0.02em' }],
        'display-lg': ['6rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-md': ['4.5rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-sm': ['3.5rem', { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'heading-xl': ['3rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
        'heading-lg': ['2.25rem', { lineHeight: '1.3', letterSpacing: '0.01em' }],
        'heading-md': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.01em' }],
        'heading-sm': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
}
export default config