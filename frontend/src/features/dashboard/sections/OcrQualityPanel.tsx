import { Card, CardHeader, Progress } from '@/components/ui'
import { useTranslation } from 'react-i18next'

const metrics = [
  { label: 'Patta extract', value: 0.94 },
  { label: 'Chitta extract', value: 0.87 },
  { label: 'Printed FMB plan', value: 0.81 },
  { label: 'Old TSLR series (1968)', value: 0.71 },
  { label: 'Handwritten register', value: 0.42 },
]

export function OcrQualityPanel() {
  const { t } = useTranslation()
  return (
    <Card bare className="ring-line">
      <CardHeader title={t('dashboard.ocrQuality')} subtitle="Mean OCR confidence by source" />
      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink">{m.label}</span>
              <span className="numeric text-[12px] font-semibold text-ink">{Math.round(m.value * 100)}%</span>
            </div>
            <Progress
              value={m.value * 100}
              tone={m.value > 0.85 ? 'success' : m.value > 0.65 ? 'default' : 'danger'}
              className="mt-1.5"
            />
          </div>
        ))}
        <p className="pt-1 text-[11.5px] leading-relaxed text-ink-faint">
          Low-confidence pages are automatically flagged for human review before extraction.
        </p>
      </div>
    </Card>
  )
}