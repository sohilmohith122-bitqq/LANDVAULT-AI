import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Removes outer shadow & border for embedded panels */
  bare?: boolean
  /** Adds inner padding */
  padded?: boolean
}

export function Card({ className, children, bare, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-panel bg-surface',
        !bare && 'shadow-card ring-1 ring-line',
        padded && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="h-section truncate">{title}</h3>
        {subtitle ? <p className="body-muted mt-0.5">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card bare className="ring-line">
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/3" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </Card>
  )
}