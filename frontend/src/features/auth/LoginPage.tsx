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

  type Role = 'admin' | 'officer' | 'user'

  const ROLES: { id: Role; label: string; desc: string; icon: typeof ShieldCheck; placeholder: string }[] = [
    { id: 'admin', label: 'Administrator', desc: 'Full system access', icon: ShieldCheck, placeholder: 'e.g. admin' },
    { id: 'officer', label: 'Officer', desc: 'Upload, review & verify', icon: ScanSearch, placeholder: 'e.g. officer.karthik' },
    { id: 'user', label: 'User', desc: 'Read-only access', icon: History, placeholder: 'e.g. viewer' },
  ]

  const [role, setRole] = useState<Role>('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)

  const activeRole = ROLES.find((r) => r.id === role)!

  const handleLogin = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(t('auth.invalidCredentials'))
      return
    }
    setError(null)
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
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

          {/* Role switcher */}
          <div className="mt-6 grid grid-cols-3 gap-2" role="tablist" aria-label="Select role">
            {ROLES.map((r) => {
              const active = r.id === role
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setRole(r.id); setUsername(''); setPassword(''); setError(null) }}
                  className={`flex flex-col items-center gap-1.5 rounded-field border px-2 py-3 text-center transition-colors ${
                    active
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : 'border-line-strong bg-white text-ink-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  <r.icon className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden />
                  <span className="text-[12px] font-semibold leading-tight">{r.label}</span>
                  <span className={`text-[10px] leading-tight ${active ? 'text-white/70' : 'text-ink-faint'}`}>{r.desc}</span>
                </button>
              )
            })}
          </div>

          {error ? (
            <Alert tone="danger" title={error} className="mt-4" />
          ) : null}

          {/* Single login form */}
          <form className="mt-4 space-y-3.5" onSubmit={(e) => void handleLogin(e)} noValidate>
            <label className="block">
              <span className="label mb-1.5 block">{activeRole.label} ID</span>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={activeRole.placeholder} autoComplete="username" autoFocus />
            </label>
            <label className="block">
              <span className="label mb-1.5 block">{t('auth.password')}</span>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </label>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setShowReset((v) => !v)} className="text-[12.5px] font-medium text-accent hover:underline">
                {t('auth.forgotPassword')}
              </button>
              <span className="text-[11px] text-ink-faint">Official use only</span>
            </div>

            {showReset ? (
              <Alert tone="info" title={t('auth.resetPassword')}>
                Password resets are issued by the district system administrator. Contact your office IT desk with your employee ID.
              </Alert>
            ) : null}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Sign in as {activeRole.label}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
