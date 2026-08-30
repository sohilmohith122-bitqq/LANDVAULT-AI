/** LANDVAULT AI — shared domain types */

export type RoleCode = 'ADMIN' | 'OFFICER' | 'VERIFIER' | 'VIEWER'

export type DocumentType =
  | 'PATTA'
  | 'CHITTA'
  | 'FMB'
  | 'TSLR'
  | 'RECORD_OF_RIGHTS'
  | 'MUTATION_RECORD'
  | 'SALE_REGISTRATION'
  | 'SURVEY_RECORD'
  | 'OTHER'

export type DocumentStatus =
  | 'QUEUED'
  | 'PREPROCESSING'
  | 'OCR'
  | 'EXTRACTION'
  | 'VALIDATION'
  | 'REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'FAILED'

export type RecordStatus = 'DRAFT' | 'EXTRACTED' | 'IN_REVIEW' | 'VERIFIED' | 'CONFLICT'

export type ConflictStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'

export type ConflictCategory =
  | 'DUPLICATE_SURVEY'
  | 'OWNER_MISMATCH'
  | 'AREA_MISMATCH'
  | 'MISSING_FIELD'
  | 'HISTORICAL_INCONSISTENCY'
  | 'OCR_UNCERTAINTY'
  | 'GIS_MISMATCH'
  | 'DOCUMENT_INCONSISTENCY'

export type ValidationStatus = 'PASS' | 'WARNING' | 'CONFLICT' | 'REVIEW_REQUIRED'
export type ValidationSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ValidationCategory =
  | 'REQUIRED_FIELD'
  | 'DATA_TYPE'
  | 'SURVEY_FORMAT'
  | 'AREA_UNIT'
  | 'DUPLICATE'
  | 'CROSS_RECORD'
  | 'HISTORICAL'
  | 'OWNER_SIMILARITY'
  | 'GIS_AREA'
  | 'MISSING_INFO'
  | 'SUSPICIOUS_CHANGE'

export type AIFieldStatus = 'AI' | 'ACCEPTED' | 'CORRECTED' | 'REJECTED' | 'REVIEW_REQUIRED'

export type ExtractionMethod = 'OCR_HEURISTIC' | 'NER' | 'PATTERN' | 'TABLE_PARSING' | 'MANUAL'

export type LanguageCode = 'en' | 'ta'

export interface User {
  id: string
  username: string
  fullName: string
  email: string
  role: RoleCode
  languagePreference: LanguageCode
  isActive: boolean
  lastLoginAt: string | null
  avatar?: string
}

export interface ExtractedField {
  key: string
  label: string
  value: string | null
  confidence: number | null
  sourcePage: number | null
  sourceText: string | null
  sourceBbox: { x: number; y: number; w: number; h: number } | null
  method: ExtractionMethod
  status: AIFieldStatus
}

export interface DocumentRecord {
  id: string
  referenceNo: string
  filename: string
  documentType: DocumentType
  language: LanguageCode[]
  district: string
  taluk: string
  village: string
  pageCount: number
  fileSizeBytes: number
  status: DocumentStatus
  progress: number
  uploadedAt: string
  uploadedBy: string
  /* demo preview */
  previewUrl?: string
  ocrConfidence: number | null
}

export interface LandRecord {
  id: string
  recordNumber: string
  documentId: string
  surveyNumber: string
  subdivisionNumber: string | null
  khataNumber: string | null
  ownerName: string
  ownerNameTamil?: string
  coOwners: string[]
  area: number
  areaUnit: 'Acres' | 'Hectares' | 'Ares' | 'Sq.m'
  village: string
  taluk: string
  district: string
  state: string
  landType: string
  documentType: DocumentType
  documentNumber: string | null
  registrationDate: string | null
  status: RecordStatus
  verifyConfidence: number | null
  fields: ExtractedField[]
  createdAt: string
  updatedAt: string
}

export interface ValidationResult {
  ruleId: string
  category: ValidationCategory
  severity: ValidationSeverity
  status: ValidationStatus
  message: string
  affectedField: string | null
  evidence: Record<string, unknown>
  timestamp: string
}

export interface Conflict {
  id: string
  recordId: string
  documentId: string
  category: ConflictCategory
  severity: ValidationSeverity
  description: string
  status: ConflictStatus
  field: string
  extractedValue: string | null
  referenceValue: string | null
  difference?: string
  evidence: Record<string, unknown>
  createdAt: string
  updatedAt: string
  resolvedBy?: string
  resolutionNote?: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: RoleCode
  action: string
  recordId: string | null
  documentId: string | null
  field: string | null
  oldValue: unknown
  newValue: unknown
  reason: string | null
}

export interface GisParcel {
  id: string
  parcelId: string
  surveyNumber: string
  subdivisionNumber: string | null
  village: string
  taluk: string
  district: string
  area: number
  areaUnit: string
  geometry: { type: 'Polygon'; coordinates: number[][][] }
  status: RecordStatus
  hasConflict: boolean
  recordId: string | null
}

export interface ActivityItem {
  id: string
  type: 'upload' | 'processing' | 'extraction' | 'validation' | 'verification' | 'conflict' | 'correction'
  title: string
  description: string
  timestamp: string
  user: string
}

/** Generic paginated list envelope returned by list endpoints. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Aggregated operational statistics served by GET /api/stats/overview. */
export interface DistrictErrorRate {
  district: string
  errorRate: number
}

export interface PipelineStage {
  stage: string
  count: number
}

export interface DashboardStats {
  totalRecords: number
  digitized: number
  verified: number
  pendingReview: number
  conflicts: number
  documentsThisWeek: number
  avgOcrConfidence: number | null
  avgExtractionConfidence: number | null
  lowConfidenceRate: number
  correctionRate: number
  avgProcessingHours: number | null
  errorsByDistrict: DistrictErrorRate[]
  pipeline: PipelineStage[]
  documentsByType: { type: string; count: number }[]
  documentsByLanguage: { language: string; count: number }[]
  weeklyVolume: { week: string; documents: number }[]
}