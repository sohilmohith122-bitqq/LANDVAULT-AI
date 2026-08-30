import { Layers, BadgeCheck, AlertTriangle, ScanLine, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useActivity } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

const toneBg: Record<string, string> = {
  upload: 'bg-accent-soft text-accent',
  extraction: 'bg-info-bg text-info',
  verification: 'bg-success-bg text-success',
  conflict: 'bg-danger-bg text-danger',
  correction: 'bg-warning-bg text-warning',
  validation: 'bg-warning-bg text-warning',
  default: 'bg-surface-muted text-ink-faint',
}

function ActivityIcon({ type }: { type: string }) {
  const cls = 'h-3.5 w-3.5'
  switch (type) {
    case 'upload':
      return <Layers className={cls} />
    case 'extraction':
      return <ScanLine className={cls} />
    case 'verification':
      return <BadgeCheck className={cls} />
    case 'conflict':
      return <AlertTriangle className={cls} />
    default:
      return <Sparkles className={cls} />
  }
}

export function ActivityPanel() {
  const { t } = useTranslation()
  const { data: activity, isLoading, error, refetch } = useActivity()

  return (
    <Card bare className="ring-line">
      <CardHeader title={t('dashboard.recentActivity')} />
      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} className="px-1" />
      ) : isLoading ? (
        <QueryLoading rows={5} className="px-1" />
      ) : (activity?.length ?? 0) === 0 ? (
        <p className="py-8 text-center text-[12.5px] text-ink-faint">No recent activity.</p>
      ) : (
        <div className="divide-y divide-line/70">
          {activity!.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-1 py-3">
              <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', toneBg[a.type])}>
                <ActivityIcon type={a.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{a.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">{a.description}</p>
              </div>
              <span className="shrink-0 text-[11px] text-ink-faint">{timeAgo(a.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}