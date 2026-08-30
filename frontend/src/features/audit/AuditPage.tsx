import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { History, Download, Search } from 'lucide-react'
import { Button, Card, DataTable, Badge, EmptyState, Pagination, Input, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useAudit } from '@/lib/queries'
import { QueryError } from '@/components/QueryFeedback'
import { timeAgo } from '@/lib/utils'
import type { AuditEvent } from '@/types'

const actionTone: Record<string, 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  DOCUMENT_UPLOAD: 'accent',
  OCR_COMPLETED: 'info',
  EXTRACTION_COMPLETED: 'info',
  VALIDATION_COMPLETED: 'info',
  CONFLICT_CREATED: 'danger',
  FIELD_ACCEPTED: 'success',
  RECORD_VERIFIED: 'success',
  FIELD_CORRECTED: 'warning',
}

export default function AuditPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useAudit({ pageSize: 200 })

  const rows = useMemo(() => {
    const items = data?.items ?? []
    const q = query.toLowerCase()
    return q
      ? items.filter(
          (ev) =>
            ev.action.toLowerCase().includes(q) ||
            ev.userName.toLowerCase().includes(q) ||
            (ev.recordId ?? '').toLowerCase().includes(q) ||
            (ev.field ?? '').toLowerCase().includes(q),
        )
      : items
  }, [data, query])

  const columns: Column<AuditEvent>[] = [
    {
      key: 'when',
      header: t('common.date'),
      render: (ev) => (
        <div>
          <p className="text-[12.5px] font-medium text-ink">{timeAgo(ev.timestamp)}</p>
          <p className="text-[11px] text-ink-faint">{new Date(ev.timestamp).toLocaleString('en-IN')}</p>
        </div>
      ),
    },
    {
      key: 'who',
      header: 'User',
      render: (ev) => (
        <div>
          <p className="text-[12.5px] font-medium text-ink">{ev.userName}</p>
          <Badge tone="neutral" size="xs" className="mt-0.5">{ev.userRole}</Badge>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (ev) => (
        <Badge tone={actionTone[ev.action] ?? 'neutral'} size="xs">
          {ev.action.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'context',
      header: 'Context',
      render: (ev) => (
        <div className="text-[11.5px]">
          <p className="font-mono text-ink-muted">{(ev.recordId ?? ev.documentId) ?? '—'}</p>
          {ev.field ? <p className="text-ink-faint">{ev.field}</p> : null}
        </div>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      render: (ev) => {
        if (ev.oldValue === null && ev.newValue === null) return <span className="text-ink-faint">—</span>
        return (
          <div className="max-w-[280px]">
            <p className="truncate font-mono text-[11px] text-ink-muted">
              {JSON.stringify(ev.newValue ?? ev.oldValue)}
            </p>
          </div>
        )
      },
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (ev) => <span className="text-[11.5px] text-ink-faint">{ev.reason ?? '—'}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('audit.title')}
        subtitle={t('audit.eventHistory')}
        actions={
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" aria-hidden />}>
            Export audit
          </Button>
        }
      />

      {/* Integrity notice */}
      <Card bare className="mb-4 ring-line">
        <div className="flex items-start gap-3 p-3.5">
          <History className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Audit events are append-only and hash-chained to prevent tampering. Each event records{' '}
            <span className="font-mono text-[11.5px] text-ink">event_id · timestamp · user · role · action · old_value · new_value · reason</span>.
          </p>
        </div>
      </Card>

      <Card bare padded={false} className="ring-line overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action, user, record…" className="pl-9" />
          </div>
        </div>
        {error ? (
          <QueryError error={error} onRetry={() => void refetch()} className="mx-4 my-3" />
        ) : (
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(ev) => ev.id}
          loading={isLoading}
          emptyState={<EmptyState icon={<History className="h-5 w-5" />} title="No audit events" description="Actions will appear here as they occur." />}
        />
        )}
        <div className="border-t border-line px-4">
          <Pagination page={page} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / 200))} totalItems={data?.total ?? 0} pageSize={200} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  )
}