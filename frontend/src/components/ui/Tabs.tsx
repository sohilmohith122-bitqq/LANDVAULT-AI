import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  key: string
  label: ReactNode
  badge?: number
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
  /** Show a subtle count badge by each tab */
  showCounts?: boolean
}

export function Tabs({ tabs, active, onChange, className, showCounts }: TabsProps) {
  return (
    <div role="tablist" aria-label="Tabs" className={cn('flex items-center gap-1 border-b border-line', className)}>
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => onChange(tab.key)}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:shadow-focus',
              selected
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink',
              tab.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {tab.label}
            {showCounts && tab.badge !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none',
                  selected ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-ink-faint',
                )}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function useTabs(initial: string) {
  const [active, setActive] = useState(initial)
  return { active, setActive }
}