import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Field, Select } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth'
import { useRecords, useStats, useDocuments } from '@/lib/queries'
import { TN_DISTRICTS } from '@/lib/reference/geo'
import { KpiRow } from './sections/KpiRow'
import { PipelineViz } from './sections/PipelineViz'
import { QueuePanel } from './sections/QueuePanel'
import { ConflictsPanel } from './sections/ConflictsPanel'
import { ActivityPanel } from './sections/ActivityPanel'
import { OcrQualityPanel } from './sections/OcrQualityPanel'
import { GeoPanel } from './sections/GeoPanel'
import { DocumentsPanel } from './sections/DocumentsPanel'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [districtFilter, setDistrictFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: stats } = useStats()
  const { data: recordsData, isLoading: recordsLoading, error: recordsError } = useRecords({ pageSize: 100 })
  const { data: documentsData } = useDocuments({ pageSize: 5 })

  const filteredRecords = useMemo(
    () =>
      (recordsData?.items ?? []).filter(
        (r) =>
          (districtFilter === 'ALL' || r.district === districtFilter) &&
          (statusFilter === 'ALL' || r.status === statusFilter),
      ),
    [recordsData, districtFilter, statusFilter],
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page">{t('dashboard.title')}</h1>
          <p className="body-muted mt-1">
            Welcome back, {user?.fullName}. Processing pipeline is healthy — {stats ? `${stats.documentsThisWeek} documents uploaded this week.` : 'loading pipeline status…'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Field label={t('records.district')} className="!mb-0 w-40">
            <Select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} aria-label="District filter">
              <option value="ALL">All districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.status')} className="!mb-0 w-40">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter">
              <option value="ALL">All statuses</option>
              <option>VERIFIED</option>
              <option>IN_REVIEW</option>
              <option>CONFLICT</option>
            </Select>
          </Field>
        </div>
      </div>

      {/* KPI row */}
      <KpiRow />

      {/* Pipeline + verification queue */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card bare className="ring-line xl:col-span-2">
          <PipelineViz />
        </Card>
        {recordsError ? (
          <Card bare className="ring-line p-5 text-[12.5px] text-danger">
            Could not load the verification queue — {String(recordsError instanceof Error ? recordsError.message : recordsError)}
          </Card>
        ) : (
          <QueuePanel records={recordsLoading ? [] : filteredRecords} />
        )}
      </div>

      {/* Conflicts + activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ConflictsPanel />
        <ActivityPanel />
      </div>

      {/* OCR quality + geo + recent documents */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <OcrQualityPanel />
        <GeoPanel />
        <DocumentsPanel documents={(documentsData?.items ?? []).slice(0, 5)} />
      </div>
    </div>
  )
}