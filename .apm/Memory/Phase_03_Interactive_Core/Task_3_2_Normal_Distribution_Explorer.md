---
agent: Agent_Interactive_Core
task_ref: Task_3.2
status: completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
date: 2026-04-03
---

# Task 3.2 — Normal Distribution Explorer

## Deliverables

| File | Description |
|---|---|
| `src/components/interactives/NormalDistExplorer.tsx` | Main React island — D3 PDF curve, draggable μ/σ handles, overlay system, full a11y |
| `src/components/interactives/NormalDistExplorer.css` | Co-located CSS — token-derived palette, kbd styling, overlay swatches, annotation borders |
| `src/components/interactives/NormalDistExplorer.data.ts` | 4 historical overlays (Quetelet 1835, Galton 1869, IQ 1912, Benefit Threshold 1960s) |
| `src/content/interactives/normal-distribution-explorer.mdx` | Content collection manifest entry |
| `src/pages/learn/interactives/[slug].astro` | Dynamic Astro route — `/learn/interactives/<slug>` |
| `src/components/interactives/NormalDistExplorer.stories.tsx` | 4 Storybook stories (React.createElement pattern) |
| `src/components/interactives/NormalDistExplorer.stories.helpers.tsx` | Complex JSX helpers (outside *.stories.* glob) |
| `src/components/interactives/NormalDistExplorer.test.ts` | 17 Vitest unit tests for `normalPDF` |

## Important Findings

### 1. D3 Drag / React State Stale Closure
D3 drag callbacks fire outside React's render cycle. A handler calling `setState` directly closes over stale state from the initialising render. **Fix:** pass stable `useCallback` refs (`onMuChange`, `onSigmaChange`) from the stateful parent; D3 drag only calls these stable refs.

### 2. D3 Scales Must Be `useMemo`-ised for `useEffect` Deps
Inline `d3.scaleLinear()` creates new references each render, causing the `useEffect` to re-run on every render (re-binding drag, re-rendering axes). **Fix:** wrap both scales in `useMemo`, list the memoised refs in the effect dep array.

### 3. `Math.random()` Is Impure in Render Body
`react-hooks/purity` flags `Math.random()` even inside `useRef(Math.random()).current`. **Fix:** module-level monotonic counter `let _idCounter = 0`.

### 4. IEEE 754 vs scipy Precision Mismatch
`normalPDF(115, 100, 15)` → JS gives `0.016131`; scipy gives `0.016137`. Always compute expected test values in the target JS runtime, not from scipy reference tables.

### 5. Extreme-Tail Underflow
`exp(-5000)` → `0` in IEEE 754. Tests asserting `toBeGreaterThan(0)` must stay within ±5σ (not ±100σ).

### 6. Dual `AriaLiveRegion` for Hover vs Parameter Announcements
Single live region causes hover readings to clobber debounced parameter announcements. **Fix:** `paramLiveMsg` (polite, 300ms debounce) + `hoverLiveMsg` (assertive, immediate).

### 7. Overlay Colour Stability
Activation-order index `i` in `colorScale(\`overlay-${i}\`)` causes colour shifts when overlays are toggled non-sequentially. **Fix:** pre-seed ordinal scale `.domain(OVERLAYS.map(o => o.id))`.

## Test Results

```
Tests  111 passed (111)
Lint   0 errors on all Task 3.2 files (ESLint CLI)
```

Pre-existing errors in `PipelineGraph.tsx` (Task 3.3) and `PovertySimulator.tsx` (Task 3.4) are out of scope.
