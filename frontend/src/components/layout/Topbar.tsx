import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, ChevronDown, Search, LogOut, UserCog, Languages } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { Dropdown } from '@/components/ui/Dropdown'
import { MobileNavToggle } from './Sidebar'
import { cn } from '@/lib/utils'

export function Topbar() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const switchLanguage = (code: string) => {
    void i18n.changeLanguage(code)
  }

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/records?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const langLabel = i18n.language?.startsWith('ta') ? 'தமிழ்' : 'English'

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-2 border-b border-line bg-surface/95 px-4 backdrop-blur-sm">
      <MobileNavToggle />

      {/* Command / search */}
      <form onSubmit={handleSubmitSearch} className="flex w-full max-w-xl items-center gap-2" role="search">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('topbar.commandPlaceholder')}
            aria-label={t('topbar.commandPlaceholder')}
            className="h-9.5 w-full rounded-field border border-line bg-surface-muted/60 pl-9 pr-16 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:bg-surface focus:shadow-focus focus:outline-none"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-faint sm:block">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Language switcher */}
        <Dropdown
          ariaLabel={t('topbar.language')}
          trigger={
            <span className="flex h-9 items-center gap-1.5 rounded-field px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
              <Languages className="h-4.5 w-4.5" aria-hidden />
              <span className="hidden text-[13px] md:inline">{langLabel}</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </span>
          }
          items={[
            { key: 'en', label: 'English', onSelect: () => switchLanguage('en') },
            { key: 'ta', label: 'தமிழ் (Tamil)', onSelect: () => switchLanguage('ta') },
          ]}
        />

        {/* Notifications */}
        <Dropdown
          ariaLabel={t('topbar.notifications')}
          trigger={
            <span className="relative flex h-9 w-9 items-center justify-center rounded-field text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
              <Bell className="h-[18px] w-[18px]" aria-hidden />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
            </span>
          }
          align="right"
          items={[
            { key: 'n1', label: '5 conflicts need review', onSelect: () => navigate('/conflicts') },
            { key: 'n2', label: 'Record LV-2025-0128 is awaiting verification', onSelect: () => navigate('/verification') },
            { key: 'n3', label: 'OCR completed for doc LV-DOC-2025-0151', onSelect: () => navigate('/documents') },
          ]}
        />

        {/* Profile */}
        <Dropdown
          ariaLabel={t('topbar.profile')}
          trigger={
            <span className="flex h-9 items-center gap-2 rounded-field pl-1 pr-2 transition-colors hover:bg-surface-muted">
              <span className={cn('flex h-7.5 w-7.5 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white')}>
                {user?.fullName?.split(' ').map((p: string) => p[0]).slice(0, 2).join('') ?? 'LV'}
              </span>
              <span className="hidden text-left xl:block">
                <span className="block max-w-[140px] truncate text-[13px] font-medium leading-tight text-ink">{user?.fullName}</span>
                <span className="block text-[10px] font-medium uppercase tracking-wide text-ink-faint">{user?.role}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-ink-faint xl:block" aria-hidden />
            </span>
          }
          items={[
            { key: 'profile', label: t('topbar.profile'), icon: <UserCog className="h-4 w-4" />, onSelect: () => navigate('/settings') },
            { key: 'logout', label: t('topbar.signOut'), icon: <LogOut className="h-4 w-4" />, danger: true, onSelect: () => { logout(); navigate('/login') } },
          ]}
        />
      </div>
    </header>
  )
}