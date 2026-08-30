import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  /** Panel width */
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export function Drawer({ open, onClose, title, description, children, footer, width = 'md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-pop ring-1 ring-line animate-slide-in-right',
          widths[width],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="truncate text-base font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="body-muted mt-0.5">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-muted/50 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}