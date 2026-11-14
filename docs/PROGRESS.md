# PROGRESS

Phase tracker. Updated at the end of every phase (R11).

## Phases

- [ ] Phase 0  Environment & E: drive
- [ ] Phase 1  Backend skeleton
- [ ] Phase 2  Data model & catalogues
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
| D4 | GitHub repo created in Phase 0 | Local repo only; no `origin` yet | `gh` CLI is not installed. Add the remote when the repo is created on github.com |
| D5 | `npm_config_cache` / `npm_config_prefix` user env vars | Also written to `C:\Users\Aadil\.npmrc` | npm reads `.npmrc`, not the inherited env block, so the env vars alone left npm pointed at `C:\Users\Aadil\AppData\Local\npm-cache` |

## Open questions carried forward

- `docs/03_FRONTEND_PLAN.md` was never supplied. Phases 15-17 therefore build the **basic** UI only; the 3D scroll landing remains unplanned.
- Zone membership has two possible sources of truth (`factories.hazard_zone_id` vs `site_terrain.zone_ids`). Pin this in Phase 2.

## Phase log

### Phase 0 - in progress
- E: folder layout created; caches and TEMP redirected to `E:\dev-cache`.
- Tools verified: Node 24.16 on E:, Git on E:, Python 3.12.10 on C: (see D2).
- Backend venv created on E:; dependencies installing.
- Frontend scaffolded with Vite (React) on E:; libraries installing.
- Repo tree (section 5) created with stubs; brief and blueprint copied into `docs/`.