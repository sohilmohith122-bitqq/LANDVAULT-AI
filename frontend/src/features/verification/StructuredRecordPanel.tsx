import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Pencil, X, Flag, MapPin, BadgeCheck, ShieldAlert } from 'lucide-react'
import { Badge, ConfidenceBadge, Button, Input, toast } from '@/components/ui'
import type { ExtractedField, LandRecord } from '@/types'
import { cn } from '@/lib/utils'

type FieldStatus = ExtractedField['status']

const TAMIL_LABELS: Record<string, string> = {
  owner_name: 'உரிமையாளர்',
  survey_number: 'சர்வே எண்',
  area: 'பரப்பளவு',
  village: 'கிராமம்',
  taluk: 'தாலுகா',
  district: 'மாவட்டம்',
}

const HAS_TAMIL = /[஀-௺]/

/** Acres <-> Hectares (1 ha = 2.47105 ac) for the indicative GIS comparison */
function toHectares(value: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('hect')) return value
  if (u.startsWith('acre')) return value / 2.47105
  return value
}

export function StructuredRecordPanel({
  record,
  activeField,
  onFieldSelect,
  canVerify,
  parcelArea,
}: {
  record: LandRecord
  activeField: string | null
  onFieldSelect: (key: string) => void
  canVerify: boolean
  parcelArea: { value: number; unit: string } | null
}) {
  const { t } = useTranslation()
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [statuses, setStatuses] = useState<Record<string, FieldStatus>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [verified, setVerified] = useState(false)

  const statusOf = (f: ExtractedField): FieldStatus => statuses[f.key] ?? f.status
  const isFlagged = (f: ExtractedField) => statusOf(f) === 'REVIEW_REQUIRED' || (f.confidence !== null && f.confidence < 0.7)
  const sorted = [...record.fields].sort((a, b) => Number(isFlagged(b)) - Number(isFlagged(a)))
  const flaggedCount = record.fields.filter(isFlagged).length

  const setStatus = (key: string, s: FieldStatus) => setStatuses((p) => ({ ...p, [key]: s }))

  const startEdit = (f: ExtractedField) => {
    setEditing(f.key)
    setEditValue(overrides[f.key] ?? f.value ?? '')
  }

  const saveEdit = (key: string) => {
    if (editValue.trim()) {
      setOverrides((p) => ({ ...p, [key]: editValue.trim() }))
      setStatus(key, 'CORRECTED')
      toast.success('Correction recorded', 'The original AI value is preserved in field history.')
    }
    setEditing(null)
  }

  const act = (f: ExtractedField, s: FieldStatus) => {
    setStatus(f.key, s)
    if (s === 'ACCEPTED') toast.success(`Accepted — ${f.label}`)
    if (s === 'REJECTED') toast.warning(`Rejected — ${f.label}`, 'The AI value is retained as evidence; enter a corrected value.')
    if (s === 'REVIEW_REQUIRED') toast.info(`Review requested — ${f.label}`)
  }

  /* Indicative GIS area comparison — never a legal determination */
  let gis: { consistent: boolean; diffPct: number } | null = null
  if (parcelArea) {
    const recordHa = toHectares(record.area, record.areaUnit)
    const parcelHa = toHectares(parcelArea.value, parcelArea.unit)
    const diffPct = recordHa > 0 ? (Math.abs(recordHa - parcelHa) / recordHa) * 100 : 0
    gis = { consistent: diffPct <= 2, diffPct }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-panel bg-surface ring-1 ring-line">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13.5px] font-semibold text-ink">{t('verification.structuredRecord')}</h3>
          {flaggedCount > 0 ? (
            <Badge tone="warning" size="xs" dot>{flaggedCount} {t('verification.flaggedFields')}</Badge>
          ) : (
            <Badge tone="success" size="xs" dot>All clear</Badge>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-ink-faint">
          {flaggedCount > 0 ? 'Low-confidence fields are listed first.' : 'Every field links to its source in the document.'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-line">
          {sorted.map((f) => {
            const status = statusOf(f)
            const value = overrides[f.key] ?? f.value
            const active = activeField === f.key
            const flagged = isFlagged(f)
            return (
              <li key={f.key} className={cn(
                'border-l-2 transition-colors',
                active ? 'border-l-accent bg-accent-soft/40'
                  : flagged ? 'border-l-warning'
                  : status === 'CORRECTED' ? 'border-l-success' : 'border-l-transparent',
              )}>
                <button type="button" onClick={() => onFieldSelect(f.key)} className="w-full px-4 py-3 text-left" aria-expanded={active}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      {f.label}
                      {TAMIL_LABELS[f.key] ? <span className="font-tamil ml-1.5 font-normal normal-case tracking-normal text-ink-faint/80">{TAMIL_LABELS[f.key]}</span> : null}
                    </span>
                    <ConfidenceBadge value={f.confidence} />
                  </div>
                  {editing === f.key ? (
                    <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus className="h-8" />
                      <Button size="sm" onClick={() => saveEdit(f.key)} aria-label="Save correction"><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)} aria-label="Cancel edit"><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={cn('truncate text-[15px] font-semibold', value ? 'text-ink' : 'text-ink-faint', HAS_TAMIL.test(value ?? '') && 'font-tamil')}>
                        {value ?? 'Not extracted'}
                      </p>
                      {overrides[f.key] ? <Badge tone="success" size="xs">corrected</Badge>
                        : status === 'REJECTED' ? <Badge tone="danger" size="xs">rejected</Badge>
                        : status === 'ACCEPTED' ? <Badge tone="neutral" size="xs">accepted</Badge>
                        : flagged ? <Badge tone="warning" size="xs">review</Badge> : null}
                    </div>
                  )}
                  {f.sourceText ? (
                    <p className="mt-1 truncate font-mono text-[10.5px] text-ink-faint">&ldquo;{f.sourceText}&rdquo; · p{f.sourcePage ?? '?'}</p>
                  ) : null}
                </button>

                {active && canVerify && editing !== f.key ? (
                  <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
                    <Button size="sm" variant="quiet" onClick={() => act(f, 'ACCEPTED')}><Check className="h-3.5 w-3.5 text-success" />{t('verification.accept')}</Button>
                    <Button size="sm" variant="quiet" onClick={() => startEdit(f)}><Pencil className="h-3.5 w-3.5" />{t('common.edit')}</Button>
                    <Button size="sm" variant="quiet" onClick={() => act(f, 'REJECTED')}><X className="h-3.5 w-3.5 text-danger" />{t('verification.reject')}</Button>
                    <Button size="sm" variant="quiet" onClick={() => act(f, 'REVIEW_REQUIRED')}><Flag className="h-3.5 w-3.5 text-warning" />{t('verification.requestReview')}</Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>

        {parcelArea && gis ? (
          <div className={cn('m-3 rounded-panel border p-3.5', gis.consistent ? 'border-success/25 bg-success-bg/60' : 'border-warning/30 bg-warning-bg')}>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> GIS parcel comparison
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div><p className="text-ink-faint">Record area</p><p className="numeric font-semibold text-ink">{record.area} {record.areaUnit}</p></div>
              <div><p className="text-ink-faint">Parcel (GIS) area</p><p className="numeric font-semibold text-ink">{parcelArea.value} {parcelArea.unit}</p></div>
            </div>
            <p className={cn('mt-2 text-[11.5px] font-medium', gis.consistent ? 'text-success' : 'text-warning')}>
              {gis.consistent ? `Areas consistent (difference ${gis.diffPct.toFixed(1)}%)` : `Information mismatch — review required (difference ${gis.diffPct.toFixed(1)}%)`}
            </p>
            <p className="mt-1 text-[10.5px] text-ink-faint">Indicative only — GIS comparison does not establish legal ownership or validity.</p>
          </div>
        ) : null}

        {verified ? (
          <div className="mx-3 mb-3 rounded-panel border border-success/25 bg-success-bg p-3.5">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-success">
              <BadgeCheck className="h-4 w-4" aria-hidden /> {t('verification.approved')}
            </p>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              Verifier identity, timestamp, preserved AI values and every correction were recorded as audit events.
            </p>
          </div>
        ) : null}
      </div>

      {canVerify ? (
        <div className="flex items-center gap-2 border-t border-line px-4 py-3">
          <Button size="sm" fullWidth onClick={() => { setVerified(true); toast.success('Record verified', 'Verifier, timestamp and audit event recorded.') }}>
            <BadgeCheck className="h-4 w-4" aria-hidden /> {t('verification.verifyRecord')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.warning('Record escalated', 'Assigned to the Conflict Center for investigation.')}>
            <ShieldAlert className="h-4 w-4" aria-hidden /> Escalate
          </Button>
        </div>
      ) : null}
    </div>
  )
}
