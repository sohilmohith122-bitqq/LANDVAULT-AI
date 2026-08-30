/**
 * LANDVAULT AI — demo data barrel.
 *
 * Re-exports all hand-authored sample datasets so features can import from a
 * single path (`@/lib/demo-data`) in demo / no-backend mode. Each module
 * satisfies the contract defined in `@/types` and mirrors the shape produced
 * by the real backend endpoints (`api.ts`).
 */

export { DEMO_AUDIT_EVENTS } from './audit'
export { DEMO_CONFLICTS } from './conflicts'
export { DEMO_DOCUMENTS } from './documents'
export { DEMO_GIS_PARCELS } from './parcels'
export { DEMO_LAND_RECORDS } from './records'
export { DEMO_VALIDATION_RESULTS } from './validation'