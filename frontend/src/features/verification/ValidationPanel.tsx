import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui'
import { Progress } from '@/components/ui/Progress'
import type { LandRecord, ValidationResult } from '@/types'
import { severityTone } from '@/features/dashboard/shared/StatusBadge'
import { cn } from '@/lib/utils'

const statusIcon = {
  PASS: CheckCircle2,
  WARNING: AlertTriangle,
  CONFLICT: AlertCircle,
  REVIEW_REQUIRED: HelpCircle,
} as const

const statusCls = {
  PASS: 'text-success bg-success-bg',
  WARNING: 'text-warning bg-warning-bg',
  CONFLICT: 'text-danger bg-danger-bg',
  REVIEW_REQUIRED: 'text-warning bg-warning-bg',
} as const

export function ValidationPanel({
  validation,
  record,
}: {
  validation: ValidationResult[]
  record: LandRecord
  hidden: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  const conflicts = validation.filter((v) => v.status === 'CONFLICT').length
  const warnings = validation.filter((v) => v.status === 'WARNING' || v.status === 'REVIEW_REQUIRED').length
  const passed = validation.filter((v) => v.status === 'PASS').length

  if (validation.length === 0) {
    return (
      <Card bare className="ring-line">
        <div className="flex items-center gap-3 p-4">
          <ShieldAlert className="h-5 w-5 text-ink-faint" aria-hidden />
          <p className="text-[13px] text-ink-muted">No validation results available for this record yet.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card bare className="ring-line overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={open}>
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-ink" aria-hidden />
          <span className="text-[14px] font-semibold text-ink">{t('verification.validation')}</span>
          <StatusChip tone="success" className={cn(passed === 0 && 'hidden')}>
            {passed} pass
          </StatusChip>
          <StatusChip tone="warning" className={cn(warnings === 0 && 'hidden')}>
            {warnings} warning
          </StatusChip>
          <StatusChip tone="danger" className={cn(conflicts === 0 && 'hidden')}>
            {conflicts} conflict
          </StatusChip>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-ink-faint transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open ? (
        <div className="border-t border-line">
          {/* Overall score */}
          <div className="flex items-center gap-4 border-b border-line bg-surface-muted/40 px-4 py-3">
            <div className="w-full max-w-[220px]">
              <Progress
                value={validation.length === 0 ? 0 : (passed / validation.length) * 100}
                tone={conflicts > 0 ? 'danger' : warnings > 0 ? 'warning' : 'success'}
                showLabel
              />
            </div>
            <p className="text-[11.5px] leading-snug text-ink-faint">
              Rule-engine verdict for {record.recordNumber}. <strong className="text-ink">Review required</strong> on any warning or conflict before verification.
            </p>
          </div>

          <div className="divide-y divide-line/60">
            {validation.map((v) => {
              const Icon = statusIcon[v.status]
              return (
                <div key={v.ruleId} className="flex items-start gap-3 px-4 py-3">
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', statusCls[v.status])}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{v.message}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-faint">
                      <span className="font-mono">{v.ruleId}</span>
                      <span>·</span>
                      <span>{v.category.replace(/_/g, ' ')}</span>
                      {v.affectedField ? (
                        <>
                          <span>·</span>
                          <span className="font-medium text-ink-muted">{v.affectedField}</span>
                        </>
                      ) : null}
                    </p>
                    {Object.keys(v.evidence).length > 0 ? (
                      <p className="mt-1 font-mono text-[10.5px] text-ink-faint">{JSON.stringify(v.evidence)}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function StatusChip({ tone, className, children }: { tone: 'success' | 'warning' | 'danger'; className?: string; children: React.ReactNode }) {
  const cls =
    tone === 'success'
      ? 'bg-success-bg text-success'
      : tone === 'warning'
        ? 'bg-warning-bg text-warning'
        : 'bg-danger-bg text-danger'
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', cls, className)}>{children}</span>
}