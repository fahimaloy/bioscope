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
  pulseSoft: { initial: { scale: 1 }, animate: { scale: [1, 1.02, 1] as [number, number, number] }, transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
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