import { create } from 'zustand'
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface Toast {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${Date.now()}-${toastCounter++}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    // Auto-dismiss after 5s for non-danger, 9s for danger
    window.setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      toast.tone === 'danger' ? 9000 : 5000,
    )
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

const toneIcon: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
}

const toneCls: Record<ToastTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div aria-live="polite" aria-label="Notifications" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = toneIcon[t.tone]
        return (
          <div
            key={t.id}
            role={t.tone === 'danger' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-start gap-3 rounded-panel bg-surface p-3.5 shadow-pop ring-1 ring-line animate-slide-in-right"
          >
            <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', toneCls[t.tone])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-xs text-ink-muted">{t.description}</p> : null}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-ink-faint transition-colors hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Imperative helpers */
export const toast = {
  info: (title: string, description?: string) => useToastStore.getState().push({ tone: 'info', title, description }),
  success: (title: string, description?: string) => useToastStore.getState().push({ tone: 'success', title, description }),
  warning: (title: string, description?: string) => useToastStore.getState().push({ tone: 'warning', title, description }),
  danger: (title: string, description?: string) => useToastStore.getState().push({ tone: 'danger', title, description }),
}