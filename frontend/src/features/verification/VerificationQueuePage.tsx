import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Play } from 'lucide-react'
import { Button, Card, DataTable, EmptyState, Pagination, type Column } from '@/components/ui'
import { ConfidenceBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/AppShell'
import { useRecords } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'
import { formatDate, formatConfidence } from '@/lib/utils'
import type { LandRecord } from '@/types'
import { StatusBadge, severityTone } from '@/features/dashboard/shared/StatusBadge'

export default function VerificationQueuePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'ALL' | 'FLAGGED'>('ALL')

  const { data, isLoading, error, refetch } = useRecords({ status: 'IN_REVIEW,CONFLICT', pageSize: 200 })

  const queue = useMemo(
    () => (data?.items ?? []).filter((r) => r.status === 'IN_REVIEW' || r.status === 'CONFLICT'),
    [data],
  )

  /* A record is "flagged" when the AI itself marked fields low-confidence — statuses come from the pipeline. */
  const flaggedFieldsOf = (r: LandRecord) => r.fields.filter((f) => f.confidence !== null && f.confidence < 0.7)

  const flagged = useMemo(() => queue.filter((r) => flaggedFieldsOf(r).length > 0), [queue])

  const rows = filter === 'FLAGGED' ? flagged : queue

  const flaggedCount = (r: LandRecord) => flaggedFieldsOf(r).length

  const columns: Column<LandRecord>[] = [
    {
      key: 'record',
      header: t('records.recordNumber'),
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.recordNumber}</p>
          <p className="text-[11px] text-ink-faint">{r.village}, {r.district}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: t('records.ownerName'),
      render: (r) => (
        <p className="font-medium text-ink">
          {r.ownerName}
          {r.ownerNameTamil ? <span className="ml-1.5 font-tamil text-ink-muted">{r.ownerNameTamil}</span> : null}
        </p>
      ),
    },
    {
      key: 'survey',
      header: t('records.surveyNumber'),
      render: (r) => <span className="numeric font-mono text-[12.5px] text-ink">{r.surveyNumber}</span>,
    },
    {
      key: 'flagged',
      header: `${t('verification.flaggedFields')} (${t('verification.title')})`,
      render: (r) => <span className="font-semibold text-warning">{flaggedCount(r)} flagged</span>,
    },
    {
      key: 'confidence',
      header: t('records.confidence'),
      render: (r) => <ConfidenceBadge value={r.verifyConfidence} />,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'updated',
      header: t('common.date'),
      render: (r) => <span className="text-[12px] text-ink-muted">{formatDate(r.updatedAt)}</span>,
    },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: (r) => (
        <Button size="sm" variant="outline" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => navigate(`/verification/${r.id}`)}>
          {t('common.view')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('verification.title')}
        subtitle="Every flagged record is evidence-backed. Preview the source, accept or correct, capture your reason."
        actions={
          <>
            <Button variant={filter === 'FLAGGED' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('FLAGGED')}>
              {t('verification.reviewFlagged')} ({flagged.length})
            </Button>
          </>
        }
      />

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="mb-4" />
      ) : (
      <>
      <Card bare padded={false} className="ring-line overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          loading={isLoading}
          emptyState={
            <EmptyState
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Queue is clear"
              description="All records up to this point have been verified by officers."
            />
          }
        />
        <div className="border-t border-line px-4">
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / 200))}
            totalItems={data?.total ?? 0}
            pageSize={200}
            onPageChange={setPage}
          />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {queue.slice(0, 3).map((r) => {
          const fields = flaggedFieldsOf(r)
          return (
            <button
              key={r.id}
              onClick={() => navigate(`/verification/${r.id}`)}
              className="rounded-panel border border-line bg-surface p-4 text-left transition-colors hover:border-accent/40"
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink">{r.recordNumber}</p>
                <ConfidenceBadge value={r.verifyConfidence} />
              </div>
              <p className="mt-1 text-[12px] text-ink-muted">
                {r.ownerName} · S.No {r.surveyNumber} · {r.village}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {fields.slice(0, 3).map((f) => (
                  <span
                    key={f.key}
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      (f.confidence ?? 1) < 0.5 ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'
                    }`}
                  >
                    {f.label} · {formatConfidence(f.confidence)}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      </>
      )}
    </div>
  )
}