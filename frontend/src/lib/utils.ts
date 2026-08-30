import { clsx, type ClassValue } from 'clsx'

/** Combine class names with dedupe support */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Format a confidence 0..1 as a percentage string */
export function formatConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

/** Confidence tone: high / medium / low */
export type ConfidenceTone = 'high' | 'medium' | 'low'

export function confidenceTone(value: number | null | undefined): ConfidenceTone {
  if (value === null || value === undefined) return 'low'
  if (value >= 0.85) return 'high'
  if (value >= 0.65) return 'medium'
  return 'low'
}

/** Format an ISO date as a readable date */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Format a relative time string, e.g. "5m ago" */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

/** Base62-ish short id for demo/local data */
export function shortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}