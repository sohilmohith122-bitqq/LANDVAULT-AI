/**
 * TanStack Query hooks — the single data-access layer for the app.
 * Every list/detail endpoint gets a hook with a stable query key so mutations
 * can invalidate precisely (e.g. resolving a conflict refreshes stats too).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activityApi,
  auditApi,
  conflictsApi,
  documentsApi,
  parcelsApi,
  recordsApi,
  statsApi,
  type DocumentListParams,
  type RecordListParams,
} from '@/lib/api'
import type { ConflictStatus } from '@/types'

export const queryKeys = {
  stats: ['stats', 'overview'] as const,
  documents: (params: DocumentListParams) => ['documents', params] as const,
  records: (params: RecordListParams) => ['records', params] as const,
  record: (id: string) => ['records', 'detail', id] as const,
  recordValidation: (id: string) => ['records', 'validation', id] as const,
  conflicts: (params: { status?: ConflictStatus }) => ['conflicts', params] as const,
  conflict: (id: string) => ['conflicts', 'detail', id] as const,
  audit: (params: Record<string, unknown>) => ['audit', params] as const,
  activity: ['activity'] as const,
  parcels: (params: Record<string, unknown>) => ['parcels', params] as const,
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: ({ signal }) => statsApi.overview(signal) })
}

export function useDocuments(params: DocumentListParams = {}) {
  return useQuery({ queryKey: queryKeys.documents(params), queryFn: ({ signal }) => documentsApi.list(params, signal) })
}

export function useRecords(params: RecordListParams = {}) {
  return useQuery({ queryKey: queryKeys.records(params), queryFn: ({ signal }) => recordsApi.list(params, signal) })
}

export function useRecord(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.record(id ?? ''),
    queryFn: ({ signal }) => recordsApi.get(id as string, signal),
    enabled: Boolean(id),
  })
}

export function useRecordValidation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recordValidation(id ?? ''),
    queryFn: ({ signal }) => recordsApi.validation(id as string, signal),
    enabled: Boolean(id),
  })
}

export function useConflicts(params: { status?: ConflictStatus } = {}) {
  return useQuery({ queryKey: queryKeys.conflicts(params), queryFn: ({ signal }) => conflictsApi.list(params, signal) })
}

export function useConflict(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conflict(id ?? ''),
    queryFn: ({ signal }) => conflictsApi.get(id as string, signal),
    enabled: Boolean(id),
  })
}

export function useAudit(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.audit(params), queryFn: ({ signal }) => auditApi.list(params, signal) })
}

export function useActivity() {
  return useQuery({ queryKey: queryKeys.activity, queryFn: ({ signal }) => activityApi.list(signal) })
}

export function useParcels(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.parcels(params), queryFn: ({ signal }) => parcelsApi.list(params, signal) })
}

/** Resolve or dismiss a conflict, then refresh conflict + stats caches. */
export function useResolveConflict(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, note }: { action: 'RESOLVE' | 'DISMISS'; note?: string }) =>
      conflictsApi.resolve(id, action, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conflicts'] })
      void queryClient.invalidateQueries({ queryKey: ['records'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      void queryClient.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}
