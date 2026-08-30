import { Badge, type BadgeTone } from '@/components/ui/Badge'

/** Map a land-record status to a badge tone for consistent visual language */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone: BadgeTone =
    status === 'VERIFIED'
      ? 'success'
      : status === 'CONFLICT'
        ? 'danger'
        : status === 'IN_REVIEW' || status === 'REVIEW_REQUIRED'
          ? 'warning'
          : 'neutral'
  return (
    <Badge tone={tone} size="xs" className={className}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return 'danger'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'info'
    default:
      return 'neutral'
  }
}