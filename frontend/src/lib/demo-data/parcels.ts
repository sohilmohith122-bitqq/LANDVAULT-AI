/**
 * LANDVAULT AI — demo GIS parcels.
 *
 * Hand-authored SAMPLE GisParcel rows that the GIS map renders in demo /
 * no-backend mode. They mirror the real engine output served by the backend
 * (`parcelsApi.list` → GET /api/parcels, sourced from the Bhu-Naksha
 * cadastral WMS / state spatial services) and must always satisfy the
 * `GisParcel` contract in `@/types`.
 *
 * The parcels below are deliberately spread across Tamil Nadu districts with a
 * mix of `RecordStatus` values and `hasConflict` flags so the GisPage status
 * legend, district filter and conflict markers all have representative data to
 * act on. Survey numbers cross-reference the demo land records already used in
 * `@/lib/demo-data` (audit / conflicts / validation).
 */

import type { GisParcel } from '@/types'

/** Demo cadastral parcels spanning Tamil Nadu, with mixed verification states. */
export const DEMO_GIS_PARCELS: GisParcel[] = [
  {
    id: 'GIS-124/2A',
    parcelId: 'PAR-124/2A',
    surveyNumber: '124/2A',
    subdivisionNumber: '2A',
    village: 'Srirangam',
    taluk: 'Tiruchirappalli',
    district: 'Tiruchirappalli',
    area: 2.5,
    areaUnit: 'Acres',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [78.63, 10.73],
          [78.67, 10.73],
          [78.67, 10.77],
          [78.63, 10.77],
          [78.63, 10.73],
        ],
      ],
    },
    status: 'CONFLICT',
    hasConflict: true,
    recordId: 'REC-124/2A-PATTA',
  },
  {
    id: 'GIS-045/1C',
    parcelId: 'PAR-045/1C',
    surveyNumber: '045/1C',
    subdivisionNumber: '1C',
    village: 'Perambalur',
    taluk: 'Perambalur',
    district: 'Perambalur',
    area: 1.25,
    areaUnit: 'Acres',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [78.85, 11.3],
          [78.89, 11.3],
          [78.89, 11.34],
          [78.85, 11.34],
          [78.85, 11.3],
        ],
      ],
    },
    status: 'IN_REVIEW',
    hasConflict: true,
    recordId: 'REC-045/1C-PATTA',
  },
  {
    id: 'GIS-078/4C',
    parcelId: 'PAR-078/4C',
    surveyNumber: '078/4C',
    subdivisionNumber: '4C',
    village: 'Palayamkottai',
    taluk: 'Tirunelveli',
    district: 'Tirunelveli',
    area: 1.85,
    areaUnit: 'Acres',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [77.7, 8.71],
          [77.74, 8.71],
          [77.74, 8.75],
          [77.7, 8.75],
          [77.7, 8.71],
        ],
      ],
    },
    status: 'CONFLICT',
    hasConflict: true,
    recordId: 'REC-078/4C-PATTA',
  },
  {
    id: 'GIS-055/1A',
    parcelId: 'PAR-055/1A',
    surveyNumber: '055/1A',
    subdivisionNumber: '1A',
    village: 'Kilvanthai',
    taluk: 'Nagapattinam',
    district: 'Nagapattinam',
    area: 3.1,
    areaUnit: 'Acres',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [79.12, 10.74],
          [79.16, 10.74],
          [79.16, 10.78],
          [79.12, 10.78],
          [79.12, 10.74],
        ],
      ],
    },
    status: 'VERIFIED',
    hasConflict: false,
    recordId: 'REC-055/1A-PATTA',
  },
  {
    id: 'GIS-091/3B',
    parcelId: 'PAR-091/3B',
    surveyNumber: '091/3B',
    subdivisionNumber: '3B',
    village: 'Tiruppur',
    taluk: 'Tiruppur',
    district: 'Tiruppur',
    area: 0.95,
    areaUnit: 'Acres',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [77.33, 11.09],
          [77.37, 11.09],
          [77.37, 11.13],
          [77.33, 11.13],
          [77.33, 11.09],
        ],
      ],
    },
    status: 'EXTRACTED',
    hasConflict: false,
    recordId: null,
  },
  {
    id: 'GIS-033/2A',
    parcelId: 'PAR-033/2A',
    surveyNumber: '033/2A',
    subdivisionNumber: '2A',
    village: 'Mettur',
    taluk: 'Salem',
    district: 'Salem',
    area: 2.2,
    areaUnit: 'Acres',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [78.13, 11.6],
          [78.17, 11.6],
          [78.17, 11.64],
          [78.13, 11.64],
          [78.13, 11.6],
        ],
      ],
    },
    status: 'CONFLICT',
    hasConflict: true,
    recordId: 'REC-033/2A-PATTA',
  },
]
