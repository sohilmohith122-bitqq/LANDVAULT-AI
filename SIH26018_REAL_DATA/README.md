# SIH26018_REAL_DATA — Real land-record data workspace

This workspace holds **only real, officially sourced data** — no synthetic values.
Schemas follow the project data plan; ingestion into the backend DB is via
`backend/scripts/ingest.py`. Read `00_SOURCE_METADATA/COLLECTION_PROTOCOL.md`
before collecting anything.

```
00_SOURCE_METADATA   sources.csv + collection protocol (legal + provenance rules)
01_GEOGRAPHY         districts / taluks / villages (codes + EN/TA names) + TNGIS boundaries
02_PATTA             Patta extracts (official TN e-Services)            P0
03_CHITTA            Chitta extracts                                    P0
04_A_REGISTER        A-Register extracts                                P0
05_FMB               FMB originals (hash-preserved) + metadata          P0
06_ADANGAL           e-Adangal crop/season/irrigation extracts          P0
07_ILR               Integrated Land Record extracts                    P0
08_PATTA_TRANSFER    Patta transfer history (2016+, private lands)      P0
09_GIS               TNGIS layers: geojson / shapefile / kml            P0
10_REGISTRATION      TNREGINET EC + registration documents              P1
11_GUIDELINE_VALUE   TNREGINET guideline values                         P1
12_OCR               pipeline OCR artifacts (derived, ignored)          P1
13_GROUND_TRUTH      human-verified cases — PERSONAL DATA, git-ignored  P0
14_VALIDATION        cross-source validation output (anonymized)        P0
```

Every `*_template.csv` defines the exact columns; keep headers untouched.
Rows without `source` + `collected_at` (where applicable) are rejected by the ingester.
