# Factory Continuity Desk (Relay)

Production-continuity platform for small precision-component manufacturers. It finds where a factory would break *before* a disruption, and shows who could cover the work.

**Pitch:** *Find where your factory breaks before the flood does, then show who can cover it.*

## Status

24-hour hackathon build (Vihaan X, software track, Open Innovation). Factories, capacities and approvals in the demo are **sample / simulated**. Weather, terrain and road data are real.

## Layout

```
backend/    FastAPI + SQLite + pure-logic core (see docs/02_TECHNICAL_BLUEPRINT.md)
frontend/   React + Vite
docs/       frozen brief, technical blueprint, progress, verified facts
```

## Run (Windows, from the project root)

```powershell
# backend
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
.\.venv\Scripts\python.exe scripts\reset_demo.py
.\.venv\Scripts\python.exe -m pytest -q

# frontend
cd ..\frontend
npm run dev
```

API docs: `http://localhost:8000/docs`. UI: `http://localhost:5173`.

## Demo mode

Default weather mode is `replay`: real Cyclone Michaung rainfall (Dec 2023) time-shifted to now, so the demo does not depend on live forecast availability. Switch with `POST /api/v1/demo/mode`.

## Limitations (stated honestly)

- Risk scores are **risk indicators** from forecast rain and site conditions, not flood predictions.
- Backup status reflects tracked checks; it is not proof of quality.
- Matching is an aid to assessment, not certification.
- A backup factory being far away does not make it safe; correlated risk is checked explicitly.

## Attributions

- Weather data by [Open-Meteo.com](https://open-meteo.com)
- Map data © [OpenStreetMap](https://www.openstreetmap.org) contributors