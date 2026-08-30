import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  ShieldCheck,
  AlertTriangle,
  Map as MapIcon,
  BarChart3,
  History,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandMark'
import { useUiStore } from '@/stores/ui'
import { useAuthStore, can } from '@/stores/auth'
import { cn } from '@/lib/utils'

const NAV_MAIN = [
  { to: '/', nk: 'overview', icon: LayoutDashboard, end: true },
  { to: '/documents', nk: 'documents', icon: FileText },
  { to: '/records', nk: 'landRecords', icon: ScrollText },
  { to: '/verification', nk: 'verificationQueue', icon: ShieldCheck, badge: 197 },
  { to: '/conflicts', nk: 'conflicts', icon: AlertTriangle, badge: 5 },
  { to: '/gis', nk: 'gisMap', icon: MapIcon },
  { to: '/analytics', nk: 'analytics', icon: BarChart3 },
  { to: '/audit', nk: 'auditTrail', icon: History },
]

const NAV_ADMIN = [{ to: '/settings', nk: 'systemSettings', icon: Settings, adminOnly: true }]
export function Sidebar() {
  const { t } = useTranslation()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  // Close the mobile drawer on navigation
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname, setMobileNavOpen])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden />
      ) : null}

      <aside
        data-chrome="dark"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-navy-900 transition-all duration-200 ease-out lg:static lg:z-auto',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[256px]',
          mobileOpen ? 'w-[256px] translate-x-0' : 'w-[256px] -translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-[60px] shrink-0 items-center gap-3 border-b border-white/10 px-4', collapsed ? 'lg:justify-center lg:px-2' : 'px-4')}>
          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[8px] bg-accent text-white">
            <BrandMark className="h-[18px] w-[18px]" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold tracking-tight text-white">LANDVAULT AI</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[rgb(156_168_186)]">Govt Platform</p>
            </div>
          ) : null}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4" aria-label="Main navigation">
          <ul className="space-y-0.5">
            {NAV_MAIN.map((item) => (
              <SidebarItem {...item} key={item.nk} collapsed={collapsed} t={t} />
            ))}
          </ul>

          {!collapsed ? (
            <p className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(156_168_186)]">Administration</p>
          ) : (
            <div className="mx-auto mt-6 h-px w-7 bg-white/10" />
          )}

          <ul className="mt-1.5 space-y-0.5">
            {NAV_ADMIN.filter((i) => !i.adminOnly || can(user, 'settings')).map((item) => (
              <SidebarItem {...item} key={item.nk} collapsed={collapsed} t={t} />
            ))}
          </ul>
        </nav>

        {/* Footer collapse toggle */}
        <div className="shrink-0 border-t border-white/10 p-2.5">
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex h-9 w-full items-center gap-2.5 rounded-field px-2.5 text-[13px] font-medium text-[rgb(156_168_186)] transition-colors hover:bg-white/5 hover:text-white',
              !collapsed ? 'justify-start' : 'lg:justify-center lg:px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight className="mx-auto h-4.5 w-4.5" />
            ) : (
              <>
                <ChevronsLeft className="h-4.5 w-4.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
function SidebarItem({
  to,
  nk: k,
  icon: Icon,
  badge,
  end,
  collapsed,
  t,
}: {
  to: string
  nk: string
  icon: typeof LayoutDashboard
  badge?: number
  end?: boolean
  collapsed: boolean
  t: (key: string) => string
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        title={t(`nav.${k}`)}
        className={({ isActive }) =>
          cn(
            'group flex h-9.5 items-center gap-2.5 rounded-field px-2.5 text-[13.5px] font-medium transition-colors duration-150',
            isActive
              ? 'bg-accent text-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
              : 'text-[rgb(156_168_186)] hover:bg-white/5 hover:text-white',
            collapsed && 'lg:justify-center lg:px-0',
          )
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
        {!collapsed ? (
          <>
            <span className="flex-1 truncate">{t(`nav.${k}`)}</span>
            {badge ? <BadgeCount>{badge}</BadgeCount> : null}
          </>
        ) : null}
      </NavLink>
    </li>
  )
}

function BadgeCount({ children }: { children: number }) {
  return (
    <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {children}
    </span>
  )
}

export function MobileNavToggle() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  return (
    <button
      onClick={() => setMobileNavOpen(true)}
      className="rounded-field p-2 text-ink-muted hover:bg-surface-muted lg:hidden"
      aria-label="Open navigation"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    </button>
  )
}