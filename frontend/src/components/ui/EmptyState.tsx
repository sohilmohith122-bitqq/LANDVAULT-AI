import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateAction = { label: ReactNode; onClick?: () => void }

export interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  /** Compact variant for embedded panels */
  compact?: boolean
}

export function EmptyState({ icon, title, description, actions, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-6 py-10' : 'px-8 py-16',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-panel bg-surface-muted text-ink-faint ring-1 ring-line">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[0.9375rem] font-semibold text-ink">{title}</h3>
      {description ? <p className="body-muted mt-1 max-w-sm">{description}</p> : null}
      {actions ? <div className="mt-5 flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}