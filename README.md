# LANDVAULT AI

**SIH26018 — Intelligent Land Record Digitization & Validation System (GovTech Platform)**

LandVault AI converts scanned, photographed, handwritten and multilingual Tamil Nadu land records (Patta, Chitta, FMB, A-Register, Adangal, Registration, GIS) into structured digital records — validates extracted information, detects conflicts, supports human-in-the-loop verification, and maintains an immutable audit trail.

> Prototype for demonstration · Synthetic data only · Does not certify legal ownership or validity
> Every AI extraction is confidence-scored · Human review decides · Every change is audited

## Product principles

- **Accuracy over flashy AI** — every extraction has a confidence score
- **Human-in-the-loop** — uncertain fields always rise to human review
- **Preserve originals** — original documents and AI values are never overwritten
- **Auditable by design** — every modification records old → new value, user, role, timestamp
- **Tamil + English first-class**, architecture ready for other Indian languages
- **Privacy & security first** — secrets stay server-side, backend enforces authorization

## Repository layout

```
├── frontend/            React 18 + Vite 5 + TypeScript + Tailwind + TanStack Query + i18next
│   └── src/
│       ├── components/  design system (ui kit, layout shell, brand mark)
│       ├── features/    dashboard · documents · upload · records · verification ·
│       │                conflicts · gis map · analytics · audit · users · settings
│       ├── lib/         API client (+ demo/no-backend mode), queries, demo-data
│       ├── i18n/        English + Tamil locales
│       ├── stores/      Zustand auth + UI stores
│       ├── styles/      design tokens (navy / paper / accent system)
│       └── types/       shared domain contract
├── backend/             FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── routers/     auth · stats · documents · records · conflicts · audit · activity · parcels
│   │   ├── models.py    geography, real-source, pipeline, audit entities
│   │   ├── serializers.py   DB → frontend JSON contract
│   │   ├── deps.py      bearer auth + role-based authorization
│   │   └── config.py    environment-driven settings (SQLite dev → PostGIS ready)
│   ├── scripts/         init_db.py (schema + seed + geography ingest), smoke_test.py
│   └── data/uploads/    uploaded originals (SHA-256 preserved)
└── SIH26018_REAL_DATA/  real-data workspace: geography + record-type CSV templates + protocol
```

## Quickstart

### Frontend (demo / no-backend mode — works out of the box)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

> Demo mode uses the hand-authored sample datasets in `frontend/src/lib/demo-data`.
> Any username + any password logs in (role maps by username: `admin`, `officer`, `verifier`, `viewer`).
> Set `VITE_DEMO_MODE=0` in `frontend/.env.local` to use the real backend.

### Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt                  # (if requirements file added)
python scripts/init_db.py        # writes SECRET_KEY to backend/.env, creates schema,
                                 # seeds admin/officer/verifier/viewer + ingests districts
python scripts/smoke_test.py     # 21-check API + RBAC smoke test (isolated temp DB)
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Seeded users print once on `init_db` (randomly generated passwords). Structure is ready for PostgreSQL + PostGIS via `DATABASE_URL`.

## API surface (backend + demo parity)

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/login` · `GET /api/auth/me` |
| Documents | `GET /api/documents` · `GET /api/documents/{id}` · `POST /api/documents` (upload) |
| Records | `GET /api/records` · `GET /api/records/{id}` · `GET /api/records/{id}/validation` · `POST /api/records/{id}/verify` |
| Conflicts | `GET /api/conflicts` · `GET /api/conflicts/{id}` · `POST /api/conflicts/{id}/resolve` |
| Audit / Activity | `GET /api/audit` · `GET /api/activity` |
| GIS | `GET /api/parcels` |
| Stats | `GET /api/stats/overview` |
| Health | `GET /api/health` |

## Design system

Deep-navy/charcoal primary on warm off-white, one restrained accent, red/orange reserved for warnings & conflicts, green for successful validation. See `frontend/src/styles/tokens.css`.