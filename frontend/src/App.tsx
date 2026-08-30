import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { AppShell } from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

/* Experience pages — lazy-loaded for code splitting */
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const UploadPage = lazy(() => import('@/features/upload/UploadPage'))
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage'))
const RecordsPage = lazy(() => import('@/features/records/RecordsPage'))
const VerificationQueuePage = lazy(() => import('@/features/verification/VerificationQueuePage'))
const VerificationWorkspacePage = lazy(() => import('@/features/verification/VerificationWorkspacePage'))
const ConflictsPage = lazy(() => import('@/features/conflicts/ConflictsPage'))
const ConflictDetailPage = lazy(() => import('@/features/conflicts/ConflictDetailPage'))
const GisPage = lazy(() => import('@/features/gis/GisPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'))
const AuditPage = lazy(() => import('@/features/audit/AuditPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

function PageFallback() {
  return (
    <div className="space-y-4" aria-label="Loading page" role="status">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/verification" element={<VerificationQueuePage />} />
          <Route path="/verification/:recordId" element={<VerificationWorkspacePage />} />
          <Route path="/conflicts" element={<ConflictsPage />} />
          <Route path="/conflicts/:conflictId" element={<ConflictDetailPage />} />
          <Route path="/gis" element={<GisPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-paper">
      <div className="flex items-center gap-3 text-ink-faint">
        <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        <span className="text-sm font-medium">Loading LANDVAULT AI…</span>
      </div>
    </div>
  )
}