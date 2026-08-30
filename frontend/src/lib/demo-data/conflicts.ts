/**
 * LANDVAULT AI — demo cross-source conflicts.
 *
 * Hand-authored SAMPLE Conflict rows that the verification UI renders in demo
 * / no-backend mode. They mirror the real engine output produced by
 * `backend/scripts/validate.py` (see the `14_VALIDATION/validation_results.csv`
 * template) and must always satisfy the `Conflict` contract in `@/types`.
 *
 * The rows below are deliberately spread across every `ConflictStatus`
 * (OPEN, UNDER_REVIEW, RESOLVED, DISMISSED) so the ConflictsPage status
 * filters have data to act on, and across every `ConflictCategory` so the
 * category legend is fully exercised.
 */

import type { Conflict } from '@/types'

/** Demo timestamp used so sample data renders deterministically. */
const DEMO_TIMESTAMP = '2025-08-15T09:30:00.000Z'

/** Demo conflict outcomes, spanning every engine status and category. */
export const DEMO_CONFLICTS: Conflict[] = [
  {
    id: 'CONF-001',
    recordId: 'REC-124/2A-PATTA',
    documentId: 'DOC-PATTA-001',
    category: 'OWNER_MISMATCH',
    severity: 'MEDIUM',
    description: 'Owner name differs between Patta ("R. Rajesh") and Chitta ("R. Rajeswaran").',
    status: 'OPEN',
    field: 'ownerName',
    extractedValue: 'R. Rajesh',
    referenceValue: 'R. Rajeswaran',
    difference: 'Name variant: "Rajesh" vs "Rajeswaran"',
    evidence: {
      patta: 'R. Rajesh',
      chitta: 'R. Rajeswaran',
      sources: ['patta', 'chitta'],
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    id: 'CONF-002',
    recordId: 'REC-124/2A-PATTA',
    documentId: 'DOC-FMB-002',
    category: 'AREA_MISMATCH',
    severity: 'LOW',
    description: 'Extent shows a partial match across sources (2.47–2.50 acres).',
    status: 'UNDER_REVIEW',
    field: 'area',
    extractedValue: '2.47 acres',
    referenceValue: '2.50 acres',
    difference: '0.03 acres',
    evidence: {
      patta: '2.50 acres',
      chitta: '2.48 acres',
      aRegister: '2.48 acres',
      gis: '2.47 acres',
      unit: 'Acres',
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: '2025-08-20T14:12:00.000Z',
  },
  {
    id: 'CONF-003',
    recordId: 'REC-091/3B-PATTA',
    documentId: 'DOC-REG-003',
    category: 'DOCUMENT_INCONSISTENCY',
    severity: 'HIGH',
    description: 'Registration date "30-02-2023" is not a valid calendar date.',
    status: 'OPEN',
    field: 'registrationDate',
    extractedValue: '30-02-2023',
    referenceValue: null,
    difference: 'Day 30 does not exist in February',
    evidence: {
      value: '30-02-2023',
      sources: ['registration'],
      page: 3,
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    id: 'CONF-004',
    recordId: 'REC-055/1A-PATTA',
    documentId: 'DOC-OCR-004',
    category: 'OCR_UNCERTAINTY',
    severity: 'MEDIUM',
    description: 'Owner name confidence is low (0.42); OCR heuristics flagged possible characters.',
    status: 'RESOLVED',
    field: 'ownerName',
    extractedValue: 'M. Kathiravan',
    referenceValue: 'M. Kathiravanan',
    difference: '"Kathiravan" vs "Kathiravanan" — trailing "an"',
    evidence: {
      confidence: 0.42,
      confidenceThreshold: 0.6,
      sources: ['ocr'],
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: '2025-08-22T09:45:00.000Z',
    resolvedBy: 'OFFICER-007',
    resolutionNote: 'Verified against village register 2012 folio 88; accepted corrected spelling.',
  },
  {
    id: 'CONF-005',
    recordId: 'REC-078/4C-PATTA',
    documentId: 'DOC-GIS-005',
    category: 'GIS_MISMATCH',
    severity: 'HIGH',
    description: 'GIS parcel boundary does not align with the surveyed extent from FMB sketch.',
    status: 'DISMISSED',
    field: 'boundary',
    extractedValue: 'Survey No. 078/4C, 1.85 acres',
    referenceValue: 'GIS parcel area: 1.72 acres',
    difference: '0.13 acres',
    evidence: {
      gisArea: 1.72,
      recordArea: 1.85,
      unit: 'Acres',
      sources: ['gis', 'fmb'],
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: '2025-08-18T11:05:00.000Z',
    resolvedBy: 'VERIFIER-012',
    resolutionNote: 'Attributable to projection offset; GIS source flagged for re-alignment.',
  },
  {
    id: 'CONF-006',
    recordId: 'REC-033/2A-PATTA',
    documentId: 'DOC-AREG-006',
    category: 'DUPLICATE_SURVEY',
    severity: 'CRITICAL',
    description: 'Survey number 033/2A appears on two distinct Patta documents with different owners.',
    status: 'OPEN',
    field: 'surveyNumber',
    extractedValue: '033/2A',
    referenceValue: '033/2A (duplicate)',
    difference: 'Same survey number, different owner records',
    evidence: {
      surveyNumber: '033/2A',
      owners: ['S. Meena', 'K. Parthasarathy'],
      sources: ['patta', 'adangal'],
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  },
  {
    id: 'CONF-007',
    recordId: 'REC-112/5B-PATTA',
    documentId: 'DOC-CHITTA-007',
    category: 'MISSING_FIELD',
    severity: 'LOW',
    description: 'Khata number is present in Patta but missing from Chitta extract.',
    status: 'UNDER_REVIEW',
    field: 'khataNumber',
    extractedValue: null,
    referenceValue: 'K-112-B',
    difference: 'Field absent from Chitta source',
    evidence: {
      khataNumber: 'K-112-B',
      missingFrom: ['chitta'],
      sources: ['patta', 'chitta'],
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: '2025-08-21T16:30:00.000Z',
  },
  {
    id: 'CONF-008',
    recordId: 'REC-045/1C-PATTA',
    documentId: 'DOC-REG-008',
    category: 'HISTORICAL_INCONSISTENCY',
    severity: 'MEDIUM',
    description: 'Owner name changed between 2010 sale registration and current Patta without a mutation record.',
    status: 'RESOLVED',
    field: 'ownerName',
    extractedValue: 'P. Senthil Kumar',
    referenceValue: 'P. Senthilkumar (mutation pending)',
    difference: 'Spelling variant without documented mutation',
    evidence: {
      current: 'P. Senthil Kumar',
      historical: 'P. Senthilkumar',
      mutationFiled: false,
      sources: ['registration', 'patta'],
    },
    createdAt: DEMO_TIMESTAMP,
    updatedAt: '2025-08-19T08:20:00.000Z',
    resolvedBy: 'OFFICER-007',
    resolutionNote: 'Mutation form submitted 2025-08-05; conflict closed pending filing.',
  },
]

