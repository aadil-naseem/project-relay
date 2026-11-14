# PROGRESS

Phase tracker. Updated at the end of every phase (R11).

## Phases

- [x] Phase 0  Environment & E: drive
- [x] Phase 1  Backend skeleton
- [x] Phase 2  Data model & catalogues
- [ ] Phase 3  Demo world & seeding
- [ ] Phase 4  Real-data prefetch
- [ ] Phase 5  M1 API
- [ ] Phase 6  M3 SPOF
- [ ] Phase 7  M4 Exposure
- [ ] Phase 8  M5 Stress test
- [ ] Phase 9  M6 Matching
- [ ] Phase 10 M8 Readiness
- [ ] Phase 11 M7/M9/M10
- [ ] Phase 12 M2 Passport + RFQ
- [ ] Phase 13 Orchestration
- [ ] Phase 14 BACKEND TEST GATE
- [ ] Phase 15 Frontend setup
- [ ] Phase 16 Frontend screens
- [ ] Phase 17 Integration test
- [ ] Phase 18 Freeze & submission

## Decisions and deviations from the blueprint

Recorded here so the blueprint stays pristine and both files remain readable to a future session.

| # | Blueprint says | What we did | Why |
|---|---|---|---|
| D1 | Root at `E:\Projects\factory-continuity-desk\` | Root at `E:\VihaanX-Build\` | User decision at kickoff. `.env.example` `DATABASE_URL` rewritten to match. No other path assumptions in code (all paths resolved via `pathlib`) |
| D2 | Python 3.12 installed to `E:\Python312` | Kept existing `C:\Users\Aadil\AppData\Local\Programs\Python\Python312` (3.12.10) | Reinstalling the interpreter mid-event adds risk with no real gain: the bulk (venv + site-packages) is on E:, which is what the C: rule is protecting |
| D3 | Ollama optional, models on `E:\dev-cache\ollama` | Ollama dropped | E: has 13.3 GB free; a vision model would consume most of the remaining headroom. Provider chain runs cache -> Gemini -> text rules -> manual |
| D4 | GitHub repo `factory-continuity-desk` created in Phase 0 | Remote is `https://github.com/aadil-naseem/project-relay` (user pre-created it empty, per the organisers' submission rule) | Repo name on GitHub is `project-relay`, matching the renamed project. `origin/main` now tracks `main` |
| D5 | `npm_config_cache` / `npm_config_prefix` user env vars | Also written to `C:\Users\Aadil\.npmrc` | npm reads `.npmrc`, not the inherited env block, so the env vars alone left npm pointed at `C:\Users\Aadil\AppData\Local\npm-cache` |
| D6 | Install `requirements-data.txt` (OSMnx) in Phase 0 | Deferred to Phase 4 | Connection is running ~80 kB/s; OSMnx pulls geopandas/pyproj/fiona/scikit-learn (hundreds of MB). It is only needed for the one-time prefetch. If it still fails, the cut order allows site-only exposure |
| D7 | - | `check_c_drive_leaks.ps1` rewritten to resolve process -> user -> machine | Windows does not push updated user env into an already-running shell, so a naive `$env:` check reports false leaks. Script now distinguishes STALE-PROCESS from LEAK |
| D8 | `PIP_CACHE_DIR` user env var | Also written to `C:\Users\Aadil\AppData\Roaming\pip\pip.ini` | Same reason as D5: a shell without the env var makes pip fall back to `C:\Users\Aadil\AppData\Local\pip\cache`. **The file must be UTF-8 without BOM** - with a BOM, pip silently outputs nothing and exits 0 |
| D9 | - | Deleted the pre-existing `C:\...\Local\npm-cache` (5.10 GB) and `C:\...\Local\pip` (0.75 GB) | C: had **0.00 GB free**. After cleanup: **6.36 GB free**. These were caches from before the redirect, not project data |

## Open questions carried forward

- `docs/03_FRONTEND_PLAN.md` was never supplied. Phases 15-17 therefore build the **basic** UI only; the 3D scroll landing remains unplanned.
- Zone membership source of truth pinned in Phase 2: `factories.hazard_zone_id` (and vendors/suppliers alike) is authoritative; `site_terrain.zone_ids` is derived at prefetch time only.

## Phase log

### Phase 0 - DONE
- E: folder layout created; caches and TEMP redirected to `E:\dev-cache`.
- Tools verified: Node 24.16 on E:, Git on E:, Python 3.12.10 on C: (see D2).
- Backend venv on E: with all runtime + dev packages. Versions: fastapi 0.162.7, pydantic 2.14.3, sqlalchemy 2.1.8, numpy 2.5.4, shapely 2.2.0, pymupdf 2.1. All imports verified.
- Frontend scaffolded with Vite (React 19.3.1, three 0.187, R3F 9.8.2); libraries installed, 0 vulnerabilities; `npm run build` passes (177 ms).
- Repo tree (section 5) created with stubs; brief and blueprint copied into `docs/`.
- Git initialised on `main`, first commit `64ceddf`, 134 tracked files; `node_modules`, `.venv`, `.env` confirmed ignored.
- C: leak audit passes: pip/npm cache, prefix, TEMP, TMP, HF_HOME, Playwright all resolve to E:. Project footprint 599 MB; E: free 11.9 GB.
- **Open-Meteo verified live** (see VERIFIED_FACTS.md). Two findings that change the plan:
  1. Live forecast for Ambattur right now is **dry (1.1 mm / 72 h)** - so `live` mode produces no alert. Replay is mandatory for the demo, not optional.
  2. Michaung archive is strong: **238.7 mm on 2023-12-04**. Replay series should start **2023-12-03T00:00Z** so onset lands at ~37-40 h rather than ~72 h.
