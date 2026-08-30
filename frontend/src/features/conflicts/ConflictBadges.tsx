import { Badge, type BadgeTone } from '@/components/ui/Badge'
import type { ConflictCategory, ConflictStatus } from '@/types'

const catTone: Record<ConflictCategory, BadgeTone> = {
  DUPLICATE_SURVEY: 'danger',
  OWNER_MISMATCH: 'warning',
  AREA_MISMATCH: 'warning',
  MISSING_FIELD: 'neutral',
  HISTORICAL_INCONSISTENCY: 'danger',
  OCR_UNCERTAINTY: 'info',
  GIS_MISMATCH: 'warning',
  DOCUMENT_INCONSISTENCY: 'accent',
}

const statusTone: Record<ConflictStatus, BadgeTone> = {
  OPEN: 'danger',
  UNDER_REVIEW: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'neutral',
}

export function CategoryBadge({ category }: { category: ConflictCategory }) {
  return (
    <Badge tone={catTone[category]} size="xs">
      {category.replace(/_/g, ' ')}
    </Badge>
  )
}

export function ConflictStatusBadge({ status }: { status: ConflictStatus }) {
  return (
    <Badge tone={statusTone[status]} size="xs" dot>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const tone: BadgeTone = severity === 'CRITICAL' || severity === 'HIGH' ? 'danger' : severity === 'MEDIUM' ? 'warning' : 'info'
  return <Badge tone={tone} size="xs">{severity}</Badge>
}