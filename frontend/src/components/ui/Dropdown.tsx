import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  ariaLabel?: string
  /** Close on outside click */
  closeOnSelect?: boolean
}

export function Dropdown({ trigger, items, align = 'right', ariaLabel, closeOnSelect = true }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-1.5 min-w-[180px] rounded-panel bg-surface py-1 shadow-pop ring-1 ring-line animate-slide-up',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={`${item.key}-divider`} className="my-1 h-px bg-line" />
            ) : (
              <button
                key={item.key}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect?.()
                  if (closeOnSelect) setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[0.8125rem] font-medium transition-colors',
                  item.danger ? 'text-danger hover:bg-danger-bg' : 'text-ink hover:bg-surface-muted',
                  item.disabled && 'cursor-not-allowed opacity-40',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}