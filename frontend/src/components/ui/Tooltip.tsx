import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

/** Lightweight CSS tooltip — appears on hover and focus */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const handleEnter = () => {
    const el = triggerRef.current
    if (el) {
      const r = el.getBoundingClientRect()
      setPos({ x: r.left + r.width / 2, y: side === 'top' ? r.top - 8 : r.bottom + 8 })
    }
    setShow(true)
  }

  return (
    <span
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      onFocus={handleEnter}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && pos ? (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[60] max-w-xs -translate-x-1/2 whitespace-normal rounded-md bg-navy-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-pop animate-fade-in"
          style={{
            left: pos.x,
            top: side === 'top' ? pos.y : pos.y,
            transform: `translate(-50%, ${side === 'top' ? '-100%' : '0'})`,
          }}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}