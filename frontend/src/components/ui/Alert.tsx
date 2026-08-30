import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const toneMap: Record<AlertTone, { icon: typeof Info; cls: string; iconCls: string }> = {
  info: { icon: Info, cls: 'bg-info-bg text-info ring-info/15', iconCls: 'text-info' },
  success: { icon: CheckCircle2, cls: 'bg-success-bg text-success ring-success/15', iconCls: 'text-success' },
  warning: { icon: AlertTriangle, cls: 'bg-warning-bg text-warning ring-warning/20', iconCls: 'text-warning' },
  danger: { icon: AlertCircle, cls: 'bg-danger-bg text-danger ring-danger/20', iconCls: 'text-danger' },
}

export interface AlertProps {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  onDismiss?: () => void
  className?: string
}

export function Alert({ tone = 'info', title, children, onDismiss, className }: AlertProps) {
  const { icon: Icon, cls, iconCls } = toneMap[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-panel p-3.5 ring-1 ring-inset', cls, className)}>
      <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', iconCls)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-semibold leading-snug">{title}</p> : null}
        {children ? <div className="mt-0.5 text-[0.8125rem] leading-relaxed opacity-90">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button onClick={onDismiss} className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}