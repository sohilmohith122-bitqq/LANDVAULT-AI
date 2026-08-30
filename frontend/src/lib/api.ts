/**
 * LANDVAULT AI — typed API client.
 *
 * All application data is served by the FastAPI backend through the `/api` proxy
 * (see vite.config.ts: proxy → http://localhost:8000). Government data sources are
 * integrated server-side — never called directly from the browser (CORS/keys):
 *
 *  - Bhu-Naksha (bhunaksha.gov.in / state instances) — cadastral parcel WMS + survey data
 *  - State Bhulekh / RoR portals — Record of Rights, Khata, owner references
 *  - DILRMP — land-record modernisation metadata & identifier standards
 *  - data.gov.in (api.data.gov.in) — supporting government datasets (API key on server)
 *  - Bhashini (ULCA) — Tamil/English OCR & translation models (server-side keys)
 *  - Bhuvan / NRSC — satellite & thematic WMS layers for GIS cross-validation
 */

import type {
  ActivityItem,
  AuditEvent,
  Conflict,
  ConflictStatus,
  DashboardStats,
  DocumentRecord,
  DocumentStatus,
  DocumentType,
  GisParcel,
  LandRecord,
  LanguageCode,
  Paginated,
  RoleCode,
  User,
  ValidationResult,
} from '@/types'

import { shortId } from '@/lib/utils'
import { DEMO_DOCUMENTS } from '@/lib/demo-data/documents'
import { DEMO_LAND_RECORDS } from '@/lib/demo-data/records'
import { DEMO_CONFLICTS } from '@/lib/demo-data/conflicts'
import { DEMO_AUDIT_EVENTS } from '@/lib/demo-data/audit'
import { DEMO_GIS_PARCELS } from '@/lib/demo-data/parcels'
import { DEMO_VALIDATION_RESULTS } from '@/lib/demo-data/validation'

export const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

const SESSION_KEY = 'landvault:session'

/** Read the bearer token persisted by the auth store. */
export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as { token?: string | null }
    return session.token ?? null
  } catch {
    return null
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  params?: Record<string, unknown>
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(API_BASE + path, window.location.origin)
  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getStoredToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const init: RequestInit = { method: opts.method ?? 'GET', headers, signal: opts.signal }
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(opts.body)
  }

  const res = await fetch(url.toString(), init)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    let detail: unknown
    try {
      const data = (await res.json()) as { detail?: unknown }
      detail = data
      const d = data?.detail
      if (typeof d === 'string') message = d
      else if (Array.isArray(d))
        message = d
          .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: unknown }).msg) : JSON.stringify(x)))
          .join('; ')
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/* ----------------------------- Demo / no-backend mode ----------------------------- */
/**
 * When enabled, every API method below serves the hand-authored sample datasets
 * in `@/lib/demo-data` instead of calling the FastAPI backend — so the whole app
 * (including login) works with synthetic data and no backend running.
 *
 * Set `VITE_DEMO_MODE=0` (e.g. in `frontend/.env.local`) and start the backend
 * to use the real API.
 */
export const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE as string | undefined) !== '0'

/** Wrap a list into the paginated envelope used by list endpoints. */
function paginate<T>(items: T[], params: { page?: number; pageSize?: number } = {}): Paginated<T> {
  const pageSize = params.pageSize ?? (items.length || 10)
  const page = params.page ?? 1
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize }
}

function notFound(kind: string, id: string): never {
  throw new ApiError(404, `${kind} "${id}" not found`)
}

/* Demo auth — synthetic session so the login screen works without the backend. */
const DEMO_USER: User = {
  id: 'USR-001',
  username: 'admin',
  fullName: 'System Administrator',
  email: 'admin@landvault.example',
  role: 'ADMIN',
  languagePreference: 'en',
  isActive: true,
  lastLoginAt: '2025-08-31T09:30:00.000Z',
}

const DEMO_ROLE_BY_USERNAME: Record<string, RoleCode> = {
  admin: 'ADMIN',
  officer: 'OFFICER',
  verifier: 'VERIFIER',
  viewer: 'VIEWER',
}

const DEMO_USERNAME_LABEL: Record<string, string> = {
  admin: 'System Administrator',
  officer: 'Ravi Kumar',
  verifier: 'Anjali Sharma',
  viewer: 'Guest Viewer',
}

