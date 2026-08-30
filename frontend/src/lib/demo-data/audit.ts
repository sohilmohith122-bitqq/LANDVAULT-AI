/**
 * LANDVAULT AI — demo audit trail.
 *
 * Hand-authored SAMPLE AuditEvent rows that the verification UI renders in demo
 * / no-backend mode. They mirror the real engine output produced by the audit
 * log endpoint (`auditApi.list` → GET /api/audit) and must always satisfy the
 * `AuditEvent` contract in `@/types`.
 *
 * The events below are deliberately spread across every action type defined in
 * AuditPage's `actionTone` map (DOCUMENT_UPLOAD, OCR_COMPLETED,
 * EXTRACTION_COMPLETED, VALIDATION_COMPLETED, CONFLICT_CREATED, FIELD_ACCEPTED,
 * RECORD_VERIFIED, FIELD_CORRECTED) so the audit UI has representative data to
 * display, and across different user roles (ADMIN, OFFICER, VERIFIER).
 */

import type { AuditEvent } from '@/types'

/** Demo timestamp used so sample data renders deterministically. */
const DEMO_TIMESTAMP = '2025-08-15T09:30:00.000Z'

/** Demo audit events, spanning every action type and user role. */
export const DEMO_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'AUD-001',
    timestamp: DEMO_TIMESTAMP,
    userId: 'USR-001',
    userName: 'Anjali Sharma',
    userRole: 'VERIFIER',
    action: 'DOCUMENT_UPLOAD',
    recordId: null,
    documentId: 'DOC-PATTA-001',
    field: null,
    oldValue: null,
    newValue: {
      filename: 'REC-124_2A-PATTA.pdf',
      documentType: 'PATTA',
      pageCount: 2,
      fileSizeBytes: 1048576,
    },
    reason: 'Initial document upload for record REC-124/2A-PATTA.',
  },
  {
    id: 'AUD-002',
    timestamp: '2025-08-15T10:12:00.000Z',
    userId: 'USR-002',
    userName: 'Ravi Kumar',
    userRole: 'OFFICER',
    action: 'OCR_COMPLETED',
    recordId: null,
    documentId: 'DOC-PATTA-001',
    field: null,
    oldValue: null,
    newValue: { status: 'OCR', progress: 100, ocrConfidence: 0.91 },
    reason: 'OCR processing finished with confidence 0.91.',
  },
  {
    id: 'AUD-003',
    timestamp: '2025-08-15T11:45:00.000Z',
    userId: 'USR-002',
    userName: 'Ravi Kumar',
    userRole: 'OFFICER',
    action: 'EXTRACTION_COMPLETED',
    recordId: 'REC-124/2A-PATTA',
    documentId: 'DOC-PATTA-001',
    field: null,
    oldValue: null,
    newValue: {
      fieldsExtracted: 12,
      method: 'OCR_HEURISTIC',
      status: 'EXTRACTED',
    },
    reason: 'Field extraction completed across 12 fields.',
  },
  {
    id: 'AUD-004',
    timestamp: '2025-08-15T14:20:00.000Z',
    userId: 'USR-001',
    userName: 'Anjali Sharma',
    userRole: 'VERIFIER',
    action: 'VALIDATION_COMPLETED',
    recordId: 'REC-124/2A-PATTA',
    documentId: null,
    field: null,
    oldValue: null,
    newValue: {
      rulesRun: 8,
      conflictsFound: 1,
      status: 'CONFLICT',
    },
    reason: 'Validation found 1 conflict: owner name mismatch between Patta and Chitta.',
  },
  {
    id: 'AUD-005',
    timestamp: '2025-08-15T14:22:00.000Z',
    userId: 'USR-001',
    userName: 'Anjali Sharma',
    userRole: 'VERIFIER',
    action: 'CONFLICT_CREATED',
    recordId: 'REC-124/2A-PATTA',
    documentId: 'DOC-CHITTA-002',
    field: 'ownerName',
    oldValue: null,
    newValue: {
      conflictId: 'CONF-001',
      category: 'OWNER_MISMATCH',
      severity: 'MEDIUM',
    },
    reason: 'Owner name differs between Patta (R. Rajesh) and Chitta (R. Rajeswaran).',
  },
  {
    id: 'AUD-006',
    timestamp: '2025-08-16T09:15:00.000Z',
    userId: 'USR-003',
    userName: 'Priya Nair',
    userRole: 'OFFICER',
    action: 'FIELD_ACCEPTED',
    recordId: 'REC-055/1A-PATTA',
    documentId: 'DOC-OCR-004',
    field: 'ownerName',
    oldValue: 'M. Kathiravan [confidence: 0.42]',
    newValue: 'M. Kathiravan',
    reason: 'OCR confidence below threshold; manually verified and accepted.',
  },
  {
    id: 'AUD-007',
    timestamp: '2025-08-16T10:30:00.000Z',
    userId: 'USR-003',
    userName: 'Priya Nair',
    userRole: 'OFFICER',
    action: 'FIELD_CORRECTED',
    recordId: 'REC-091/3B-PATTA',
    documentId: 'DOC-REG-003',
    field: 'registrationDate',
    oldValue: '30-02-2023',
    newValue: '28-02-2023',
    reason: 'Registration date "30-02-2023" is not a valid calendar date; corrected to last valid day of February.',
  },
  {
    id: 'AUD-008',
    timestamp: '2025-08-17T08:50:00.000Z',
    userId: 'USR-001',
    userName: 'Anjali Sharma',
    userRole: 'VERIFIER',
    action: 'RECORD_VERIFIED',
    recordId: 'REC-124/2A-PATTA',
    documentId: null,
    field: null,
    oldValue: { status: 'CONFLICT' },
    newValue: { status: 'VERIFIED', conflictsResolved: 1, conflictsDismissed: 0 },
    reason: 'All conflicts reviewed; owner name variant accepted and record verified.',
  },
  {
    id: 'AUD-009',
    timestamp: '2025-08-18T13:10:00.000Z',
    userId: 'USR-004',
    userName: 'Kavitha Ramesh',
    userRole: 'ADMIN',
    action: 'DOCUMENT_UPLOAD',
    recordId: null,
    documentId: 'DOC-FMB-005',
    field: null,
    oldValue: null,
    newValue: {
      filename: 'REC-045_1C-FMB.pdf',
      documentType: 'FMB',
      pageCount: 1,
      fileSizeBytes: 524288,
    },
    reason: 'Uploaded FMB sketch for survey number 045/1C to resolve GIS alignment conflict.',
  },
  {
    id: 'AUD-010',
    timestamp: '2025-08-19T15:40:00.000Z',
    userId: 'USR-004',
    userName: 'Kavitha Ramesh',
    userRole: 'ADMIN',
    action: 'CONFLICT_CREATED',
    recordId: 'REC-045/1C-PATTA',
    documentId: 'DOC-GIS-005',
    field: 'boundary',
    oldValue: null,
    newValue: {
      conflictId: 'CONF-005',
      category: 'GIS_MISMATCH',
      severity: 'HIGH',
    },
    reason: 'GIS parcel boundary does not align with the surveyed extent from FMB sketch.',
  },
]
