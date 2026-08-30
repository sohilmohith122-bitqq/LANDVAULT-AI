import { Card, CardHeader, Progress } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useStats } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'

export function GeoPanel() {
  const { t } = useTranslation()
  const { data: stats, isLoading, error, refetch } = useStats()

  return (
    <Card bare className="ring-line">
      <CardHeader title={t('dashboard.geoDistribution')} subtitle={t('dashboard.errorRateByDistrict')} />
      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <QueryLoading rows={5} />
      ) : (stats?.errorsByDistrict.length ?? 0) === 0 ? (
        <p className="py-6 text-center text-[12px] text-ink-faint">No district quality data yet.</p>
      ) : (
        <div className="space-y-3">
          {stats!.errorsByDistrict.map((d) => (
            <div key={d.district} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-[12.5px] font-medium text-ink">{d.district}</span>
              <Progress
                value={d.errorRate * 100}
                tone={d.errorRate > 0.18 ? 'danger' : d.errorRate > 0.13 ? 'warning' : 'default'}
                showLabel
              />
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 pt-1 text-[11.5px] leading-relaxed text-ink-faint">
        Error rate = share of extracted fields that required human correction in the last 30 days.
      </p>
    </Card>
  )
}