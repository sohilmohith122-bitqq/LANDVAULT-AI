import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, Badge } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useConflicts } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'
import { timeAgo } from '@/lib/utils'
import { severityTone } from '../shared/StatusBadge'

export function ConflictsPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useConflicts()
  const open = (data?.items ?? []).filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW')

  return (
    <Card bare className="ring-line">
      <CardHeader
        title={t('dashboard.recentConflicts')}
        action={
          <Link to="/conflicts" className="flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:text-accent-strong">
            {t('conflicts.title')} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="px-1" />
      ) : isLoading ? (
        <QueryLoading rows={4} className="px-1" />
      ) : open.length === 0 ? (
        <p className="py-8 text-center text-[12.5px] text-ink-faint">No open conflicts — queue is clear.</p>
      ) : (
        <div className="divide-y divide-line/70">
          {open.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/conflicts/${c.id}`)}
              className="flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-surface-muted/50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{c.description}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">
                  {c.field === 'survey_number' ? 'S.No' : c.field} · {timeAgo(c.createdAt)}
                </p>
              </div>
              <Badge tone={severityTone(c.severity)} size="xs">
                {c.severity}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}