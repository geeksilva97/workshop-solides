import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-dark',
  secondary: 'bg-primary-tint text-primary hover:brightness-95',
  ghost: 'text-body hover:bg-line/60',
}

const SIZES: Record<Size, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export interface ButtonStyleProps {
  variant?: Variant
  size?: Size
  className?: string
}

/** Shared button styling — also used to style <Link> as a button. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleProps = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
