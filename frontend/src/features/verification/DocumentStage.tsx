import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LandRecord } from '@/types'
import { cn } from '@/lib/utils'
import { RenderDocument } from './SyntheticDocument'

interface Row {
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

/** Build the synthetic document rows from the record's extracted fields */
function buildRows(record: LandRecord): Row[] {
  const yStart = 212
  const rowH = 56
  const fields = record.fields
  return fields.map((f, i) => ({
    key: f.key,
    label: f.label,
    labelTa: tamilLabel(f.key),
    value: f.value ?? '———',
    y: yStart + i * rowH,
    w: 360,
    h: 34,
    confidence: f.confidence,
    status: f.status,
  }))
}

function tamilLabel(key: string): string {
  const map: Record<string, string> = {
    owner_name: 'உரிமையாளர்',
    survey_number: 'சர்வே எண்',
    area: 'பரப்பளவு',
    village: 'கிராமம்',
    taluk: 'தாலுகா',
    district: 'மாவட்டம்',
  }
  return map[key] ?? ''
}
export function DocumentStage({
  record,
  activeField,
  page,
  onPageChange,
  onFieldClick,
}: {
  record: LandRecord
  activeField: string | null
  page: number
  onPageChange: (p: number) => void
  onFieldClick: (key: string) => void
}) {
  const { t } = useTranslation()
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const showPage2 = record.fields.some((f) => f.sourcePage === 2)

  const rows = buildRows(record)

  return (
    <div className="flex flex-col rounded-panel bg-navy-950 ring-1 ring-line/70">
      {/* Viewer toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))} className="rounded p-1.5 text-[rgb(156_168_186)] transition-colors hover:bg-white/10 hover:text-white" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="numeric w-10 text-center text-[11px] text-[rgb(156_168_186)]">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))} className="rounded p-1.5 text-[rgb(156_168_186)] transition-colors hover:bg-white/10 hover:text-white" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-white/10" />
          <button onClick={() => setRotation((r) => (r + 90) % 360)} className="rounded p-1.5 text-[rgb(156_168_186)] transition-colors hover:bg-white/10 hover:text-white" aria-label="Rotate page">
            <RotateCw className="h-4 w-4" />
          </button>
          <button onClick={() => { setZoom(1); setRotation(0) }} className="rounded p-1.5 text-[rgb(156_168_186)] transition-colors hover:bg-white/10 hover:text-white" aria-label="Reset view">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(120_133_153)]">Original</span>
          {showPage2 ? (
            <>
              <button
                onClick={() => onPageChange(1)}
                className={cn('rounded px-2 py-1 text-[11px] font-semibold transition-colors', page === 1 ? 'bg-accent text-white' : 'text-[rgb(156_168_186)] hover:bg-white/10')}
              >
                P1
              </button>
              <button
                onClick={() => onPageChange(2)}
                className={cn('rounded px-2 py-1 text-[11px] font-semibold transition-colors', page === 2 ? 'bg-accent text-white' : 'text-[rgb(156_168_186)] hover:bg-white/10')}
              >
                P2
              </button>
            </>
          ) : (
            <span className="rounded px-2 py-1 text-[11px] font-semibold text-[rgb(156_168_186)]">P{page}</span>
          )}
        </div>
      </div>

      {/* Document canvas */}
      <div className="relative flex-1 overflow-auto bg-[#232c3b] bg-[radial-gradient(circle_at_50%_20%,#2d3849_0,#1d2534_70%)] p-6">
        <div
          className="mx-auto w-full max-w-[560px] shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: 'center center', transition: 'transform 180ms ease-out' }}
        >
          <RenderDocument record={record} rows={rows} activeField={activeField} onFieldClick={onFieldClick} />
        </div>
      </div>

      {/* Help caption */}
      <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2 text-[11px] text-[rgb(120_133_153)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Low confidence
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" /> Conflict
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> Selected
        </span>
        <span className="ml-auto hidden md:inline">Click a region to inspect its extracted field</span>
      </div>
    </div>
  )
}