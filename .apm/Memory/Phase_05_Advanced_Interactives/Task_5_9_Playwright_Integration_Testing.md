---
agent: Agent_Infra
task_ref: Task_5_9
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 5.9 – Playwright Integration Testing Setup

## Summary

Installed Playwright 1.59.1, configured it for the project's Netlify-adapter
build, and wrote 21 E2E tests across two spec files. Final run: 20 passed, 1
intentional skip (WebKit 3D animation), 0 failures.

## Details

**Step 1 – Install and Configure (all browsers, config files):**
- Installed `@playwright/test@1.59.1` as dev dependency.
- Installed browser binaries: Chromium, Firefox, WebKit via `npx playwright install
  --with-deps`.
- Created `playwright.config.ts` with `testDir: ./e2e`, three browser projects,
  `webServer` block using `npx serve dist --listen 4321` (required because
  `@astrojs/netlify` adapter does not support `astro preview`), and
  `reuseExistingServer: !process.env.CI`.
- Added `test:e2e`, `test:e2e:ui`, `test:e2e:report` scripts to `package.json`.
- Added `playwright-report/` and `test-results/` to `.gitignore`.
- Added `playwright.config.ts` to ESLint global ignores.
- Lint: 0 errors, 1 pre-existing warning.

**Step 2 – Write Integration Tests:**

`e2e/interactives.spec.ts` (8 tests × 3 browsers = 21 instances):
1. NormalDistExplorer: toolbar hydration wait → SVG present → μ/σ handles visible
   → ArrowRight key changes SVG aria-label.
2. PersistenceDiagramBuilder: slider hydration wait → Circle (8 pts) preset
   (enables Play) → both panels visible → Play advances slider outside 0.
   WebKit skip on Play animation only.
3. PipelineGraph: SVG present → `role="button"` node visible → click navigates
   to `/tda/papers/`.
4. MapperParameterLab: HTTP 200 → `#mpl-resolution` slider visible → `.mpl-svg`
   attached.

`e2e/progress.spec.ts` (3 tests × 3 browsers = 9 instances):
1. Mark module 1 complete → localStorage written → navigate away and back →
   button shows completed state.
2. Mark modules 1–2 complete → navigate to `/learn/` → `role="progressbar"`
   has `aria-valuenow > 0`.
3. Module 3 has prev/next links → clicking Next navigates to module 4.

**Step 3 – Verify, Document, and Log:**
- `npm run test:e2e`: 20 passed, 1 skipped — all browsers green.
- `npm run test` (Vitest): 231 unit tests, 14 files — all green, no regressions.
- `npm run lint`: 0 errors, 1 pre-existing warning.
- `CONTRIBUTING.md` updated with `## End-to-End Testing` section.

## Output

- `playwright.config.ts` (project root)
- `e2e/interactives.spec.ts`
- `e2e/progress.spec.ts`
- `package.json` — `test:e2e`, `test:e2e:ui`, `test:e2e:report` scripts added
- `.gitignore` — `playwright-report/`, `test-results/` added
- `eslint.config.js` — `playwright.config.ts` added to ignores
- `CONTRIBUTING.md` — `## End-to-End Testing` section appended

## Issues

**Issue 1 (resolved): Stale server on port 4321.**
First test run returned empty page titles. Caused by `reuseExistingServer: true`
picking up a leftover `serve` process from manual testing. Resolved by killing
the lingering process before re-running. No config change needed; this is expected
local-dev behaviour.

**Issue 2 (resolved): Play button disabled on empty point cloud.**
`PersistenceDiagramBuilder` initialises with `points = []`. The Play button is
`disabled` when `points.length < 2`. Test was asserting `toBeEnabled()` before
loading a preset. Fixed by clicking the "Circle (8 pts)" preset first.

**Issue 3 (resolved): 3D vs 2D point cloud left panel.**
On Chromium/Firefox (WebGL2 available), the Wrapper upgrades to
`PersistenceDiagramBuilder3D`, where the left panel is `role="application"` (R3F
canvas wrapper) not `role="img"` (SVG). Fixed with a `.or()` locator:
`getByRole('img', { name: /Point cloud canvas/ }).or(getByRole('application', ...))`.

**Issue 4 (resolved): WebKit progress bar hydration timing.**
In WebKit, `PathProgressBar`'s `useEffect` reading localStorage could fire after
the `waitFor({ state: 'visible' })` resolved, leaving `aria-valuenow` at 0. Fixed
by replacing the value read with an `expect(progressBar).not.toHaveAttribute(
'aria-valuenow', '0', { timeout: 8_000 })` assertion that allows time for the
useEffect to run.

## Important Findings

**1. `client:visible` requires explicit `waitFor` in all interactive tests.**
All interactive components use `client:visible` (IntersectionObserver-gated
hydration). Even when the content appears in the viewport, the React bundle is
loaded and executed asynchronously. Every test must call
`await locator.waitFor({ state: 'visible', timeout: 10_000 })` on a React-rendered
element before making assertions. Playwright's default auto-waiting is insufficient
because it only retries DOM-level assertions, not script execution.

**2. `PersistenceDiagramBuilder3D` changes the left panel's ARIA role.**
When WebGL2 is supported (Chromium, Firefox), the Wrapper renders the R3F canvas
wrapped in `role="application"`. Tests that check the left panel must handle both
`role="img"` (2D SVG fallback) and `role="application"` (3D canvas). The
`.or()` locator pattern is the canonical way to handle this.

**3. `npx serve dist` with `@astrojs/netlify` is functional but sensitive.**
`reuseExistingServer: true` (local default) means any lingering process on port
4321 is silently reused. In local development, developers should be aware that
a stale server will be reused. The `test:e2e` script builds+tests cleanly because
the build terminates any previous CI server. For hot-reload E2E development,
start serve manually, then use `test:e2e:ui`.

**4. `PathProgressBar` lives on `/learn/` (hub), not on individual path pages.**
The progress test for "2 modules completed" navigates to `/learn/` (hub), not
to `/learn/topology-social-scientists/` as originally specified in the task. The
`PathProgressBar` component is only wired to `/learn/index.astro`.

## Next Steps

None — all deliverables complete and verified.
