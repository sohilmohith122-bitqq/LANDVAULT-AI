import { Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, Badge, Progress } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import type { DocumentRecord } from '@/types'

export function DocumentsPanel({ documents }: { documents: DocumentRecord[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card bare className="ring-line">
      <CardHeader title={t('documents.title')} subtitle={`${documents.length} recently uploaded`} />
      <div className="space-y-2.5">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => navigate('/documents')}
            className="flex w-full items-center gap-3 rounded-field border border-line px-3 py-2.5 text-left transition-colors hover:border-accent/40 hover:bg-surface-muted/40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel bg-surface-muted text-ink-faint">
              <Layers className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-ink">{doc.filename}</p>
              <p className="text-[11px] text-ink-muted">
                {doc.documentType.replace(/_/g, ' ')} · {doc.district}
              </p>
            </div>
            {doc.status === 'PREPROCESSING' || doc.status === 'EXTRACTION' ? (
              <div className="w-14">
                <Progress value={doc.progress} showLabel />
              </div>
            ) : doc.ocrConfidence ? (
              <Badge tone={doc.ocrConfidence > 0.85 ? 'success' : 'warning'} size="xs">
                {Math.round(doc.ocrConfidence * 100)}%
              </Badge>
            ) : (
              <Badge tone="neutral" size="xs">
                {doc.status.replace(/_/g, ' ')}
              </Badge>
            )}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center">
        <button onClick={() => navigate('/documents')} className="text-[12.5px] font-semibold text-accent hover:text-accent-strong">
          {t('nav.documents')} →
        </button>
      </p>
    </Card>
  )
}