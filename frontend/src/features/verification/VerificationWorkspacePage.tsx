import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useRecord, useRecordValidation, useParcels } from '@/lib/queries'
import { QueryLoading } from '@/components/QueryFeedback'
import { useAuthStore, can } from '@/stores/auth'
import type { LandRecord } from '@/types'
import { DocumentStage } from './DocumentStage'
import { OcrTextPanel } from './OcrTextPanel'
import { StructuredRecordPanel } from './StructuredRecordPanel'
import { ValidationPanel } from './ValidationPanel'
import { StatusBadge } from '@/features/dashboard/shared/StatusBadge'

export default function VerificationWorkspacePage() {
  const { t } = useTranslation()
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [activePage, setActivePage] = useState(1)

  /* All data comes from the backend — hooks are called unconditionally (rules of hooks). */
  const recordQuery = useRecord(recordId)
  const validationQuery = useRecordValidation(recordId)
  const parcelsQuery = useParcels(recordId ? { recordId } : {})

  if (recordQuery.isLoading || validationQuery.isLoading || parcelsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <QueryLoading rows={6} />
      </div>
    )
  }

  if (recordQuery.error || !recordQuery.data) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-ink-muted">Record not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/verification')}>
          Back to queue
        </Button>
      </div>
    )
  }

  const record = recordQuery.data
  const validation = validationQuery.data ?? []
  const parcel = (parcelsQuery.data ?? []).find((pd) => pd.recordId === record.id)
  const flaggedFields = record.fields.filter(
    (f) => f.confidence !== null && f.confidence < 0.7,
  )
  const canVerify = can(user, 'verify')

  return (
    <div className="space-y-4">
      {/* Row: back + header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/verification')}
          className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('verification.title')}
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={record.status} />
          <Badge tone="neutral">{record.recordNumber}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page">{t('verification.structuredRecord')}</h1>
          <p className="body-muted mt-1">
            S.No {record.surveyNumber} · {record.village}, {record.taluk} · {record.ownerName}
            {record.ownerNameTamil ? <span className="font-tamil">{` ${record.ownerNameTamil}`}</span> : null}
          </p>
        </div>
        {canVerify ? (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-faint">
              Field actions (accept · edit · reject) are in the Structured Record panel →
            </span>
          </div>
        ) : null}
      </div>

      {/* Flagged field banner */}
      {flaggedFields.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-warning/30 bg-warning-bg px-4 py-3">
          <div>
            <p className="text-[13.5px] font-semibold text-warning">
              {t('verification.reviewFlagged')} — {flaggedFields.length} {t('verification.flaggedFields')}
            </p>
            <p className="text-[12px] text-warning/80">
              {flaggedFields.map((f) => f.label).join(' · ')} — review each before approving this record.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveField(flaggedFields[0].key)}
            className="border-warning/40 text-warning hover:bg-warning-bg"
          >
            Review key field
          </Button>
        </div>
      ) : null}

      {/* The 3-pane workspace */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,10fr)_minmax(0,9fr)_minmax(0,7fr)]">
        <DocumentStage record={record} activeField={activeField} page={activePage} onPageChange={setActivePage} onFieldClick={setActiveField} />
        <OcrTextPanel record={record} activeField={activeField} onFieldClick={setActiveField} />
        <StructuredRecordPanel
          record={record}
          activeField={activeField}
          onFieldSelect={setActiveField}
          canVerify={canVerify}
          parcelArea={parcel ? { value: parcel.area, unit: parcel.areaUnit } : null}
        />
      </div>

      <ValidationPanel
        validation={validation}
        record={record}
        hidden={false}
      />
    </div>
  )
}