- **Gemini verified live**: `gemini-3.5-flash-lite` is the only responsive model on this key. Text 1.5 s, vision 5.6-13.1 s (variable). Larger flash models are 404/503/timeout. Golden cache is therefore load-bearing, not optional.
- Outstanding, deliberately deferred: `requirements-data.txt` (OSMnx, D6) and the GitHub remote (D4).

**Phase 0 done-when checklist:** python + node work from E: (PATH) - **PASS**; installs produced no C: leak - **PASS**; repo pushed to GitHub - **PASS** (remote `project-relay` added retroactively at kickoff of Phase 2; empty repo was pre-created by the user per organisers' rule); `.env` has Gemini key - **PASS**; smoke results recorded - **PASS**; folder tree matches section 5 - **PASS**.

### Phase 1 - DONE (commit 2615245)
- `settings.py`: pydantic-settings reading `backend/.env` resolved from the file location, not CWD; env vars beat .env (pytest depends on this).
- `db.py`: engine + WAL + FK pragma + `Base` (tables land in Phase 2) + `get_db` dependency + `init_db()`.
- `core/clock.py`: UTC-aware `now()` with `set_now` / `reset_now` / `frozen_time` for deterministic tests.
- `core/geo.py`: haversine + point-in-circle.
- `core/trace.py`: JSON-safe calculation-log builder (recursive stringification).
- `errors.py`: `AppError` + handlers for AppError / validation (422) / HTTP (404) / unexpected (500), all through `{"error": {code, message, details}}`.
- `config_loader.py`: all 7 YAMLs load into typed pydantic models with fail-fast validators (weights sum to 1, breakpoints ascending, default window in windows list). Generic aliases validated via `TypeAdapter`.
- All 7 YAML constants written from section 7 + the demo world (section 9) + back-test sites; replay start 2023-12-03T00:00Z per Phase 0 verification.
- `api/health.py`: status + db + weather mode + vision chain (cache/gemini configured booleans).
- `pyproject.toml`: ruff (E4/E7/E9/F/I, line 120) + pytest config + `live` marker.
- Tests: 27 passing (health, clock, geo, trace, errors, config loader). Test DB on E:, disposed before deletion (Windows file-lock lesson).
- Done-when: uvicorn serves `/docs` (200) and `/api/v1/health` (status ok, db ok, weather_mode replay, both vision providers configured); pytest green; ruff clean.

**Lessons recorded for later phases:** YAML parses unquoted ISO timestamps as datetime (model now typed `datetime`) and unquoted commas inside flow mappings split keys (quote strings with commas). Numeric-looking material aliases must be quoted.

### Phase 2 - DONE (commit 633f6d4, pushed)
- `enums.py` per section 6 plus extras the data model needs: Trigger, VendorKind, PassportStatus, ShareLevel. `RiskLevel.from_score` carries the bands (LOW < 25, MODERATE < 50, HIGH < 75, SEVERE >= 75).
- All 22 ORM tables in `app/models/`: factory aggregate (factories, machines, vendors, vendor_links), parts spine (parts, part_steps, orders), passports (passports, rfqs, passport_shares), relationships (backup_relationships, relationship_checks), hazard facts (hazard_zones, site_terrain, routes), computed stores (forecast_cache, exposure_snapshots, stress_tests, readiness_snapshots), recovery (recovery_requests, recovery_steps), app_state.
- `parts.passport_id <-> passports.part_id` cycle solved with `use_alter=True, ondelete="SET NULL"` on both sides; insert ordering consequence handled (passport committed before parts reference it).
- Pydantic schemas for every section 8 endpoint (shapes only; routers are Phase 5+). Uniform error envelope and TraceEntry in `schemas/common.py`.
- `scripts/init_db.py` (with sys.path bootstrap): builds all 22 tables against `backend/data/fcd.sqlite`, WAL verified.
- Tests: 46 passing (enum coverage, full write->read round trips through real schema, FK enforcement, table-set equality). Ruff clean. Server boots with models loaded.
- Done-when: `init_db.py` creates 22 tables; WAL on, foreign_keys on through the app engine; pytest green; ruff clean; `/api/v1/health` ok.

**Lessons recorded for later phases:** SQLite PRAGMAs are per-connection - the engine's connect listener sets them, so a raw `sqlite3.connect` shows foreign_keys=0 (not a bug). `use_alter` FKs are excluded from insert ordering, so seed/test code must commit the referenced row first. Scripts need `sys.path.insert(0, backend)` to import `app` when run as files.