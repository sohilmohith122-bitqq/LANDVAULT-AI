import { ScrollText, FileDigit, BadgeCheck, Clock4, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useTranslation } from 'react-i18next'
import { useStats } from '@/lib/queries'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const kpis = [
  { key: 'totalRecords', icon: ScrollText, tone: 'accent' as const },
  { key: 'digitized', icon: FileDigit, tone: 'info' as const },
  { key: 'verified', icon: BadgeCheck, tone: 'success' as const },
  { key: 'pendingReview', icon: Clock4, tone: 'warning' as const },
  { key: 'conflicts', icon: AlertTriangle, tone: 'danger' as const },
]

const toneBg: Record<string, string> = {
  accent: 'bg-accent-soft text-accent',
  info: 'bg-info-bg text-info',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

export function KpiRow() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useStats()

  const values: Record<string, number | undefined> = {
    totalRecords: stats?.totalRecords,
    digitized: stats?.digitized,
    verified: stats?.verified,
    pendingReview: stats?.pendingReview,
    conflicts: stats?.conflicts,
  }

  const trends: Record<string, string> = {
    totalRecords: stats ? `${pct(stats.digitized, stats.totalRecords)}% digitized` : '—',
    digitized: stats ? `${pct(stats.verified, stats.digitized)}% verified` : '—',
    verified: stats ? `${Math.round((stats.correctionRate ?? 0) * 100)}% correction rate` : '—',
    pendingReview: 'focus now',
    conflicts: stats ? `${stats.documentsThisWeek} docs this week` : '—',
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.key} bare className="ring-line">
          <div className="flex items-start justify-between p-4">
            <div className="min-w-0">
              <p className="label truncate">{t(`dashboard.${kpi.key}`)}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-16" />
              ) : (
                <p className="numeric mt-1.5 text-[26px] font-bold leading-none text-ink">
                  {(values[kpi.key] ?? 0).toLocaleString('en-IN')}
                </p>
              )}
              <Badge tone={kpi.tone} size="xs" className="mt-2">
                {trends[kpi.key]}
              </Badge>
            </div>
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-panel', toneBg[kpi.tone])}>
              <kpi.icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}