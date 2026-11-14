# M2 live accuracy check (Gemini, `live` marker)

Run: 2026-11-14 13:41 UTC - model `gemini-3.5-flash-lite`,
one call per sample PNG, JSON-output mode, temperature 0.

| Drawing | Fields correct | Latency | Detail |
|---|---|---|---|
| pump_shaft | 6/6 | 2.7 s | part_name: OK, drawing_no: OK, revision: OK, customer: OK, quantity: OK, material: OK |
| piston_rod | 6/6 | 3.4 s | part_name: OK, drawing_no: OK, revision: OK, customer: OK, quantity: OK, material: OK |
| valve_flange | 6/6 | 2.5 s | part_name: OK, drawing_no: OK, revision: OK, customer: OK, quantity: OK, material: OK |

**Overall accuracy: 100% (18/18) on title-block fields.**

Note: the demo never calls this live path - the golden cache answers for the
sample drawings (sub-3 s). Live vision is the fallback for new drawings.
