import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/lib/api'

/** Human-readable message for any thrown value from the API layer. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) return 'Cannot reach the server — check your connection and try again.'
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}

/** Skeleton placeholder shown while a query is loading. */
export function QueryLoading({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-10 w-full" />
      ))}
    </div>
  )
}

/** Error alert with retry for failed queries. */
export function QueryError({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div className={className}>
      <Alert tone="danger" title="Could not load data">
        <p>{getApiErrorMessage(error)}</p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="mt-2 rounded-field border border-current px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80"
          >
            Retry
          </button>
        ) : null}
      </Alert>
    </div>
  )
}
