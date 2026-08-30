import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, X, ArrowUpRight, History } from 'lucide-react'
import { Button, Card, CardHeader, Badge, Input, Field } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toaster'
import { useConflict, useRecord, useParcels, useAudit, useResolveConflict } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'
import { getApiErrorMessage } from '@/components/QueryFeedback'
import { timeAgo } from '@/lib/utils'
import { useAuthStore, can } from '@/stores/auth'
import { useState } from 'react'
import { ConflictStatusBadge, SeverityBadge, CategoryBadge } from './ConflictBadges'

export default function ConflictDetailPage() {
  const { t } = useTranslation()
  const { conflictId } = useParams<{ conflictId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [commitOpen, setCommitOpen] = useState(false)
  const [commitAction, setCommitAction] = useState<'RESOLVE' | 'DISMISS'>('RESOLVE')
  const [note, setNote] = useState('')

  /* Hooks run unconditionally; dependent queries are enabled by data availability. */
  const conflictQuery = useConflict(conflictId)
  const conflict = conflictQuery.data
  const recordQuery = useRecord(conflict?.recordId)
  const parcelsQuery = useParcels(conflict ? { recordId: conflict.recordId } : {})
  const auditQuery = useAudit(conflict ? { recordId: conflict.recordId, pageSize: 50 } : {})
  const resolveMutation = useResolveConflict(conflictId ?? '')

  if (conflictQuery.isLoading) {
    return (
      <div className="space-y-4">
        <QueryLoading rows={6} />
      </div>
    )
  }

  if (conflictQuery.error || !conflict) {
    return (
      <div className="p-10 text-center">
        <QueryError error={conflictQuery.error} onRetry={() => void conflictQuery.refetch()} />
        <Button variant="outline" className="mt-4" onClick={() => navigate('/conflicts')}>Back to conflicts</Button>
      </div>
    )
  }

  const record = recordQuery.data
  const parcel =
    (parcelsQuery.data ?? []).find((p) => p.id === (conflict.evidence.parcel as string | undefined)) ??
    (parcelsQuery.data ?? []).find((p) => p.recordId === conflict.recordId)
  const relatedAudit = (auditQuery.data?.items ?? []).filter(
    (ev) => ev.recordId === conflict.recordId || ev.documentId === conflict.documentId,
  )
  const canAct = can(user, 'resolve')

  const openCommit = (action: 'RESOLVE' | 'DISMISS') => {
    setCommitAction(action)
    setCommitOpen(true)
  }

  const commit = () => {
    resolveMutation.mutate(
      { action: commitAction, note: note || undefined },
      {
        onSuccess: () => {
          setCommitOpen(false)
          setNote('')
          toast.success(
            commitAction === 'RESOLVE' ? 'Conflict resolved' : 'Conflict dismissed',
            commitAction === 'RESOLVE' ? 'Resolution recorded with evidence reference.' : 'Conflict dismissed with official note.',
          )
        },
        onError: (err) => {
          toast.danger('Action failed', getApiErrorMessage(err))
        },
      },
    )
  }
return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/conflicts')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('conflicts.title')}
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h-page">{conflict.category.replace(/_/g, ' ')}</h1>
            <SeverityBadge severity={conflict.severity} />
            <ConflictStatusBadge status={conflict.status} />
          </div>
          <p className="body-muted mt-1.5 max-w-2xl">{conflict.description}</p>
        </div>
        {canAct ? (
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<X className="h-4 w-4" />} onClick={() => openCommit('DISMISS')} disabled={conflict.status === 'DISMISSED' || conflict.status === 'RESOLVED'}>
              {t('conflicts.dismiss')}
            </Button>
            <Button leftIcon={<Check className="h-4 w-4" />} onClick={() => openCommit('RESOLVE')} disabled={conflict.status === 'DISMISSED' || conflict.status === 'RESOLVED'}>
              {t('conflicts.resolve')}
            </Button>
            <Button variant="secondary" leftIcon={<ArrowUpRight className="h-4 w-4" />}>
              {t('conflicts.escalate')}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Grid: evidence | record | GIS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card bare className="ring-line">
          <CardHeader title="Extracted vs reference" subtitle="What the AI read versus the source of truth" />
          <Comparison
            flow={[
              { label: 'AI extracted value', value: conflict.extractedValue ?? '—', source: `Source: ${conflict.field}` },
              { label: 'Reference value', value: conflict.referenceValue ?? '—', source: 'Existing record / GIS corpus' },
            ]}
          />
          <div className="mt-4 rounded-panel border border-line bg-surface-muted/40 p-3">
            <p className="label">Evidence</p>
            <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-muted">
              {JSON.stringify(conflict.evidence, null, 2)}
            </pre>
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title={`Related record · ${conflict.recordId}`} subtitle={record ? `${record.ownerName} · S.No ${record.surveyNumber}` : 'Record removed'} />
          {record ? (
            <div className="space-y-2.5">
              <Row label="Owner" value={record.ownerName} />
              <Row label="Survey number" value={record.surveyNumber} mono />
              <Row label="Area (text)" value={`${record.area} ${record.areaUnit}`} />
              <Row label="Village / Taluk" value={`${record.village} / ${record.taluk}`} />
              <Row label="Document" value={record.documentType.replace(/_/g, ' ')} />
              <Button variant="outline" size="sm" fullWidth className="mt-2" onClick={() => navigate(`/verification/${record.id}`)}>
                Open in verification workspace
              </Button>
            </div>
          ) : null}
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="GIS parcel" subtitle={parcel ? 'Spatial match found' : 'No spatial match for this conflict'} />
          {parcel ? (
            <div className="space-y-2.5">
              <Row label="Parcel ID" value={parcel.parcelId} mono />
              <Row label="Survey" value={`${parcel.surveyNumber}${parcel.subdivisionNumber ? '/' + parcel.subdivisionNumber : ''}`} />
              <Row label="Area (GIS)" value={`${parcel.area} ${parcel.areaUnit}`} />
              <div className="flex items-center gap-2 rounded-field bg-surface-muted/40 px-3 py-2 text-[12px]">
                <CategoryBadge category={conflict.category} />
                <span className="ml-auto">
                  {Math.abs((record?.area ?? 0) - parcel.area) > 0.05 ? 'Area divergence noted' : 'Area within tolerance'}
                </span>
              </div>
              <Button variant="outline" size="sm" fullWidth className="mt-1" onClick={() => navigate('/gis')}>
                View parcel on map
              </Button>
            </div>
          ) : (
            <p className="text-[12.5px] text-ink-faint">No GIS parcel is linked to this record yet.</p>
          )}
        </Card>
      </div>
{/* Audit history for the conflict */}
      <Card bare className="ring-line">
        <CardHeader title="Audit history" subtitle={`Events touching ${conflict.recordId}`} />
        <div className="divide-y divide-line/60">
          {relatedAudit.length > 0 ? (
            relatedAudit.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 py-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-faint">
                  <History className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink">{ev.action.replace(/_/g, ' ')}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {ev.userName} ({ev.userRole}) · {timeAgo(ev.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-[12px] text-ink-faint">No audit events for this record.</p>
          )}
        </div>
      </Card>

      {/* Resolve / dismiss confirmation */}
      <Modal
        open={commitOpen}
        onClose={() => setCommitOpen(false)}
        title={commitAction === 'RESOLVE' ? 'Resolve this conflict' : 'Dismiss this conflict'}
        description={`Record an official ${commitAction.toLowerCase()} action. Every action is written to the immutable audit trail.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCommitOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={commit}>{commitAction === 'RESOLVE' ? 'Confirm resolution' : 'Confirm dismissal'}</Button>
          </>
        }
      >
        <Field label="Official note (recommended)" hint="This note becomes part of the permanent audit record.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Verified against village register 2012 folio 88" />
        </Field>
      </Modal>
    </div>
  )
}

function Comparison({ flow }: { flow: { label: string; value: string; source: string }[] }) {
  return (
    <div className="space-y-3">
      {flow.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{item.label}</p>
            {i === 0 ? <Badge tone="warning" size="xs">AI</Badge> : <Badge tone="accent" size="xs">Reference</Badge>}
          </div>
          <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-ink">
            {item.value}
            {i === 0 ? <ArrowUpRight className="h-4 w-4 text-warning" aria-hidden /> : null}
          </p>
          <p className="text-[11px] text-ink-faint">{item.source}</p>
          {i === 0 ? (
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-danger">
              <span className="h-px w-6 bg-danger/50" />
              vs {flow[1]?.value ?? '—'}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/50 pb-2 last:border-0">
      <span className="text-[12px] text-ink-faint">{label}</span>
      <span className={mono ? 'font-mono text-[12.5px] font-medium text-ink' : 'text-[12.5px] font-medium text-ink'}>{value}</span>
    </div>
  )
}