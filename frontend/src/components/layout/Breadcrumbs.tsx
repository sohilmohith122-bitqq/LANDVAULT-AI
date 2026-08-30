import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

const CRUMB_MAP: Record<string, string> = {
  '': 'overview',
  documents: 'documents',
  records: 'landRecords',
  verification: 'verificationQueue',
  conflicts: 'conflicts',
  gis: 'gisMap',
  analytics: 'analytics',
  audit: 'auditTrail',
  users: 'usersRoles',
  settings: 'systemSettings',
}

export function Breadcrumbs() {
  const { t } = useTranslation()
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-ink-faint">
        <Link to="/" className="font-medium text-ink-faint transition-colors hover:text-accent">
          {t('nav.overview')}
        </Link>
      </nav>
    )
  }

  const crumbs = segments.map((seg, i) => {
    const isLast = i === segments.length - 1
    const path = `/${segments.slice(0, i + 1).join('/')}`
    const label = CRUMB_MAP[seg] ? t(`nav.${CRUMB_MAP[seg]}`) : decodeURIComponent(seg)
    return { label, path, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
      <Link to="/" className="font-medium text-ink-faint transition-colors hover:text-accent">
        {t('nav.overview')}
      </Link>
      {crumbs.map((c) => (
        <span key={c.path} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-ink-faint/60" aria-hidden />
          {c.isLast ? (
            <span className="font-semibold text-ink" aria-current="page">
              {c.label}
            </span>
          ) : (
            <Link to={c.path} className="font-medium text-ink-faint transition-colors hover:text-accent">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}