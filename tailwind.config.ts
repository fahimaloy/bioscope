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
        light: '#ECF0F1',
        bg: 'var(--bg-color)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'cursive'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        pill: '50px',
        card: '20px',
        input: '10px',
      },
      boxShadow: {
        btn: '4px 4px 0px var(--ink)',
        'btn-hover': '6px 8px 0px var(--ink)',
        'btn-active': '0px 0px 0px var(--ink)',
        card: '8px 8px 0px #4ECDC4',
        'card-hover': '12px 12px 0px #FF6B6B',
        stat: '6px 6px 0px #FF6B6B',
        form: '10px 10px 0px #FFE66D',
        input: '4px 4px 0px #FF6B6B',
        glass: '0 4px 30px rgba(0, 0, 0, 0.05)',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
        'nav': '100',
        'modal': '200',
        'toast': '300',
        'tooltip': '400',
      },
    },
  },
  plugins: [],
}
export default config