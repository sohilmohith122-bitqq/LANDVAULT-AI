import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Upload, FileText } from 'lucide-react'
import { Button, Card, DataTable, Badge, EmptyState, Progress, Pagination, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useDocuments } from '@/lib/queries'
import { TN_DISTRICTS, DOCUMENT_TYPE_OPTIONS } from '@/lib/reference/geo'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'
import { useAuthStore, can } from '@/stores/auth'
import { formatDate } from '@/lib/utils'
import type { DocumentRecord, DocumentType } from '@/types'

export default function DocumentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [page, setPage] = useState(1)
  const [district, setDistrict] = useState('ALL')
  const [type, setType] = useState('ALL')

  const { data, isLoading, error, refetch } = useDocuments({
    district: district === 'ALL' ? undefined : district,
    documentType: type === 'ALL' ? '' : (type as DocumentType),
    page,
    pageSize: 10,
  })
  const filtered = data?.items ?? []

  const columns: Column<DocumentRecord>[] = [
    {
      key: 'reference',
      header: t('documents.filename'),
      render: (doc) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel bg-accent-soft text-accent">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{doc.filename}</p>
            <p className="text-[11px] text-ink-faint">{doc.referenceNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('documents.type'),
      render: (doc) => <span className="text-[12.5px] text-ink-muted">{doc.documentType.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'language',
      header: t('documents.language'),
      render: (doc) => (
        <Badge tone="neutral" size="xs">
          {doc.language.map((l) => (l === 'ta' ? 'தமிழ்' : 'English')).join(' · ')}
        </Badge>
      ),
    },
    { key: 'location', header: t('records.district'), accessor: (doc) => <span className="text-[12.5px] text-ink-muted">{doc.district}</span> },
    { key: 'pages', header: t('documents.pages'), align: 'right', accessor: (doc) => <span className="numeric text-[12.5px] text-ink-muted">{doc.pageCount}</span> },
    {
      key: 'size',
      header: t('documents.size'),
      align: 'right',
      render: (doc) => <span className="numeric text-[12.5px] text-ink-muted">{(doc.fileSizeBytes / 1_048_576).toFixed(1)} MB</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (doc) => <DocumentStatusCell doc={doc} />,
    },
    {
      key: 'uploaded',
      header: t('documents.uploadedAt'),
      render: (doc) => (
        <div className="text-[12px]">
          <p className="text-ink-muted">{formatDate(doc.uploadedAt)}</p>
          <p className="text-ink-faint">{doc.uploadedBy}</p>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('documents.title')}
        subtitle="Every uploaded record is preserved in original form. AI outputs never overwrite the source."
        actions={
          can(user, 'upload') ? (
            <Button leftIcon={<Upload className="h-4 w-4" aria-hidden />} onClick={() => navigate('/upload')}>
              {t('nav.upload')}
            </Button>
          ) : null
        }
      />
{/* Filter bar */}
      <Card bare className="mb-4 ring-line">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <span className="label mr-1">{t('common.filter')}</span>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className="h-8 rounded-field border border-line-strong bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-accent">
            <option value="ALL">All districts</option>
            {TN_DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-8 rounded-field border border-line-strong bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-accent">
            <option value="ALL">All document types</option>
            {DOCUMENT_TYPE_OPTIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <span className="ml-auto text-[12px] text-ink-faint">
            {data?.total ?? 0} documents
          </span>
        </div>
      </Card>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="mb-4" />
      ) : (
        <Card bare padded={false} className="ring-line overflow-hidden">
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(r) => r.id}
            loading={isLoading}
            emptyState={<EmptyState icon={<FileText className="h-5 w-5" />} title="No documents" description="Uploaded documents will appear here with live processing status." />}
          />
          <div className="border-t border-line px-4">
            <Pagination page={page} totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / 10))} totalItems={data?.total ?? 0} pageSize={10} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  )
}

function DocumentStatusCell({ doc }: { doc: DocumentRecord }) {
  if (doc.status === 'PREPROCESSING' || doc.status === 'EXTRACTION' || doc.status === 'QUEUED') {
    return (
      <div className="flex w-28 items-center gap-2">
        <Progress value={doc.progress} />
        <span className="w-14 shrink-0 text-[11px] text-ink-faint">{doc.status.replace(/_/g, ' ')}</span>
      </div>
    )
  }
  if (doc.status === 'COMPLETED') {
    return <Badge tone="success" size="xs">Processed</Badge>
  }
  if (doc.status === 'REVIEW_REQUIRED') {
    return <Badge tone="warning" size="xs">Review required</Badge>
  }
  if (doc.status === 'FAILED') {
    return <Badge tone="danger" size="xs">Failed</Badge>
  }
  return <Badge tone="neutral" size="xs">{doc.status}</Badge>
}