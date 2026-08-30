import type { ReactNode, TableHTMLAttributes } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: ReactNode
  /** Render cell content */
  render?: (row: T) => ReactNode
  /** Accessor when no custom render needed */
  accessor?: (row: T) => ReactNode
  className?: string
  headerClassName?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  loadingRows?: number
  emptyState?: ReactNode
  dense?: boolean
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  tableProps?: TableHTMLAttributes<HTMLTableElement>
}
export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  loading,
  loadingRows = 5,
  emptyState,
  dense,
  sortKey,
  sortDir,
  onSort,
  tableProps,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...tableProps}>
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => {
              const canSort = col.sortable && onSort
              const isActive = sortKey === col.key
              return (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 pb-2.5 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint',
                    alignCls[col.align ?? 'left'],
                    dense && 'px-3',
                    col.headerClassName,
                  )}
                >
                  {canSort ? (
                    <button
                      onClick={() => onSort?.(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-ink',
                        isActive && 'text-accent',
                      )}
                    >
                      {col.header}
                      {isActive ? (
                        sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRows }).map((_, r) => (
                <tr key={`skeleton-${r}`} className="border-b border-line/60">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-2.5', dense && 'px-3')}>
                      <Skeleton className="h-3.5 w-5/6" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line/60 transition-colors duration-100 last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-surface-muted/60',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5 align-middle text-ink',
                        alignCls[col.align ?? 'left'],
                        dense && 'px-3 py-2',
                        col.className,
                      )}
                    >
                      {col.render ? col.render(row) : col.accessor ? col.accessor(row) : null}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && data.length === 0 ? emptyState : null}
    </div>
  )
}

const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' }
export interface PaginationProps {
  page: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 6))
  const end = Math.min(totalPages, start + 6)
  const pages = Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i)

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3">
      {totalItems !== undefined ? (
        <p className="text-xs text-ink-faint">
          {totalItems.toLocaleString('en-IN')} records · {pageSize ?? 25} per page
        </p>
      ) : null}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-field border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'h-7.5 min-w-7.5 rounded-field px-1.5 text-xs font-medium transition-colors',
              p === page ? 'bg-navy-900 text-white' : 'text-ink-muted hover:bg-surface-muted',
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-field border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}