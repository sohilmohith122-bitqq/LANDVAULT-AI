import { ScanLine } from 'lucide-react'
import { CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useTranslation } from 'react-i18next'
import { useStats } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'
import { cn } from '@/lib/utils'

export function PipelineViz() {
  const { t } = useTranslation()
  const { data: stats, isLoading, error, refetch } = useStats()

  return (
    <div className="p-5">
      <CardHeader
        title={t('dashboard.pipeline')}
        subtitle={t('dashboard.pipelineHint')}
        action={<Badge tone="accent">Live</Badge>}
      />
      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="mt-4" />
      ) : isLoading ? (
        <QueryLoading rows={3} className="mt-6" />
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-2">
            {(stats?.pipeline ?? []).map((stage, i, arr) => {
              const max = Math.max(...arr.map((s) => s.count), 1)
              return (
                <div key={stage.stage} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full items-end justify-center" style={{ height: 120 }}>
                    <div
                      className={cn(
                        'w-full max-w-[60px] rounded-t-[6px] transition-all duration-500',
                        i === arr.length - 1 ? 'bg-success' : i === 0 ? 'bg-line-strong' : 'bg-accent',
                      )}
                      style={{ height: Math.max(12, (stage.count / max) * 100) }}
                    />
                    <span className="numeric absolute -top-1 text-[11px] font-bold text-ink">{stage.count}</span>
                  </div>
                  <span className={cn('whitespace-nowrap text-[11px] font-medium', i === arr.length - 1 ? 'text-success' : 'text-ink-muted')}>
                    {stage.stage}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-field bg-surface-muted/60 px-4 py-2.5 text-[12px] text-ink-muted">
            <ScanLine className="h-4 w-4 text-accent" aria-hidden />
            {stats ? (
              <>
                Throughput this week: <strong className="text-ink">{stats.documentsThisWeek} documents</strong>
                {stats.avgProcessingHours !== null ? <> · avg {stats.avgProcessingHours} h per document</> : null}
              </>
            ) : (
              'Throughput data unavailable'
            )}
          </div>
        </>
      )}
    </div>
  )
}