import type { LandRecord } from '@/types'
import { cn } from '@/lib/utils'

export interface DocRow {
  key: string
  label: string
  labelTa: string
  value: string
  y: number
  w: number
  h: number
  confidence: number | null
  status: string
}

const SVG_W = 900
const SVG_H = 1120

export function RenderDocument({
  record,
  rows,
  activeField,
  onFieldClick,
}: {
  record: LandRecord
  rows: DocRow[]
  activeField: string | null
  onFieldClick: (key: string) => void
}) {
  const docTitle =
    record.documentType === 'PATTA'
      ? 'PATTA PASSBOOK EXTRACT'
      : record.documentType === 'CHITTA'
        ? 'CHITTA ADANGAL EXTRACT'
        : record.documentType === 'TSLR'
          ? 'TSLR SETTLEMENT REGISTER EXTRACT'
          : 'FIELD MEASUREMENT BOOK (FMB) EXTRACT'

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full bg-[#fdfcf7]" role="img" aria-label={`Synthetic ${record.documentType} extract render`}>
      <defs>
        <filter id="paper" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.94  0 0 0 0 0.93  0 0 0 0 0.89  0 0 0 0.04 0" result="t" />
          <feMerge>
            <feMergeNode in="t" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#paper)">
        {/* Header band */}
        <rect x="0" y="0" width={SVG_W} height={180} fill="#f4efe4" />
        <rect x="0" y="178" width={SVG_W} height={3} fill="#1c5c93" />
        <text x={SVG_W / 2} y="52" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="26" fontWeight="700" fill="#0f1b2d" letterSpacing="1">
          GOVERNMENT OF TAMIL NADU
        </text>
        <text x={SVG_W / 2} y="80" textAnchor="middle" fontFamily="'Noto Sans Tamil', sans-serif" fontSize="18" fontWeight="600" fill="#5a6577">
          தமிழ்நாடு அரசு
        </text>
        <text x={SVG_W / 2} y="124" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="17" fontWeight="600" fill="#1c5c93" letterSpacing="0.5">
          {docTitle}
        </text>
        <text x={SVG_W / 2} y="150" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="#8891a1">
          Record {record.documentNumber ?? '—'} · Issued {record.registrationDate ?? '—'}
        </text>

        {/* Reference line */}
        <text x="60" y="210" fontFamily="Inter, sans-serif" fontSize="12" fill="#8891a1">
          Village: {record.village}  Taluk: {record.taluk}  District: {record.district}
        </text>

        {/* Table header */}
        <rect x="48" y="226" width="804" height="30" fill="#eef2f7" />
        <text x="60" y="247" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#0f1b2d">FIELD</text>
        <text x="360" y="247" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#0f1b2d">DETAILS</text>
{/* Field rows with tappable value regions */}
        {rows.map((row) => {
          const active = row.key === activeField
          const lowConf = row.confidence !== null && row.confidence < 0.7
          const reviewRequired = row.status === 'REVIEW_REQUIRED' || row.status === 'REJECTED'
          const isConflict = reviewRequired && lowConf
          const stroke = active ? '#1c5c93' : isConflict ? '#b42318' : lowConf ? '#b25309' : '#d1cbbb'
          const fill = active ? 'rgba(28,92,147,0.10)' : isConflict ? 'rgba(180,35,24,0.06)' : lowConf ? 'rgba(178,83,9,0.05)' : 'rgba(28,92,147,0.02)'

          return (
            <g key={row.key}>
              <line x1="48" y1={row.y + row.h + 8} x2="852" y2={row.y + row.h + 8} stroke="#e1ddd5" strokeWidth="1" />
              <text x="60" y={row.y + 22} fontFamily="'Noto Sans Tamil', sans-serif" fontSize="13" fill="#5a6577">
                {row.labelTa || row.label}
              </text>
              <text x="340" y={row.y + 22} fontFamily="Inter, sans-serif" fontSize="12" fill="#8891a1">
                {row.label}
              </text>

              <rect
                x="446"
                y={row.y}
                width={row.w}
                height={row.h}
                rx="6"
                fill={fill}
                stroke={stroke}
                strokeWidth={active ? 2 : 1.25}
                className="cursor-pointer"
                onClick={() => onFieldClick(row.key)}
                role="button"
                aria-label={`Highlight ${row.label}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onFieldClick(row.key)
                  }
                }}
              />
              <text x="460" y={row.y + 23} fontFamily="Inter, sans-serif" fontSize="15" fontWeight={600} fill="#0f1b2d">
                {row.value}
              </text>

              <g style={{ opacity: active ? 1 : 0, transition: 'opacity 150ms' }}>
                <rect x="826" y={row.y + 5} width="58" height="24" rx="999" fill={isConflict ? '#fbe9e8' : lowConf ? '#fcf3e3' : '#e7f3ec'} stroke={isConflict ? '#b42318' : lowConf ? '#b25309' : '#1e7d46'} strokeOpacity="0.4" strokeWidth="1" />
                <text x="855" y={row.y + 21} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10.5" fontWeight="700" fill={isConflict ? '#b42318' : lowConf ? '#b25309' : '#1e7d46'}>
                  {row.confidence === null ? '—' : `${Math.round(row.confidence * 100)}%`}
                </text>
              </g>
            </g>
          )
        })}

        {/* footnote */}
        <text x="60" y="922" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#8891a1">
          This is a synthetic rendering for demonstration. Digital signatures and QR are omitted.
        </text>
        <rect x="600" y="890" width="240" height="54" rx="4" fill="none" stroke="#d1cbbb" strokeWidth="1" strokeDasharray="4 3" />
        <text x="720" y="918" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" fill="#8891a1">
          QR · DEMO
        </text>
      </g>
    </svg>
  )
}