/* Demo activity feed — derived from the demo audit events. */
const ACTIVITY_TYPE: Record<string, ActivityItem['type']> = {
  DOCUMENT_UPLOAD: 'upload',
  OCR_COMPLETED: 'processing',
  EXTRACTION_COMPLETED: 'extraction',
  VALIDATION_COMPLETED: 'validation',
  CONFLICT_CREATED: 'conflict',
  RECORD_VERIFIED: 'verification',
  FIELD_ACCEPTED: 'verification',
  FIELD_CORRECTED: 'correction',
}

const humanize = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const DEMO_ACTIVITY: ActivityItem[] = DEMO_AUDIT_EVENTS.map((e) => ({
  id: e.id,
  type: ACTIVITY_TYPE[e.action] ?? 'processing',
  title: humanize(e.action),
  description: e.reason ?? `${e.userName} — ${humanize(e.action)}`,
  timestamp: e.timestamp,
  user: e.userName,
}))

/* Demo dashboard stats — computed from the demo documents/records/conflicts. */
const PIPELINE_STAGES: DocumentStatus[] = [
  'QUEUED', 'PREPROCESSING', 'OCR', 'EXTRACTION', 'VALIDATION', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED',
]

const DEMO_STATS: DashboardStats = (() => {
  const confidences = DEMO_DOCUMENTS.map((d) => d.ocrConfidence).filter((c): c is number => c !== null)
  const avgOcrConfidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null
  const lowConfidenceRate = confidences.length ? confidences.filter((c) => c < 0.85).length / confidences.length : 0
  const openConflicts = DEMO_CONFLICTS.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW')
  const resolvedConflicts = DEMO_CONFLICTS.filter((c) => c.status === 'RESOLVED' || c.status === 'DISMISSED').length

  const byType = new Map<string, number>()
  for (const d of DEMO_DOCUMENTS) byType.set(d.documentType, (byType.get(d.documentType) ?? 0) + 1)

  const byLang = new Map<string, number>()
  for (const d of DEMO_DOCUMENTS) for (const l of d.language) byLang.set(l, (byLang.get(l) ?? 0) + 1)

  const errorCount = new Map<string, number>()
  const districtTotal = new Map<string, number>()
  for (const c of DEMO_CONFLICTS) {
    const rec = DEMO_LAND_RECORDS.find((r) => r.id === c.recordId)
    if (!rec) continue
    districtTotal.set(rec.district, (districtTotal.get(rec.district) ?? 0) + 1)
    if (c.status === 'OPEN' || c.status === 'UNDER_REVIEW') errorCount.set(rec.district, (errorCount.get(rec.district) ?? 0) + 1)
  }

  const weeks = ['2025-07-20', '2025-07-27', '2025-08-03', '2025-08-10', '2025-08-17', '2025-08-24']
  const byWeek = new Map<string, number>()
  for (const d of DEMO_DOCUMENTS) {
    const dt = new Date(d.uploadedAt)
    for (const w of [...weeks].reverse()) {
      if (dt >= new Date(w)) { byWeek.set(w, (byWeek.get(w) ?? 0) + 1); break }
    }
  }

  return {
    totalRecords: DEMO_LAND_RECORDS.length,
    digitized: DEMO_LAND_RECORDS.filter((r) => r.status !== 'DRAFT').length,
    verified: DEMO_LAND_RECORDS.filter((r) => r.status === 'VERIFIED').length,
    pendingReview: DEMO_LAND_RECORDS.filter((r) => r.status === 'IN_REVIEW' || r.status === 'CONFLICT').length,
    conflicts: openConflicts.length,
    documentsThisWeek: DEMO_DOCUMENTS.length,
    avgOcrConfidence,
    avgExtractionConfidence: avgOcrConfidence != null ? Math.round(avgOcrConfidence * 0.92 * 100) / 100 : null,
    lowConfidenceRate,
    correctionRate: DEMO_CONFLICTS.length ? resolvedConflicts / DEMO_CONFLICTS.length : 0,
    avgProcessingHours: 2.4,
    errorsByDistrict: [...errorCount.entries()].map(([district, count]) => ({
      district,
      errorRate: count / Math.max(1, districtTotal.get(district) ?? 0),
    })),
    pipeline: PIPELINE_STAGES.map((stage) => ({ stage, count: DEMO_DOCUMENTS.filter((d) => d.status === stage).length })),
    documentsByType: [...byType.entries()].map(([type, count]) => ({ type, count })),
    documentsByLanguage: [...byLang.entries()].map(([language, count]) => ({ language, count })),
    weeklyVolume: weeks.map((w) => ({ week: w.slice(5).replace('-', '/'), documents: byWeek.get(w) ?? 0 })),
  }
})()

