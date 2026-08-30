import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, EmptyState } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import type { LandRecord } from '@/types'
import { StatusBadge } from '../shared/StatusBadge'

export function QueuePanel({ records }: { records: LandRecord[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queue = records.filter((r) => r.status === 'IN_REVIEW' || r.status === 'CONFLICT')

  return (
    <Card bare className="ring-line">
      <CardHeader
        title={t('dashboard.verificationQueue')}
        action={
          <Link to="/verification" className="flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:text-accent-strong">
            {t('common.view')} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="space-y-2">
        {queue.slice(0, 5).map((r) => (
          <button
            key={r.id}
            onClick={() => navigate(`/verification/${r.id}`)}
            className="flex w-full items-center justify-between gap-3 rounded-field border border-line px-3 py-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{r.ownerName}</p>
              <p className="truncate text-[11.5px] text-ink-muted">
                {r.village} · S.No {r.surveyNumber}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </button>
        ))}
        {queue.length === 0 ? (
          <EmptyState compact title="Queue is clear" description="No records awaiting human review." />
        ) : null}
      </div>
    </Card>
  )
}