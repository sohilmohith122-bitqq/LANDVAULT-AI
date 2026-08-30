import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'xs' | 'sm'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink-muted ring-line',
  accent: 'bg-accent-soft text-accent ring-accent/15',
  success: 'bg-success-bg text-success ring-success/20',
  warning: 'bg-warning-bg text-warning ring-warning/20',
  danger: 'bg-danger-bg text-danger ring-danger/20',
  info: 'bg-info-bg text-info ring-info/20',
}

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[0.6875rem]',
  sm: 'px-2 py-0.5 text-[0.75rem]',
}

export interface BadgeProps {
  tone?: BadgeTone
  size?: BadgeSize
  children: ReactNode
  /** Shows a small dot indicator */
  dot?: boolean
  className?: string
  title?: string
}

export function Badge({ tone = 'neutral', size = 'sm', children, dot, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip font-medium ring-1 ring-inset',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} aria-hidden /> : null}
      {children}
    </span>
  )
}

/** Confidence badge with tone derived from the value */
export function ConfidenceBadge({
  value,
  className,
}: {
  value: number | null | undefined
  className?: string
}) {
  if (value === null || value === undefined) {
    return <Badge tone="neutral" title="No measured confidence">—</Badge>
  }
  const pct = Math.round(value * 100)
  const tone: BadgeTone = pct >= 85 ? 'success' : pct >= 65 ? 'warning' : 'danger'
  return (
    <Badge tone={tone} size="sm" className={className} title={`AI confidence ${pct}%`}>
      {pct}%
    </Badge>
  )
}