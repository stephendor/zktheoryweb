---
agent: Agent_Infra
task_ref: Task 2.11
status: Completed
ad_hoc_delegation: true
compatibility_issues: false
important_findings: true
---

# Task Log: Task 2.11 – Vitest Setup & First Component Tests

## Summary

Extended the existing minimal Vitest configuration with globals, jest-dom matchers, and path aliases; wrote 5 new behavioural tests (2 for Sidenote, 3 for BibTexCopyButton); documented the testing framework in CONTRIBUTING.md. All 10 tests pass; lint and build are clean.

## Details

**Step 1 — Framework evaluation + config extension**

Vitest confirmed as correct for this stack: it shares Vite's transform pipeline with Astro (no JSX/TS config drift), has native ESM support, and @testing-library/react 16 targets it as first-class. Jest was rejected (requires separate Babel/ts-jest, incomplete ESM); Playwright was rejected (E2E layer, not unit test runner).

Changes made:
- `vitest.config.ts`: added `globals: true` (no manual imports of `describe`/`it`/`expect`), `setupFiles: ['./vitest.setup.ts']`, and `resolve.alias` for all 5 tsconfig path aliases (`@components`, `@layouts`, `@lib`, `@styles`, `@data`). Confirmed `css: false` remains correct.
- `vitest.setup.ts`: created — imports `@testing-library/jest-dom` globally, enabling richer DOM matchers project-wide.
- `tsconfig.json`: added `"types": ["vitest/globals", "@testing-library/jest-dom"]` and included `vitest.setup.ts` in the `include` array so TypeScript resolves globals and jest-dom types in test files without manual imports.
- Installed `@testing-library/jest-dom` as devDependency.

All 5 existing ExpandableCard tests passed after config changes — no regressions.

**Step 2 — Sidenote tests**

Created `src/components/shared/Sidenote.test.ts` (`.ts` — no JSX needed). Since Astro components cannot be rendered in Vitest, tests construct a minimal DOM fragment equivalent to Sidenote.astro's mobile `<details>/<summary>` branch. Two tests: (1) `<details>` is closed by default, (2) clicking `<summary>` opens it. Both passed immediately.

**Step 2 — BibTexCopyButton tests**

Created `src/components/tda/BibTexCopyButton.test.tsx`. Encountered a persistent bug where the `navigator.clipboard.writeText` spy reported 0 calls across all 3 attempts:

1. `Object.assign(navigator, ...)` — rejected by happy-dom (getter-only property).
2. `Object.defineProperty(navigator, 'clipboard', ...)` — installed an own property that the component bypassed via the prototype getter.
3. `vi.spyOn(navigator.clipboard, 'writeText')` — spy placed on the original Clipboard instance, but the component received a different instance.

Delegated to Ad-Hoc Debug agent after the mandatory 3-attempt limit.

**Ad-Hoc delegation finding:** `@testing-library/user-event` v14's `userEvent.setup()` internally calls `attachClipboardStubToView()`, which replaces `navigator.clipboard` with a `ClipboardStub` via `Object.defineProperty`. When `userEvent.setup()` is called inside the test body (after `beforeEach`), the spy targets the original Clipboard, but the component receives the stub — hence 0 spy calls. Fix: call `userEvent.setup()` in `beforeEach` **before** `vi.spyOn`, so the spy is installed on the stub. Shared `user` instance declared at describe scope; per-test `userEvent.setup()` calls removed.

All 3 BibTexCopyButton tests passed after integrating the fix.

**Step 3 — CONTRIBUTING.md + final verification**

Replaced the placeholder "Testing" section in `CONTRIBUTING.md` with comprehensive documentation covering: framework table, `npm run test` usage, what to/not to test, file naming conventions, the Astro-component DOM-fragment pattern, and the clipboard mock pattern (with code example).

Final verification: `npm run test` (10/10), `npm run lint` (0 errors), `npm run build` (clean, 17 pages prerendered).

## Output

- `vitest.config.ts` — extended with globals, setupFiles, resolve.alias
- `vitest.setup.ts` — created; imports @testing-library/jest-dom globally
- `tsconfig.json` — added vitest/globals and @testing-library/jest-dom types; included vitest.setup.ts
- `src/components/shared/Sidenote.test.ts` — 2 tests (details toggle behaviour)
- `src/components/tda/BibTexCopyButton.test.tsx` — 3 tests (render, clipboard call, aria-label update)
- `CONTRIBUTING.md` — Testing section added

## Issues

Clipboard spy required Ad-Hoc delegation — see Ad-Hoc Agent Delegation section below.

## Ad-Hoc Agent Delegation

**Triggered by**: 3 failed debugging attempts to mock `navigator.clipboard.writeText` in happy-dom + user-event v14 (mandatory delegation per protocol).

**Root cause found**: `@testing-library/user-event` v14's `userEvent.setup()` replaces `navigator.clipboard` with a `ClipboardStub` via `Object.defineProperty`. When `userEvent.setup()` runs after `beforeEach`, any previously installed spy targets the now-replaced original object. The component always calls through the stub, bypassing the spy.

**Solution**: In `beforeEach`, call `userEvent.setup()` first (to attach the stub), then `vi.spyOn(navigator.clipboard, 'writeText')` (to spy on the stub). Declare `user` at describe scope; do not create new `userEvent.setup()` instances per test.

## Important Findings

**Key principle for all future tests requiring clipboard mocking in this project:**

In Vitest + happy-dom + user-event v14, `userEvent.setup()` must be called in `beforeEach` **before** `vi.spyOn(navigator.clipboard, ...)`. Any test that calls `userEvent.setup()` inside the test body after `beforeEach` has run will cause the spy to target the wrong clipboard instance (0 calls recorded). This is a non-obvious ordering constraint specific to user-event v14's clipboard stub mechanism.

The documented clipboard mock pattern in `CONTRIBUTING.md` captures this correctly for future agent/contributor reference.

## Next Steps

None — task fully complete. All deliverables produced and verified.
