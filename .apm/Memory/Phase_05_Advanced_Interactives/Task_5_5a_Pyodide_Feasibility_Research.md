---
agent: Agent_Interactive_Advanced
task_ref: Task 5.5a
status: Completed
ad_hoc_delegation: true
compatibility_issues: false
important_findings: true
---

# Task Log: Task 5.5a – Pyodide Feasibility Research

## Summary

Pyodide is **not feasible** for live in-browser TDA computation. All core TDA compute libraries (ripser, gudhi, giotto-tda) have no Emscripten/WASM wheels and cannot be installed via `micropip`. The pre-computed-only strategy (c) is the sole viable path and is recommended.

## Details

Delegated a comprehensive feasibility investigation to an Ad-Hoc Research agent. The agent accessed official Pyodide docs, PyPI simple index wheel listings, Pyodide GitHub Issues/Discussions, and release notes for Pyodide 0.29.3 (latest stable, Jan 28 2026, Python 3.13.2, Emscripten 4.0.9).

**Key investigation areas:**
1. Bundle size and cold-load performance
2. TDA library availability via `micropip` for each target package
3. Performance benchmarks for a ~20-point VR persistence computation
4. Known runtime limitations (memory, Safari, mobile, threading)
5. Strategy selection from options (a), (b), (c)

**Decision reached**: Strategy (c) — pre-computed JSON, no Pyodide at runtime.

## Output

### Q1 — Bundle Size & Load Time

| Configuration | Network Size | Desktop Load (50 Mbps) | Mobile Load (4G) |
|---|---|---|---|
| Core runtime only | ~5–7 MB | ~1–3 s | — |
| Runtime + NumPy | ~11–14 MB | ~4–7 s | — |
| Runtime + NumPy + SciPy | ~25–30 MB | **10–18 s** | **30–60 s** |

The minimum stack for any TDA workflow (runtime + NumPy + SciPy) fails the < 5 s threshold on cold load, before computation begins. **Cold-load FAIL.**

### Q2 — TDA Library Availability via `micropip`

| Package | Emscripten Wheel | Bundled | Installable | Useful for Live TDA |
|---|---|---|---|---|
| ripser 0.6.14 | No | No | **FAIL** | No |
| giotto-tda 0.6.x | No | No | **FAIL** | No |
| gudhi 3.x | No | No | **FAIL** | No |
| scikit-tda 0.0.3 | No (pure shell) | No | Yes (empty) | No |
| persim 0.3.8 | No (pure Python) | No | Yes | Only with pre-computed data |

All compute libraries require C/C++ extensions that have no Emscripten wheel. No community requests or GitHub issues exist for TDA support in Pyodide — this integration has never been attempted.

`persim` installs but only analyses existing diagrams (bottleneck/Wasserstein distance); it cannot compute persistence diagrams.

### Q3 — Performance Benchmark

No benchmarks obtainable — no TDA library installs in Pyodide. The research confirmed zero community precedent. Informational note: if a WASM ripser wheel ever existed, WASM runs 2–5× slower than native; 20-point computation would take ~5–25 ms. The cold-load cost (10–18 s) would dominate regardless.

### Q4 — Known Limitations

- **Memory**: NumPy + SciPy consume ~300–500 MB WASM heap; mobile OOM risk on 3 GB devices
- **Safari**: Fixed in 0.27.3/0.28.0; `wasm-unsafe-eval` CSP required; SharedArrayBuffer requires COOP/COEP headers (may fail on some iOS deployments)
- **Mobile**: 30–60 s load for scientific stack on mid-range Android; effectively unusable
- **Threading**: `threading.Thread.start()` raises `RuntimeError`; `multiprocessing` non-functional; any joblib-parallel code requires `n_jobs=1`
- **NumPy/SciPy**: Both fully functional in 0.29.3 (NumPy 2.2.5, SciPy 1.14.1); no open issues

### Q5 — Recommended Strategy: **(c) Pre-computed only**

**Rationale**: The blocker is binary (no WASM wheels exist), not a performance threshold. Building Emscripten-compiled TDA wheels requires substantial upstream maintainer investment that is not underway. Strategy (b) hybrid is not viable because the full numpy+scipy cold-load (10–18 s) cannot be amortised across a general academic audience visiting a single interactive.

**Implementation spec for Task 5.5b:**

- **Build-time**: Native `ripser` in a CI/dev build script; emit static JSON assets to `src/data/tda/`
- **JSON schema per interactive**:
  ```json
  {
    "metadata": { "n_points": 20, "max_dimension": 1, "epsilon_range": [0.0, 2.0] },
    "point_cloud": [[x1, y1], ...],
    "diagrams": {
      "H0": [{"birth": 0.0, "death": 0.42}, ...],
      "H1": [{"birth": 0.31, "death": 1.15}, ...]
    }
  }
  ```
- **Browser runtime**: React + D3/Three.js (already in stack); filtration slider drives epsilon over pre-computed data; no Pyodide loaded
- **Mobile/Safari**: Zero runtime dependencies; pre-computed JSON < 100 ms load on any device
- **`micropip.install()` calls**: None

## Issues

None. Research returned conclusive findings; delegation produced actionable design decision.

## Ad-Hoc Agent Delegation

Delegated to an Ad-Hoc Research agent (attempt 1) to investigate Pyodide 0.29.3 feasibility. Agent accessed:
- pyodide.org official docs (packages list, changelog, WASM constraints, FAQ, download guide)
- PyPI simple index for ripser, gudhi, giotto-tda, scikit-tda, persim
- github.com/pyodide/pyodide releases, issues, and discussions
- Pyodide blog release posts (0.27, 0.28)

Findings were comprehensive and conclusive on the first delegation attempt. No re-delegation required.

## Important Findings

1. **Hard blocker — no WASM wheels**: ripser, gudhi, and giotto-tda have no `cp313-cp313-emscripten_*_wasm32` wheels on PyPI and are absent from Pyodide's built-in package list. Zero community activity exists requesting this. This is not a version-lag issue; it reflects that TDA C++ libraries have not been ported.

2. **Cold-load threshold violated**: The minimum viable Pyodide stack (runtime + NumPy + SciPy) takes 10–18 s on desktop and 30–60 s on mobile before any computation begins, violating the < 5 s UX target.

3. **Strategy (c) is the only viable path**: Pre-computed JSON served as static assets provides full interactivity (filtration slider, diagram rendering, parameter exploration) with zero runtime cost and full mobile/Safari compatibility.

4. **`persim` is installable but insufficient**: It analyses pre-existing diagrams only; it cannot be used to compute diagrams in-browser.

5. **Task 5.5b specification is fully unblocked**: The research produced an exact JSON schema, asset path convention (`src/data/tda/`), and build-time toolchain recommendation that can be implemented immediately once approved.

6. **Pyodide is fully viable for non-TDA calculations** (distance matrices, filtration parameter visualisation, statistical scaffolding) if ever needed in future tasks — NumPy 2.2.5 and SciPy 1.14.1 are both stable and bundled. This distinction should be noted for any future interactive that performs light numeric computation where live interactivity would add genuine value.

## Next Steps

- **Manager Agent review required before Task 5.5b is issued** (gate condition per task instructions)
- Upon approval, Task 5.5b implementation should:
  1. Create a build script (`scripts/compute-tda.py`) using native ripser to generate JSON assets
  2. Define the JSON schema as a TypeScript type in `src/lib/tda/types.ts`
  3. Implement the interactive React component consuming pre-computed JSON
  4. Define static asset paths under `src/data/tda/`
