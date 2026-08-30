/**
 * LANDVAULT AI — demo cross-source validation results.
 *
 * Hand-authored SAMPLE outcomes of the validation engine that compares extracted
 * values across the Tamil Nadu land sources (Patta, Chitta, A-Register,
 * Adangal, GIS, Registration). These drive the verification UI in demo /
 * no-backend mode and must always satisfy the `ValidationResult` contract in
 * `@/types`.
 *
 * Real engine output is produced by `backend/scripts/validate.py` and written
 * to `14_VALIDATION/validation_results.csv`; the survey_number / extent rows
 * below mirror that template (CASE001 MATCH, CASE002 PARTIAL_MATCH).
 */

import type { ValidationResult } from '@/types'

/** Demo timestamp used so sample data renders deterministically. */
const DEMO_TIMESTAMP = '2025-08-15T09:30:00.000Z'

/** Demo validation outcomes for a record, spanning every engine status. */
export const DEMO_VALIDATION_RESULTS: ValidationResult[] = [
  {
    ruleId: 'CROSS-001',
    category: 'CROSS_RECORD',
    severity: 'INFO',
    status: 'PASS',
    affectedField: 'surveyNumber',
    message: 'Survey number is consistent across Patta, Chitta, A-Register and Adangal sources.',
    evidence: {
      patta: '124/2A',
      chitta: '124/2A',
      aRegister: '124/2A',
      adangal: '124/2A',
      gis: '124/2A',
    },
    timestamp: DEMO_TIMESTAMP,
  },
  {
    ruleId: 'AREA-002',
    category: 'AREA_UNIT',
    severity: 'LOW',
    status: 'WARNING',
    affectedField: 'area',
    message: 'Extent shows a small partial match across sources (2.47–2.50 acres).',
    evidence: {
      patta: '2.50 acres',
      chitta: '2.48 acres',
      aRegister: '2.48 acres',
      gis: '2.47 acres',
      unit: 'Acres',
    },
    timestamp: DEMO_TIMESTAMP,
  },
  {
    ruleId: 'OWNER-003',
    category: 'OWNER_SIMILARITY',
    severity: 'MEDIUM',
    status: 'CONFLICT',
    affectedField: 'ownerName',
    message: 'Owner name differs between Patta ("R. Rajesh") and Chitta ("R. Rajeswaran").',
    evidence: { patta: 'R. Rajesh', chitta: 'R. Rajeswaran' },
    timestamp: DEMO_TIMESTAMP,
  },
  {
    ruleId: 'DATE-004',
    category: 'DATA_TYPE',
    severity: 'HIGH',
    status: 'REVIEW_REQUIRED',
    affectedField: 'registrationDate',
    message: 'Registration date "30-02-2023" is not a valid calendar date.',
    evidence: { value: '30-02-2023', sources: ['registration'] },
    timestamp: DEMO_TIMESTAMP,
  },
]
