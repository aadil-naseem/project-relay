# VERIFIED FACTS

Anything external (URLs, parameter names, model names, response shapes, limits) must be **verified live** and recorded here before it is used in code (R5).

Status key: `VERIFIED` = checked against provider docs or a live call today. `ASSUMED` = from the blueprint, not yet checked. `BLOCKED` = could not verify; fallback in use.

---

## Environment (verified at Phase 0)

| Item | Value | How |
|---|---|---|
| OS | Windows | `$PSVersionTable` / session |
| Project root | `E:\VihaanX-Build` | created |
| `E:` free space at start | 13.3 GB | `Get-PSDrive E` |
| Python | 3.12.10 at `C:\Users\Aadil\AppData\Local\Programs\Python\Python312\python.exe` | `python --version` |
| Node | v24.16.0 at `E:\Program Files\nodejs\node.exe` | `node -v` |
| npm | 12.1.0 | `npm -v` |
| Git | `E:\Program Files\Git\cmd\git.exe` | `where git` |
| npm cache | `E:\dev-cache\npm` | `npm config get cache` |
| npm prefix | `E:\dev-cache\npm-global` | `npm config get prefix` |
| TEMP / TMP | `E:\dev-cache\temp` | user env |

---

## Open-Meteo

| Endpoint | Status | Notes |
|---|---|---|
| Forecast (`api.open-meteo.com/v1/forecast`) | ASSUMED | hourly `precipitation`, multi-location batching, `timezone`/`forecast_days` params to be confirmed at Phase 7 |
| Archive (`archive-api.open-meteo.com/v1/archive`) | ASSUMED | historical hourly precipitation for the Michaung replay window |
| Elevation (`api.open-meteo.com/v1/elevation`) | ASSUMED | batch coordinate limits to be confirmed at Phase 4 |

- No API key required. Attribution "Weather data by Open-Meteo.com" required in UI.
- Live smoke results: _pending (0.9)_

## Gemini (drawing reading)

| Item | Status | Notes |
|---|---|---|
| Free-tier model name | ASSUMED | `GEMINI_MODEL` left empty until checked in AI Studio |
| REST request shape / JSON output config | ASSUMED | to verify in Phase 12 before writing the adapter |
| Billing | n/a | key must be created **without** billing enabled |

- Live smoke result: _pending (0.9)_

## OpenStreetMap / OSMnx

| Item | Status | Notes |
|---|---|---|
| OSMnx install on Windows + Python 3.12 | ASSUMED | `requirements-data.txt`, not yet installed |
| Overpass usage | n/a | prefetch only, never at runtime |

---

## Seed / demo world claims (need a citation before they go on a slide)

| Claim | Status | Source |
|---|---|---|
| Ambattur north phase (~1,500 units) flooded during Cyclone Michaung, Dec 2023 | ASSUMED | blueprint §9, source not yet recorded |
| Oragadam / SIPCOT estates resumed within days | ASSUMED | blueprint §9, source not yet recorded |