import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { LandRecord } from '@/types'
import { cn } from '@/lib/utils'

/** Reconstruct a plausible OCR block from the record's source text fragments */
function buildOcrBlocks(record: LandRecord) {
  const docType = record.documentType.replace(/_/g, ' ')
  const header = `GOVERNMENT OF TAMIL NADU\nதமிழ்நாடு அரசு\n${docType} EXTRACT · ${record.documentNumber ?? '—'}`
  const lines: { text: string; fieldKey: string | null }[] = [
    { text: header, fieldKey: null },
    { text: `Village : ${record.village}   Taluk : ${record.taluk}   District : ${record.district}`, fieldKey: null },
  ]
  for (const f of record.fields) {
    lines.push({
      text: f.sourceText ?? `${f.label} : ${f.value ?? '—'}`,
      fieldKey: f.key,
    })
  }
  lines.push({ text: '— end of page —', fieldKey: null })
  return lines
}

export function OcrTextPanel({
  record,
  activeField,
  onFieldClick,
}: {
  record: LandRecord
  activeField: string | null
  onFieldClick: (key: string) => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const lines = buildOcrBlocks(record)

  const copyText = () => {
    void navigator.clipboard?.writeText(lines.filter((l) => l.text).map((l) => l.text).join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const activeLine = lines.find((l) => l.fieldKey === activeField)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-panel bg-surface ring-1 ring-line">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink-faint" aria-hidden />
          <h3 className="text-[13.5px] font-semibold text-ink">{t('verification.ocrText')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" size="xs">PaddleOCR · v0.4</Badge>
          <button onClick={copyText} className="rounded p-1 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink" aria-label="Copy OCR text">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <pre className="font-mono whitespace-pre-wrap text-[12.5px] leading-[1.65] text-ink-muted">
          {lines.map((line, i) => {
            const isActive = line.fieldKey === activeField
            const fieldKey = line.fieldKey
            return (
              <span
                key={i}
                onClick={() => { if (fieldKey) onFieldClick(fieldKey) }}
                className={cn(
                  'block cursor-default transition-colors',
                  isActive && 'rounded bg-warning-bg text-ink line-through decoration-warning/50',
                  !isActive && line.fieldKey && 'hover:bg-surface-muted',
                )}
              >
                {line.text}
              </span>
            )
          })}
        </pre>
      </div>

      {activeLine ? (
        <div className="border-t border-line bg-accent-soft px-4 py-2.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-accent">Matching OCR source</p>
          <p className="mt-0.5 truncate font-mono text-[12px] font-medium text-ink">&ldquo;{activeLine.text}&rdquo;</p>
        </div>
      ) : (
        <div className="border-t border-line px-4 py-2.5">
          <p className="text-[11px] text-ink-faint">Select a field in the document or the record panel to see its OCR source line.</p>
        </div>
      )}
    </div>
  )
}