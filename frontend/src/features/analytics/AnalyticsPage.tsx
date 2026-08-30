import { useTranslation } from 'react-i18next'
import { BarChart3, Info } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { Card, CardHeader, Badge, Alert, Tabs, useTabs } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useStats } from '@/lib/queries'
import { QueryError, QueryLoading } from '@/components/QueryFeedback'

const PIE_COLORS = ['#1c5c93', '#8891a1', '#b25309']

/** Honest analytics: AI confidence is not measured accuracy. Report only what we know. */
export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { active, setActive } = useTabs('operations')

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('analytics.title')}
        subtitle="Operational statistics come from the live corpus served by the API. Measured accuracy is reported only once labelled evaluation data exists."
      />

      <Tabs
        tabs={[
          { key: 'operations', label: 'Operations' },
          { key: 'accuracy', label: 'Model accuracy' },
          { key: 'quality', label: 'Extraction quality' },
        ]}
        active={active}
        onChange={setActive}
      />

      {active === 'operations' ? <OperationsTab /> : null}
      {active === 'accuracy' ? <AccuracyTab /> : null}
      {active === 'quality' ? <QualityTab /> : null}
    </div>
  )
}

const tooltipStyle = { borderRadius: 10, border: '1px solid #e1ddd5', fontSize: 12 }

function OperationsTab() {
  const { data: stats, isLoading, error, refetch } = useStats()

  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  if (isLoading) return <QueryLoading rows={6} />

  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card bare className="ring-line">
          <CardHeader title="Documents processed" subtitle="Last 6 weeks (rolling window)" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyVolume ?? []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1ddd5" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#8891a1' }} axisLine={{ stroke: '#cdc8bd' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8891a1' }} axisLine={false} tickLine={false} />
                <RTooltip cursor={{ fill: 'rgba(28,92,147,0.06)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="documents" fill="#1c5c93" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="Documents by type" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.documentsByType ?? []} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1ddd5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8891a1' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#5a6577' }} axisLine={{ stroke: '#cdc8bd' }} tickLine={false} width={110} />
                <RTooltip cursor={{ fill: 'rgba(28,92,147,0.06)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#476496" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="Documents by language" subtitle="Tamil and English are first-class" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.documentsByLanguage ?? []} dataKey="count" nameKey="language" outerRadius={90} innerRadius={46} paddingAngle={2}>
                  {(stats?.documentsByLanguage ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RTooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="Operational statistics" subtitle="Aggregated across the live corpus" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Metric label="Documents processed (30d)" value={stats ? String(stats.documentsThisWeek) : '—'} />
            <Metric label="Avg processing time" value={stats?.avgProcessingHours != null ? `${stats.avgProcessingHours} h` : '—'} />
            <Metric label="Avg verification time" value="—" />
            <Metric label="Pending review" value={stats ? stats.pendingReview.toLocaleString('en-IN') : '—'} />
            <Metric label="Low-confidence fields" value={stats ? `${(stats.lowConfidenceRate * 100).toFixed(1)}%` : '—'} />
            <Metric label="Human correction rate" value={stats ? `${(stats.correctionRate * 100).toFixed(1)}%` : '—'} />
          </dl>
          <Alert tone="info" title="Insufficient evaluation data" className="mt-4">
            Correction rate and low-confidence share are operational statistics — they are not model accuracy.
          </Alert>
        </Card>
      </div>
    </>
  )
}

function AccuracyTab() {
  const { t } = useTranslation()
  return (
    <Card bare className="ring-line">
      <div className="p-8 text-center">
        <Info className="mx-auto h-8 w-8 text-ink-faint" aria-hidden />
        <h3 className="mt-4 text-[16px] font-semibold text-ink">{t('analytics.insufficientData')}</h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">
          Measured accuracy is reported only when a labelled evaluation set exists. The pipeline records{' '}
          <strong className="text-ink">AI confidence</strong> on every extraction — the model&apos;s self-assessment, not proof of accuracy.
        </p>
        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-panel border border-line bg-surface-muted/50 p-4 text-left">
          <Badge tone="accent">AI confidence</Badge>
          <p className="text-[12px] text-ink-muted">per-field self-assessed probability (0–100%), shown in the verification workspace.</p>
        </div>
      </div>
    </Card>
  )
}

function QualityTab() {
  return (
    <Card bare className="ring-line">
      <div className="p-8 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-ink-faint" aria-hidden />
        <h3 className="mt-4 text-[16px] font-semibold text-ink">Extraction quality workspace</h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">
          Per-district OCR and extraction quality dashboards arrive with the evaluation harness. Until labelled data is loaded, operational statistics only.
        </p>
      </div>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11.5px] font-medium text-ink-faint">{label}</dt>
      <dd className="numeric mt-0.5 text-[20px] font-bold text-ink">{value}</dd>
    </div>
  )
}
