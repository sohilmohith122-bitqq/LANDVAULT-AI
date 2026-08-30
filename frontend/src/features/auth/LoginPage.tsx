import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ScanSearch, History, Languages } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandMark'
import { Button, Input, Alert } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage } from '@/components/QueryFeedback'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isTamil = i18n.language?.startsWith('ta')

  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)

  const [officerUser, setOfficerUser] = useState('')
  const [officerPass, setOfficerPass] = useState('')
  const [officerLoading, setOfficerLoading] = useState(false)
  const [officerError, setOfficerError] = useState<string | null>(null)

  const [showReset, setShowReset] = useState(false)

  const handleAdminLogin = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!adminUser.trim() || !adminPass.trim()) {
      setAdminError(t('auth.invalidCredentials'))
      return
    }
    setAdminError(null)
    setAdminLoading(true)
    try {
      await login(adminUser.trim(), adminPass)
      navigate('/', { replace: true })
    } catch (err) {
      setAdminError(getApiErrorMessage(err))
    } finally {
      setAdminLoading(false)
    }
  }

  const handleOfficerLogin = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!officerUser.trim() || !officerPass.trim()) {
      setOfficerError(t('auth.invalidCredentials'))
      return
    }
    setOfficerError(null)
    setOfficerLoading(true)
    try {
      await login(officerUser.trim(), officerPass)
      navigate('/', { replace: true })
    } catch (err) {
      setOfficerError(getApiErrorMessage(err))
    } finally {
      setOfficerLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex xl:p-14">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-accent/10 blur-3xl" />
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-accent text-white">
            <BrandMark className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[14px] font-bold tracking-tight">LANDVAULT AI</p>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-[rgb(156_168_186)]">SIH-26018 · GovTech Platform</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="text-[32px] font-bold leading-[1.18] tracking-tight">
            Every land record.<br />Digitised. Verified. Auditable.
          </h1>
          <p className="font-tamil mt-3 text-[15px] text-[rgb(156_168_186)]">நில பதிவேடுகள் — எண்ணிமமாக்கம், சரிபார்ப்பு, தணிக்கை</p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: ScanSearch, title: 'AI extraction with confidence', desc: 'Tamil + English OCR, every field scored 0–100%.' },
              { icon: ShieldCheck, title: 'Human-in-the-loop verification', desc: 'Officers confirm each value against the source document.' },
              { icon: History, title: 'Immutable audit trail', desc: 'Corrections preserve the original AI output — always.' },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/8 ring-1 ring-white/10">
                  <f.icon className="h-4 w-4 text-[rgb(156_168_186)]" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">{f.title}</p>
                  <p className="text-[12.5px] text-[rgb(156_168_186)]">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-[rgb(120_133_153)]">
          Prototype for demonstration · Synthetic data only · Does not certify legal ownership or validity
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-navy-900 text-white">
                <BrandMark className="h-4.5 w-4.5" />
              </span>
              <p className="text-[14px] font-bold tracking-tight text-ink">LANDVAULT AI</p>
            </div>
            <button
              onClick={() => void i18n.changeLanguage(isTamil ? 'en' : 'ta')}
              className="ml-auto flex items-center gap-1.5 rounded-field border border-line-strong px-2.5 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Languages className="h-3.5 w-3.5" aria-hidden />
              {isTamil ? 'English' : 'தமிழ்'}
            </button>
          </div>

          <h2 className="h-page">{t('auth.welcomeBack')}</h2>
          <p className="body-muted mt-1">Sign in to your portal</p>

          {/* Administrator login */}
          <div className="mt-6 rounded-field border border-line-strong bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-navy-900 text-white">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold leading-tight text-ink">Administrator</p>
                <p className="text-[11px] text-ink-muted">Full system access</p>
              </div>
            </div>

            {adminError ? (
              <Alert tone="danger" title={adminError} className="mt-3" />
            ) : null}

            <form className="mt-4 space-y-3" onSubmit={(e) => void handleAdminLogin(e)} noValidate>
              <label className="block">
                <span className="label mb-1 block text-[12px]">Admin ID</span>
                <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} placeholder="e.g. admin" autoComplete="username" autoFocus />
              </label>
              <label className="block">
                <span className="label mb-1 block text-[12px]">{t('auth.password')}</span>
                <Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </label>
              <Button type="submit" size="lg" fullWidth loading={adminLoading} className="!bg-navy-900 hover:!bg-navy-950">
                Sign in as Administrator
              </Button>
            </form>
          </div>

          {/* Officer login */}
          <div className="mt-4 rounded-field border border-line bg-paper-soft p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-line-strong text-ink-muted">
                <ScanSearch className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold leading-tight text-ink">Officer</p>
                <p className="text-[11px] text-ink-muted">Upload, review &amp; verify</p>
              </div>
            </div>

            {officerError ? (
              <Alert tone="danger" title={officerError} className="mt-3" />
            ) : null}

            <form className="mt-4 space-y-3" onSubmit={(e) => void handleOfficerLogin(e)} noValidate>
              <label className="block">
                <span className="label mb-1 block text-[12px]">Officer ID</span>
                <Input value={officerUser} onChange={(e) => setOfficerUser(e.target.value)} placeholder="e.g. officer.karthik" autoComplete="username" />
              </label>
              <label className="block">
                <span className="label mb-1 block text-[12px]">{t('auth.password')}</span>
                <Input type="password" value={officerPass} onChange={(e) => setOfficerPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </label>
              <Button type="submit" size="lg" fullWidth variant="outline" loading={officerLoading}>
                Sign in as Officer
              </Button>
            </form>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => setShowReset((v) => !v)} className="text-[12px] font-medium text-accent hover:underline">
              {t('auth.forgotPassword')}
            </button>
            <span className="text-[11px] text-ink-faint">Official use only</span>
          </div>

          {showReset ? (
            <Alert tone="info" title={t('auth.resetPassword')} className="mt-3">
              Password resets are issued by the district system administrator. Contact your office IT desk with your employee ID.
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  )
}
