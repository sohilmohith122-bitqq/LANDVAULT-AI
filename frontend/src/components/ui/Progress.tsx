import { cn } from '@/lib/utils'

export function Progress({
  value,
  tone = 'default',
  className,
  showLabel,
}: {
  value: number // 0..100
  tone?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
  showLabel?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const barCls =
    tone === 'default'
      ? 'bg-accent'
      : tone === 'success'
        ? 'bg-success'
        : tone === 'warning'
          ? 'bg-warning'
          : 'bg-danger'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line/70"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', barCls)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? <span className="numeric w-9 text-right text-xs text-ink-muted">{Math.round(clamped)}%</span> : null}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-label="Loading"
      className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent', className)}
    />
  )
}