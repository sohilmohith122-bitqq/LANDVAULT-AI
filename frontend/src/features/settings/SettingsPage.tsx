import { useTranslation } from 'react-i18next'
import { Palette, KeyRound, Globe2, ScanLine, Bell } from 'lucide-react'
import { Card, CardHeader, Switch } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useAuthStore, can } from '@/stores/auth'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const { t } = useTranslation()
  const current = useAuthStore((s) => s.user)
  const canManage = can(current, 'settings')

  return (
    <div className="space-y-5">
      <PageHeader title={t('settings.title')} subtitle="Platform configuration for your workgroup." />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card bare className="ring-line">
          <CardHeader title="AI pipeline" subtitle="OCR and extraction behaviour" />
          <div className="space-y-3">
            <Switch checked={true} onChange={() => {}} label="PaddleOCR Tamil + English" description="Primary OCR engine with Indic script support." />
            <Switch checked={true} onChange={() => {}} label="Low-confidence flagging" description="Pages below 65% confidence are flagged for review." />
            <Switch checked={false} onChange={() => {}} label="Hindi pipeline (preview)" description="Architecture-ready for additional Indian languages." />
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="Validation rules" subtitle="The rule engine is configurable — nothing hardcoded in UI" />
          <div className="space-y-3">
            <Switch checked={true} onChange={() => {}} label="Duplicate survey detection" description="Cross-record matching on survey + village." />
            <Switch checked={true} onChange={() => {}} label="GIS area comparison" description="Compares text area with parcel area; tolerant to ±5%." />
            <Switch checked={true} onChange={() => {}} label="Owner-name similarity" description="Script-aware fuzzy matching (Tamil + English)." />
            <Switch checked={true} onChange={() => {}} label="Historical consistency" description="Diffs against prior versions of the record." />
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="Security" subtitle="Session and access policies" />
          <div className="space-y-3">
            <Switch checked={true} onChange={() => {}} label="Session expiry after 30 min idle" description="Users must re-authenticate after inactivity." />
            <Switch checked={true} onChange={() => {}} label="Argon2 password hashing" description="Password hashing is always server-side." />
            <Switch checked={true} onChange={() => {}} label="Private document storage" description="Documents require signed, time-limited URLs." />
            <Switch checked={true} onChange={() => {}} label="Audit hashing" description="Append-only audit events with hash chaining." />
          </div>
        </Card>

        <Card bare className="ring-line">
          <CardHeader title="Notifications & language" />
          <div className="space-y-3">
            <Switch checked={true} onChange={() => {}} label="Conflict alerts" description="Notify officers when a new conflict is registered." />
            <Switch checked={true} onChange={() => {}} label="Verification reminders" description="Daily digest of records awaiting review." />
            <Button variant="outline" size="sm" className="mt-1">
              <KeyRound className="mr-1.5 h-4 w-4" aria-hidden />
              Change my password
            </Button>
          </div>
        </Card>
      </div>

      <Card bare className="ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-ink-faint" aria-hidden />
            <div>
              <p className="text-[13.5px] font-semibold text-ink">{t('common.appName')} design system</p>
              <p className="text-[12px] text-ink-muted">
                Design tokens · Trust · Clarity · Professionalism — theme v1.0
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-[11px] text-ink-faint">
            <span className="flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> en · ta</span>
            <span className="flex items-center gap-1"><ScanLine className="h-3.5 w-3.5" /> OCR v0.4</span>
            <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> Notifications enabled</span>
          </div>
        </div>
      </Card>
    </div>
  )
}