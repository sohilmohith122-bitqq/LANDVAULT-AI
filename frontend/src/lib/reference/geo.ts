/**
 * Real administrative reference data — NOT mock data.
 *
 * Districts: the 38 districts of Tamil Nadu as per the state revenue administration
 * (post-2019 reorganisation, incl. Mayiladuthurai, Chengalpattu, Tenkasi, Tirupathur,
 * Ranipet, Kallakurichi). Taluk/village lists are served by the backend (sourced from
 * the TN e-Governance / DILRMP location master) — only the district tier is static here.
 *
 * Document types: derived from the canonical `DocumentType` union so dropdowns can
 * never drift from the domain model.
 */

import type { DocumentType } from '@/types'

export const TN_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
] as const

export type TnDistrict = (typeof TN_DISTRICTS)[number]

export const DOCUMENT_TYPE_OPTIONS: readonly DocumentType[] = [
  'PATTA',
  'CHITTA',
  'FMB',
  'TSLR',
  'RECORD_OF_RIGHTS',
  'MUTATION_RECORD',
  'SALE_REGISTRATION',
  'SURVEY_RECORD',
  'OTHER',
] as const
