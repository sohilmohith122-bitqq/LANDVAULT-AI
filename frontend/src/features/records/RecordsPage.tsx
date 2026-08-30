import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollText, Download } from 'lucide-react'
import { Button, Card, DataTable, EmptyState, Pagination, type Column } from '@/components/ui'
import { ConfidenceBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/AppShell'
import { useRecords } from '@/lib/queries'
import { QueryError } from '@/components/QueryFeedback'
import { formatDate } from '@/lib/utils'
import type { LandRecord } from '@/types'
import { StatusBadge } from '@/features/dashboard/shared/StatusBadge'

export default function RecordsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q')?.toLowerCase() ?? ''
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string | null>('updatedAt')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, error, refetch } = useRecords({ page, pageSize: 200 })

  const filtered = useMemo(() => {
    let rows = data?.items ?? []
    if (query) {
      rows = rows.filter(
        (r) =>
          r.surveyNumber.toLowerCase().includes(query) ||
          r.ownerName.toLowerCase().includes(query) ||
          r.village.toLowerCase().includes(query) ||
          r.recordNumber.toLowerCase().includes(query),
      )
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort as keyof LandRecord]
        const bv = b[sort as keyof LandRecord]
        if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av
        return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    }
    return rows
  }, [data, query, sort, dir])

  const columns: Column<LandRecord>[] = [
    {
      key: 'recordNumber',
      header: t('records.recordNumber'),
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.recordNumber}</p>
          <p className="text-[11px] text-ink-faint">{r.documentType.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'ownerName',
      header: t('records.ownerName'),
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">
            {r.ownerName}
            {r.ownerNameTamil ? <span className="ml-1.5 font-tamil text-ink-muted">{r.ownerNameTamil}</span> : null}
          </p>
          {r.coOwners.length > 0 ? <p className="text-[11px] text-ink-faint">+{r.coOwners.length} co-owner(s)</p> : null}
        </div>
      ),
    },
    {
      key: 'surveyNumber',
      header: t('records.surveyNumber'),
      sortable: true,
      render: (r) => <span className="numeric font-mono text-[12.5px] font-medium text-ink">{r.surveyNumber}</span>,
    },
    {
      key: 'location',
      header: t('records.village'),
      render: (r) => (
        <div className="text-[12px]">
          <p className="text-ink">{r.village}, {r.taluk}</p>
          <p className="text-ink-faint">{r.district}</p>
        </div>
      ),
    },
    {
      key: 'area',
      header: t('records.area'),
      align: 'right',
      sortable: true,
      render: (r) => <span className="numeric text-[12.5px] font-medium text-ink">{r.area} {r.areaUnit}</span>,
    },
    {
      key: 'verification',
      header: t('records.confidence'),
      render: (r) => <ConfidenceBadge value={r.verifyConfidence} />,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'updatedAt',
      header: t('common.date'),
      sortable: true,
      render: (r) => (
        <div className="text-[12px]">
          <p className="text-ink-muted">{formatDate(r.updatedAt)}</p>
          <p className="text-[11px] text-ink-faint">{r.recordNumber.split('-').slice(0, 2).join('-')}</p>
        </div>
      ),
    },
  ]

  const handleSort = (key: string) => {
    if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(key)
      setDir('asc')
    }
  }
return (
    <div>
      <PageHeader
        title={t('records.title')}
        subtitle="Digitized, extracted and verified land records with full provenance."
        actions={
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" aria-hidden />}>
            Export CSV
          </Button>
        }
      />

      {query ? (
        <Card bare className="mb-4 ring-line">
          <div className="flex items-center gap-2 p-3 text-[13px]">
            <ScrollText className="h-4 w-4 text-accent" aria-hidden />
            <span>
              Search results for <strong className="text-ink">&ldquo;{query}&rdquo;</strong> — {filtered.length} record(s)
            </span>
          </div>
        </Card>
      ) : null}

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="mb-4" />
      ) : (
      <Card bare padded={false} className="ring-line overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(r) => r.id}
          onRowClick={(r) => navigate(`/verification/${r.id}`)}
          sortKey={sort}
          sortDir={dir}
          onSort={handleSort}
          loading={isLoading}
          emptyState={
            <EmptyState
              icon={<ScrollText className="h-5 w-5" />}
              title="No records found"
              description="Try adjusting your search or filters."
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
      )}

      <p className="mt-3 text-center text-[11.5px] text-ink-faint">
        Select a row to open it in the verification workspace.
      </p>
    </div>
  )
}