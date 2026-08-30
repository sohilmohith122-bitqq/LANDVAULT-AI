import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Breadcrumbs } from './Breadcrumbs'

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-2.5">
          <Breadcrumbs />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="h-page">{title}</h1>
        {subtitle ? <p className="body-muted mt-1 max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}