/* -------------------------------- Documents -------------------------------- */

export interface DocumentListParams {
  district?: string
  documentType?: DocumentType | ''
  page?: number
  pageSize?: number
}

export const documentsApi = {
  list: async (params: DocumentListParams = {}, signal?: AbortSignal): Promise<Paginated<DocumentRecord>> => {
    if (DEMO_MODE) {
      let items = DEMO_DOCUMENTS
      if (params.district) items = items.filter((d) => d.district === params.district)
      if (params.documentType) items = items.filter((d) => d.documentType === params.documentType)
      return paginate(items, params)
    }
    return request<Paginated<DocumentRecord>>('/documents', { params: params as Record<string, unknown>, signal })
  },

  get: async (id: string, signal?: AbortSignal): Promise<DocumentRecord> => {
    if (DEMO_MODE) return DEMO_DOCUMENTS.find((d) => d.id === id) ?? notFound('Document', id)
    return request<DocumentRecord>(`/documents/${id}`, { signal })
  },

  /** Multipart upload with progress reporting via XHR (fetch cannot report upload progress). */
  upload: (
    file: File,
    meta: { documentType: DocumentType; district: string; village?: string; languages: LanguageCode[] },
    onProgress?: (pct: number) => void,
  ) =>
    new Promise<DocumentRecord>((resolve, reject) => {
      if (DEMO_MODE) {
        onProgress?.(35)
        setTimeout(() => {
          onProgress?.(100)
          resolve({
            id: `DOC-${shortId('DEMO')}`,
            referenceNo: `${meta.district.slice(0, 3).toUpperCase()}-${shortId('REF')}`,
            filename: file.name,
            documentType: meta.documentType,
            language: meta.languages,
            district: meta.district,
            taluk: meta.village ?? meta.district,
            village: meta.village ?? meta.district,
            pageCount: 1,
            fileSizeBytes: file.size,
            status: 'QUEUED',
            progress: 0,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'System Administrator',
            ocrConfidence: null,
          })
        }, 400)
        return
      }
      const form = new FormData()
      form.append('file', file)
      form.append('documentType', meta.documentType)
      form.append('district', meta.district)
      if (meta.village) form.append('village', meta.village)
      for (const lang of meta.languages) form.append('languages', lang)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/documents`)
      const token = getStoredToken()
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.responseType = 'json'
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as DocumentRecord)
        else reject(new ApiError(xhr.status, (xhr.response as { detail?: string } | null)?.detail ?? `Upload failed (${xhr.status})`))
      }
      xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'))
      xhr.send(form)
    }),
}

/* --------------------------------- Records --------------------------------- */

export interface RecordListParams {
  query?: string
  district?: string
  status?: string
  page?: number
  pageSize?: number
}

export const recordsApi = {
  list: async (params: RecordListParams = {}, signal?: AbortSignal): Promise<Paginated<LandRecord>> => {
    if (DEMO_MODE) {
      let items = DEMO_LAND_RECORDS
      if (params.district) items = items.filter((r) => r.district === params.district)
      if (params.status) {
        const statuses = params.status.split(',').map((s) => s.trim()).filter(Boolean)
        if (statuses.length) items = items.filter((r) => statuses.includes(r.status))
      }
      if (params.query) {
        const q = params.query.toLowerCase()
        items = items.filter(
          (r) =>
            r.ownerName.toLowerCase().includes(q) ||
            r.surveyNumber.toLowerCase().includes(q) ||
            r.recordNumber.toLowerCase().includes(q) ||
            r.village.toLowerCase().includes(q),
        )
      }
      return paginate(items, params)
    }
    return request<Paginated<LandRecord>>('/records', { params: params as Record<string, unknown>, signal })
  },

  get: async (id: string, signal?: AbortSignal): Promise<LandRecord> => {
    if (DEMO_MODE) return DEMO_LAND_RECORDS.find((r) => r.id === id) ?? notFound('Record', id)
    return request<LandRecord>(`/records/${id}`, { signal })
  },

  validation: async (id: string, signal?: AbortSignal): Promise<ValidationResult[]> => {
    if (DEMO_MODE) return DEMO_VALIDATION_RESULTS
    return request<ValidationResult[]>(`/records/${id}/validation`, { signal })
  },

  verify: async (id: string, note?: string): Promise<LandRecord> => {
    if (DEMO_MODE) {
      const rec = DEMO_LAND_RECORDS.find((r) => r.id === id)
      if (!rec) return notFound('Record', id)
      return { ...rec, status: 'VERIFIED', verifyConfidence: 0.99 }
    }
    return request<LandRecord>(`/records/${id}/verify`, { method: 'POST', body: { note } })
  },
}

/* -------------------------------- Conflicts -------------------------------- */

export const conflictsApi = {
  list: async (
    params: { status?: ConflictStatus; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Conflict>> => {
    if (DEMO_MODE) {
      let items = DEMO_CONFLICTS
      if (params.status) items = items.filter((c) => c.status === params.status)
      return paginate(items, params)
    }
    return request<Paginated<Conflict>>('/conflicts', { params: params as Record<string, unknown>, signal })
  },

  get: async (id: string, signal?: AbortSignal): Promise<Conflict> => {
    if (DEMO_MODE) return DEMO_CONFLICTS.find((c) => c.id === id) ?? notFound('Conflict', id)
    return request<Conflict>(`/conflicts/${id}`, { signal })
  },

  resolve: async (id: string, action: 'RESOLVE' | 'DISMISS', note?: string): Promise<Conflict> => {
    if (DEMO_MODE) {
      const conflict = DEMO_CONFLICTS.find((c) => c.id === id)
      if (!conflict) return notFound('Conflict', id)
      return {
        ...conflict,
        status: action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED',
        resolutionNote: note,
        updatedAt: new Date().toISOString(),
      }
    }
    return request<Conflict>(`/conflicts/${id}/resolve`, { method: 'POST', body: { action, note } })
  },
}

/* ---------------------------------- Audit ---------------------------------- */

export const auditApi = {
  list: async (
    params: { query?: string; recordId?: string; documentId?: string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<AuditEvent>> => {
    if (DEMO_MODE) {
      let items = DEMO_AUDIT_EVENTS
      if (params.recordId) items = items.filter((e) => e.recordId === params.recordId)
      if (params.documentId) items = items.filter((e) => e.documentId === params.documentId)
      if (params.query) {
        const q = params.query.toLowerCase()
        items = items.filter((e) => e.userName.toLowerCase().includes(q) || e.action.toLowerCase().includes(q))
      }
      return paginate(items, params)
    }
    return request<Paginated<AuditEvent>>('/audit', { params: params as Record<string, unknown>, signal })
  },
}

/* ------------------------------ Activity feed ------------------------------ */

export const activityApi = {
  list: async (signal?: AbortSignal): Promise<ActivityItem[]> => {
    if (DEMO_MODE) return DEMO_ACTIVITY
    return request<ActivityItem[]>('/activity', { signal })
  },
}

/* ------------------------------- GIS parcels ------------------------------- */

export const parcelsApi = {
  list: async (
    params: { district?: string; query?: string; recordId?: string } = {},
    signal?: AbortSignal,
  ): Promise<GisParcel[]> => {
    if (DEMO_MODE) {
      let items = DEMO_GIS_PARCELS
      if (params.district) items = items.filter((p) => p.district === params.district)
      if (params.recordId) items = items.filter((p) => p.recordId === params.recordId)
      if (params.query) {
        const q = params.query.toLowerCase()
        items = items.filter((p) => p.surveyNumber.toLowerCase().includes(q) || p.village.toLowerCase().includes(q))
      }
      return items
    }
    return request<GisParcel[]>('/parcels', { params: params as Record<string, unknown>, signal })
  },
}

/* ---------------------------------- Auth ---------------------------------- */

export const authApi = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    if (DEMO_MODE) {
      if (!password) throw new ApiError(401, 'Invalid username or password')
      const u = username.trim().toLowerCase() || 'admin'
      const role: RoleCode = DEMO_ROLE_BY_USERNAME[u] ?? 'ADMIN'
      const user: User = { ...DEMO_USER, username: u, role, fullName: DEMO_USERNAME_LABEL[u] ?? DEMO_USER.fullName }
      return { user, token: `demo-${u}-${Date.now()}` }
    }
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    })
  },
  me: async (): Promise<User> => {
    if (DEMO_MODE) return DEMO_USER
    return request<User>('/auth/me')
  },
}

/* ---------------------------- Stats / analytics ---------------------------- */

export const statsApi = {
  overview: async (signal?: AbortSignal): Promise<DashboardStats> => {
    if (DEMO_MODE) return DEMO_STATS
    return request<DashboardStats>('/stats/overview', { signal })
  },
}
