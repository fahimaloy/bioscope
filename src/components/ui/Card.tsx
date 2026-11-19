'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { StickerPeel } from '@/components/decorative';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'doodle' | 'doodle-elevated';
  /**
   * Elevation of the surface (spec §5.4 / contract §5):
   *
   * - `flat` — no shadow. Dense/data surfaces and `variant="outlined"`.
   * - `raised` — `--shadow-ink-3`, the hard 6px offset on cards. **Default.**
   * - `sticker` — `--shadow-die-cut`: the die-cut white outline outside the
   *   ink border, then the 4px ink offset. The Paper + Pop sticker treatment.
   *
   * When `elevation` is omitted it is derived from `variant`, so existing
   * consumers keep rendering correctly:
   *
   * | `variant`            | derived `elevation` |
   * |----------------------|---------------------|
   * | `default`            | `raised`            |
   * | `elevated`           | `raised`            |
   * | `doodle`             | `raised`            |
   * | `doodle-elevated`    | `sticker`           |
   * | `outlined`           | `flat`              |
   *
   * An explicit `elevation` always wins over the derived value.
   */
  elevation?: 'flat' | 'raised' | 'sticker';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

/** Border and fill only — elevation owns the shadow. */
const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-[var(--surface-raised)] border-[3px] border-[var(--ink)]',
  elevated: 'bg-[var(--surface-raised)] border-[3px] border-[var(--ink)]',
  outlined: 'bg-transparent border-[3px] border-[var(--ink)]',
  doodle: 'bg-[var(--surface-raised)] border-[3px] border-[var(--ink)] relative',
  'doodle-elevated': 'bg-[var(--surface-raised)] border-[3px] border-[var(--ink)] relative',
};

const elevationStyles: Record<NonNullable<CardProps['elevation']>, string> = {
  flat: 'shadow-none',
  raised: 'shadow-ink-3',
  sticker: 'shadow-die-cut',
};

/** The `variant` → `elevation` mapping documented on the prop. */
const derivedElevation: Record<
  NonNullable<CardProps['variant']>,
  NonNullable<CardProps['elevation']>
> = {
  default: 'raised',
  elevated: 'raised',
  outlined: 'flat',
  doodle: 'raised',
  'doodle-elevated': 'sticker',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = 'default', elevation, hover = true, padding = 'lg', children, ...props },
    ref
  ) => {
    const resolvedElevation = elevation ?? derivedElevation[variant];
    const isDoodleVariant = variant === 'doodle' || variant === 'doodle-elevated';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-lg)] transition-[transform,box-shadow] duration-base ease-spring',
          // The sticker peel sits outside the card's box, so it needs the
          // corners left visible; every other variant clips to its radius.
          isDoodleVariant ? 'overflow-visible' : 'overflow-hidden',
          variantStyles[variant],
          elevationStyles[resolvedElevation],
          hover &&
            resolvedElevation === 'raised' &&
            'hover:-translate-y-1 hover:shadow-ink-4',
          hover && resolvedElevation === 'sticker' && 'hover:-translate-y-1',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {isDoodleVariant && <StickerPeel />}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('mb-4', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('mb-2 font-display text-2xl text-[var(--ink)]', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-body leading-relaxed text-[var(--text-muted)]', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-4 flex items-center gap-2 border-t border-[var(--paper-deep)] pt-4',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export const CardIcon = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' }
>(({ className, size = 'lg', children, ...props }, ref) => {
  const sizeStyles = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
  };
  return (
    <div
      ref={ref}
      className={cn(
        'mb-4 transition-transform duration-base ease-spring',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CardIcon.displayName = 'CardIcon';
