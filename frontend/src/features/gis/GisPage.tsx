import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, ShieldAlert, Info } from 'lucide-react'
import { MapContainer, TileLayer, WMSTileLayer, Polygon, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardHeader, Badge, Input, Button } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useParcels } from '@/lib/queries'
import { TN_DISTRICTS } from '@/lib/reference/geo'
import { QueryError } from '@/components/QueryFeedback'
import type { GisParcel } from '@/types'

/**
 * Cadastral WMS overlay — Bhu-Naksha (state instances) / Bhuvan NRSC serve parcel rasters
 * as WMS images, which the browser can render without CORS issues. The endpoint is
 * environment-configured (VITE_BHUNAKSHA_WMS_URL); record/parcel business data flows
 * through the backend API, which integrates the authorised government spatial services.
 */
const BHUNAKSHA_WMS_URL = import.meta.env.VITE_BHUNAKSHA_WMS_URL as string | undefined
const BHUNAKSHA_WMS_LAYER = (import.meta.env.VITE_BHUNAKSHA_WMS_LAYER as string | undefined) ?? 'cadastral'

const STATUS_COLOR: Record<string, string> = {
  VERIFIED: '#1e7d46',
  CONFLICT: '#b42318',
  IN_REVIEW: '#a04a08',
  EXTRACTED: '#1c5c93',
  UNKNOWN: '#8891a1',
}

const STATUS_LABEL: Record<string, string> = {
  VERIFIED: 'Verified',
  CONFLICT: 'Conflict',
  IN_REVIEW: 'Pending review',
  EXTRACTED: 'Extracted',
  UNKNOWN: 'Unknown',
}

const CENTER: [number, number] = [10.31, 78.2]

function toLatLng(geometry: GisParcel['geometry']): LatLngExpression[] {
  return geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as LatLngExpression)
}

export default function GisPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [district, setDistrict] = useState('ALL')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<GisParcel | null>(null)

  const { data, isLoading, error, refetch } = useParcels({
    district: district === 'ALL' ? undefined : district,
    query: query || undefined,
  })
  const parcels = data ?? []
  const totalParcels = parcels.length

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('gis.title')}
        subtitle="Parcels are served by the backend from authorised government spatial datasets (Bhu-Naksha / DILRMP). A cadastral WMS overlay can be enabled via configuration."
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Survey no. or parcel ID…"
            aria-label="Search parcels"
          />
        </div>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          aria-label="District filter"
          className="h-9.5 rounded-field border border-line-strong bg-surface px-3 text-[13px] text-ink outline-none focus:border-accent"
        >
          <option value="ALL">All districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {Object.entries(STATUS_COLOR).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} aria-hidden />
              {STATUS_LABEL[k]}
            </span>
          ))}
        </div>
      </div>

      {error ? <QueryError error={error} onRetry={() => void refetch()} /> : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        {/* Map */}
        <Card bare padded={false} className="overflow-hidden ring-line">
          <MapContainer center={CENTER} zoom={8} className="h-[540px] w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {BHUNAKSHA_WMS_URL ? (
              <WMSTileLayer
                url={BHUNAKSHA_WMS_URL}
                layers={BHUNAKSHA_WMS_LAYER}
                format="image/png"
                transparent
                attribution="&copy; Bhu-Naksha cadastral data"
              />
            ) : null}
            {parcels.map((p) => (
              <Polygon
                key={p.id}
                positions={toLatLng(p.geometry)}
                pathOptions={{
                  color: STATUS_COLOR[p.status] ?? STATUS_COLOR.UNKNOWN,
                  weight: selected?.id === p.id ? 3 : 1.5,
                  fillOpacity: selected?.id === p.id ? 0.45 : 0.25,
                }}
                eventHandlers={{ click: () => setSelected(p) }}
              >
                <Tooltip sticky>
                  <span className="text-[11px] font-semibold">Survey {p.surveyNumber}</span>
                  <span className="block text-[10px] text-ink-muted">
                    {p.village} · {STATUS_LABEL[p.status]}
                  </span>
                </Tooltip>
              </Polygon>
            ))}
          </MapContainer>
        </Card>

        {/* Parcel detail */}
        <Card bare className="ring-line h-fit">
          <CardHeader
            title={selected ? `Parcel ${selected.parcelId}` : 'Parcel details'}
            subtitle={selected ? `${selected.village}, ${selected.taluk} taluk` : 'Select a parcel on the map'}
          />
          {!selected ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <MapPin className="h-8 w-8 text-ink-faint" aria-hidden />
              <p className="mt-3 text-[13px] font-medium text-ink">No parcel selected</p>
              <p className="mt-1 text-[12px] text-ink-muted">Click a parcel to inspect its land record link, area and validation status.</p>
              <p className="mt-4 text-[11px] text-ink-faint">{totalParcels} parcels shown</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge tone={selected.hasConflict ? 'danger' : selected.status === 'VERIFIED' ? 'success' : 'accent'} dot>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </Badge>
                {selected.hasConflict ? (
                  <span className="flex items-center gap-1 text-[11.5px] font-semibold text-danger">
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Potential conflict detected
                  </span>
                ) : null}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
                <div>
                  <dt className="text-ink-faint">Survey number</dt>
                  <dd className="numeric font-semibold text-ink">{selected.surveyNumber}</dd>
                </div>
                <div>
                  <dt className="text-ink-faint">Subdivision</dt>
                  <dd className="numeric font-semibold text-ink">{selected.subdivisionNumber ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-faint">Parcel area</dt>
                  <dd className="numeric font-semibold text-ink">{selected.area} {selected.areaUnit}</dd>
                </div>
                <div>
                  <dt className="text-ink-faint">District</dt>
                  <dd className="font-semibold text-ink">{selected.district}</dd>
                </div>
              </dl>
              {selected.recordId ? (
                <Button fullWidth onClick={() => navigate(`/records/${selected.recordId}`)}>
                  Open linked land record
                </Button>
              ) : (
                <p className="rounded-panel bg-surface-muted/60 p-3 text-[11.5px] text-ink-muted">
                  No digitised land record is linked to this parcel yet.
                </p>
              )}
              <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-faint">
                <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                Parcel display does not establish legal ownership or boundaries. Survey/parcel data: Bhu-Naksha (state revenue dept) via the backend; base map &copy; OpenStreetMap contributors.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
