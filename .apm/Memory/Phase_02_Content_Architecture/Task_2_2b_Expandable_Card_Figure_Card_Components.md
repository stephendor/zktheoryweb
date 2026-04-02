---
agent: Agent_Design_Templates
task_ref: Task 2.2b
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 2.2b — Expandable Card & Figure Card Components (Shared)

## Summary

Built `<ExpandableCard>` React island and `<FigureCard>` Astro component, installed the minimum Vitest stack, and wrote 5 passing behavioral tests. All checks pass: `npm run test` (5/5), `npm run lint` (0 errors), `npm run build` (0 errors).

## Details

### Step 1 — ExpandableCard.tsx

- Props: `title: string`, `detail: React.ReactNode`, `defaultOpen?: boolean` (default `false`), `accentColor?: string` (default `"var(--color-cl-red)"`)
- State managed with `useState(defaultOpen)`. Panel id generated with `useId()` (stripped to alphanumeric), ensuring stable unique ids across renders.
- ARIA: `<button aria-expanded aria-controls>` trigger; panel has `role="region"`, `aria-label={title}`, and `aria-hidden={isOpen ? undefined : true}` — the panel is removed from the accessibility tree when collapsed.
- `+`/`−` icon toggled with state; wrapped in `aria-hidden="true"` span (decorative).
- Accent colour injected as `--ec-accent` CSS custom property via `style={}` on the wrapper div. This is the only inline style; it sets a local CSS variable to allow the CSS file to reference it without knowing the value at author time.
- Animation in `ExpandableCard.css`: `grid-template-rows: 0fr → 1fr`, 250 ms ease. `overflow: hidden` on `.ec-panel-inner` makes the grid-row collapse clip content. `@media (prefers-reduced-motion: reduce)` disables all transitions.
- **client directive: `client:visible`** — the component lives in the article body (below the fold), so hydration on viewport entry is appropriate and more efficient than `client:load` or `client:idle`.

### Step 2 — FigureCard.astro

- Props: `name`, `dates`, `role`, `relatedChapters: Array<{slug, title}>`, `imageSrc?`, `imageAlt?`
- Portrait area: if `imageSrc` is present, renders `<img>` with `alt` attribute (falls back to `"Portrait of {name}"`); if absent, renders a styled placeholder `<div>` with `role="img"` and `aria-label="Portrait of {name}"`.
- `min-width: 16rem` set on `.figure-card` to match the parent `repeat(auto-fill, minmax(16rem, 1fr))` grid convention — no wrapper-level layout logic required.
- Related chapter links use `var(--color-cl-red)` with pill styling; hover fills the pill with `--color-cl-red`.
- `@media (prefers-reduced-motion: reduce)` disables link transitions.

### Step 3 — Vitest setup and tests

- Installed: `vitest@4.1.2`, `@testing-library/react`, `@testing-library/user-event`, `happy-dom`, `@vitejs/plugin-react` (as devDependencies).
- `@vitejs/plugin-react` was installed explicitly (not relying on transitive availability via `@astrojs/react`) for guaranteed JSX transformation in the test environment.
- `vitest.config.ts` at project root: `plugins: [react()]`, `environment: 'happy-dom'`, `include: ['src/**/*.test.{ts,tsx}']`, `css: false` (CSS imports treated as empty modules — irrelevant for behavioral tests).
- `"test": "vitest run"` added to `package.json` scripts.
- `ExpandableCard.test.tsx`: 5 behavioral tests using `@testing-library/react` + `userEvent.setup()`. Uses `aria-controls` to resolve the panel's id for collapsed-state queries (since `aria-hidden="true"` removes the panel from the accessible tree, `getByRole` won't find it without `document.getElementById`).
- All 5 tests pass in 199 ms total.

## Output

- `src/components/shared/ExpandableCard.tsx` — named export `ExpandableCard`, React island
- `src/components/shared/ExpandableCard.css` — animation + token-based styling
- `src/components/shared/FigureCard.astro` — Astro component, grid-ready
- `src/components/shared/ExpandableCard.test.tsx` — 5 Vitest tests, all passing
- `vitest.config.ts` — minimal Vitest config at project root
- `package.json` — `"test"` script added

## Issues

None. All three commands passed cleanly (pre-existing build warnings about empty content collections are unrelated to this task).

## Important Findings

1. **`--color-neutral-subtle` token does not exist.** The task spec referenced this token for the FigureCard portrait placeholder background. It is absent from `src/styles/tokens.css`. I used `--color-cl-cream` instead (archival cream, contextually appropriate for historical figure cards). The Manager should decide whether to add `--color-neutral-subtle` to the token file for future use, or document `--color-cl-cream` as the standard placeholder colour.

2. **`aria-hidden` on collapsed panel removes it from accessible tree.** This is intentional and matches the ARIA disclosure pattern. Testing Library's `getByRole` won't find the panel when collapsed; tests use `document.getElementById(aria-controls-value)` to resolve the panel for collapsed-state assertions. Future tests or consumers should be aware of this pattern.

3. **`client:visible` chosen for `<ExpandableCard>`.** Documented in component header comment and here for Manager awareness. If any ExpandableCard instance needs to be above the fold (e.g. first key claim visible on load), the call site should override to `client:load`.

## Next Steps

- Task 2.11 (full Vitest framework evaluation) may extend `vitest.config.ts` — config is intentionally minimal and non-conflicting.
- If `--color-neutral-subtle` is added to `tokens.css`, update `FigureCard.astro` placeholder background accordingly.
- `ChapterLayout.astro` still uses native `<details>/<summary>` for key claims; Task 2.2b output is ready to replace them — that wiring is a call-site change in `ChapterLayout.astro` (swap `<details>` map for `<ExpandableCard client:visible ... />`).
