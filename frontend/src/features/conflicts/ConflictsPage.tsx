import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button, Card, DataTable, Badge, EmptyState, Pagination, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useConflicts } from '@/lib/queries'
import { QueryError } from '@/components/QueryFeedback'
import { timeAgo, cn } from '@/lib/utils'
import type { Conflict, ConflictStatus } from '@/types'
import { severityTone } from '@/features/dashboard/shared/StatusBadge'

const statusTone: Record<ConflictStatus, 'danger' | 'warning' | 'success' | 'neutral'> = {
  OPEN: 'danger',
  UNDER_REVIEW: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'neutral',
}

export default function ConflictsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConflictStatus>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useConflicts({ status: statusFilter === 'ALL' ? undefined : statusFilter })
  const rows = data?.items ?? []

  const columns: Column<Conflict>[] = [
    {
      key: 'category',
      header: t('conflicts.category'),
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="text-[12.5px] font-medium text-ink">{c.category.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: t('conflicts.severity'),
      render: (c) => <Badge tone={severityTone(c.severity)} size="xs">{c.severity}</Badge>,
    },
    {
      key: 'record',
      header: 'Record',
      render: (c) => (
        <div>
          <p className="font-mono text-[12px] font-medium text-ink">{c.recordId}</p>
          <p className="text-[11px] text-ink-faint">{c.extractedValue ?? '—'}</p>
        </div>
      ),
    },
    { key: 'field', header: t('conflicts.field'), render: (c) => <span className="text-[12px] text-ink-muted">{c.field}</span> },
    {
      key: 'description',
      header: t('conflicts.descriptionCol'),
      render: (c) => (
        <div className="max-w-md">
          <p className="truncate text-[12.5px] font-medium text-ink">{c.description}</p>
          {c.difference ? <p className="mt-0.5 text-[11px] text-ink-faint">Δ {c.difference}</p> : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (c) => <Badge tone={statusTone[c.status]} size="xs">{c.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'updated',
      header: t('common.date'),
      render: (c) => (
        <div className="text-[12px]">
          <p className="text-ink-muted">{timeAgo(c.updatedAt)}</p>
          {c.resolvedBy ? <p className="text-ink-faint">by {c.resolvedBy}</p> : null}
        </div>
      ),
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: (c) => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/conflicts/${c.id}`)}>
          Investigate
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('conflicts.title')}
        subtitle={t('conflicts.description')}
      />

      {/* Category legend */}
      <Card bare className="mb-4 ring-line">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 p-3.5">
          {[
            'Duplicate survey number',
            'Owner mismatch',
            'Area mismatch',
            'Missing field',
            'Historical inconsistency',
            'OCR uncertainty',
            'GIS mismatch',
            'Document inconsistency',
          ].map((cat) => (
            <span key={cat} className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-danger/60" />
              {cat}
            </span>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2">
        {(['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
              statusFilter === s ? 'border-navy-900 bg-navy-900 text-white' : 'border-line-strong bg-surface text-ink-muted hover:border-accent hover:text-accent',
            )}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="mb-4" />
      ) : (
      <Card bare padded={false} className="ring-line overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(c) => c.id}
          loading={isLoading}
          emptyState={<EmptyState icon={<AlertTriangle className="h-5 w-5" />} title="No conflicts" description="No conflicts matching this filter." />}
        />
        <div className="border-t border-line px-4">
          <Pagination page={page} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / 25))} totalItems={data?.total ?? 0} pageSize={25} onPageChange={setPage} />
        </div>
      </Card>
      )}
    </div>
  )
}

