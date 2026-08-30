import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** For destructive confirmations */
  tone?: 'default' | 'danger'
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', tone }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Trap focus within the dialog
        const dialog = document.getElementById('lv-modal')
        if (dialog) {
          const focusables = dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
          if (focusables.length === 0) return
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden />
      <div
        id="lv-modal"
        className={cn(
          'relative z-10 mt-[6vh] w-full rounded-panel bg-surface shadow-pop ring-1 ring-line animate-slide-up',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-base font-semibold text-ink">{title}</h2>
            ) : null}
            {description ? <p className="body-muted mt-0.5">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-muted/50 px-5 py-3.5 rounded-b-panel">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}