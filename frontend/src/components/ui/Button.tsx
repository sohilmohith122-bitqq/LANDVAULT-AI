import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'quiet'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-strong active:bg-accent-strong disabled:bg-ink-faint/40 shadow-[0_1px_2px_rgba(16,24,40,0.08)]',
  secondary:
    'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 disabled:bg-ink-faint/40 shadow-[0_1px_2px_rgba(16,24,40,0.08)]',
  outline:
    'border border-line-strong bg-surface text-ink hover:border-accent hover:text-accent active:bg-surface-muted disabled:text-ink-faint',
  ghost:
    'text-ink-muted hover:bg-surface-muted hover:text-ink active:bg-line/40 disabled:text-ink-faint',
  quiet: 'bg-surface-muted text-ink hover:bg-line/50 active:bg-line/60 disabled:text-ink-faint',
  danger: 'bg-danger text-white hover:bg-danger/90 active:bg-danger disabled:bg-ink-faint/40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[0.9375rem] gap-2',
  icon: 'h-9 w-9 justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-field font-medium transition-colors duration-150',
        'focus-visible:shadow-focus disabled:cursor-not-allowed disabled:shadow-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  )
})