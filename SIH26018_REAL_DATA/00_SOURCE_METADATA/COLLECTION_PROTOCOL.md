# Data Collection Protocol — LANDVAULT AI (SIH26018)

## Golden rules

1. **Official sources only.** Every row in every dataset must carry `source` and `source_reference`
   pointing at the portal URL / document number it came from (see `sources.csv`).
2. **No scraping of protected services.** TN land-record services (Patta/Chitta/FMB/Adangal/ILR/TNREGINET)
   are CAPTCHA/login-protected. Collect **manually** via the official search UI, or through authorized
   bulk channels (TNGIS registered downloads, data.gov.in APIs with a server-side key).
   Building an automated CAPTCHA bypass or credential-stuffing scraper is prohibited.
3. **Never fabricate values.** If a field is not available in the source document, leave it EMPTY.
   Do not guess, interpolate, or synthesize. Empty is honest; invented is dangerous.
4. **Preserve originals.** `owner_name_original` is never overwritten; normalization writes to
   `owner_name_normalized`. FMB originals are stored once under `05_FMB/originals/` with a SHA-256
   `file_hash`; processing derives new artifacts, it never mutates the original.
5. **Provenance is mandatory.** The DB rejects rows missing `source` / `collected_at`.
6. **Privacy.** Ground truth containing real owner names stays in `13_GROUND_TRUTH/` which is
   git-ignored. Before sharing, run `backend/scripts/anonymize_ground_truth.py`.

## Manual collection workflow (per survey case)

1. Pick the survey: District → Taluk → Village → Survey No → Subdivision No.
2. On each official portal (see sources.csv priority order), search and save the extract
   (PDF/print-to-PDF) into the matching numbered folder, e.g. `02_PATTA/originals/`.
3. Fill the corresponding template CSV row (`*_template.csv`) — transcribe values EXACTLY,
   keep Tamil strings as-is, note the portal URL in `source_reference`.
4. Compute/record `collected_at` (date of collection) and `verification_status`
   (`UNVERIFIED` until cross-checked).
5. Ingest into the DB: `python backend/scripts/ingest.py --dataset patta --csv <file>`.
6. Cross-validate: `python backend/scripts/validate.py` writes `14_VALIDATION/validation_results.csv`.

## Folder ownership

| Folder | Contents | Git |
|---|---|---|
| 00_SOURCE_METADATA | sources.csv, protocol | committed |
| 01_GEOGRAPHY | districts/taluks/villages reference + boundaries | committed (public data) |
| 02_PATTA … 06_ADANGAL | transcribed extracts + `originals/` scans | templates committed; originals ignored |
| 07_ILR, 08_PATTA_TRANSFER | ILR / transfer history extracts | templates committed; originals ignored |
| 09_GIS | TNGIS downloads (geojson/shapefile/kml) | committed only if licence permits |
| 10–11 | TNREGINET EC / guideline values | templates committed; originals ignored |
| 12_OCR | pipeline OCR artifacts | ignored |
| 13_GROUND_TRUTH | human-verified cases (**personal data**) | **ignored** — never commit |
| 14_VALIDATION | validation engine output | committed (aggregate, anonymized) |

## Sprint sizing (do not exceed scope)

- Sprint 1: 1 district, 3 taluks, 5 villages (geography only)
- Sprint 2: 20–30 real land cases with Patta+Chitta+A-Register+FMB+Adangal where available
- Sprint 3: ILR, Patta Transfer History, EC/Registration, Guideline Value
- Sprint 4: OCR → Extraction → Normalization → Cross-source matching → Validation → Confidence
