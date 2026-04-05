---
agent: Agent_Design_System
task_ref: Task 6.6-follow
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 6.6-follow – DarkModeToggle Vanilla JS Conversion

## Summary

Replaced the React `DarkModeToggle.tsx` island with a pure Astro/vanilla-JS component (`DarkModeToggleAstro.astro`), eliminating the React DOM runtime from pages that have no other React islands. Build, all 420 unit tests, and all 27 accessibility tests pass.

## Details

1. **Read all dependency files** before writing code: `DarkModeToggle.tsx`, `SiteNav.astro`, `BaseLayout.astro`, `global.css`.

2. **Created `src/components/shared/DarkModeToggleAstro.astro`**:
   - Button with `id="dark-mode-toggle"`, `type="button"`, `aria-label="Switch to dark mode"` (default)
   - Both SVG icons (sun + moon) copied verbatim from the TSX, converted to HTML attribute names (`stroke-width`, `stroke-linecap`)
   - CSS-driven icon swap: both icons present in DOM at all times; visibility toggled via `data-theme` on `<html>` — no hydration flash
   - Scoped `<style>` for button sizing/colours (44×44px, border, focus ring)
   - `<style is:global>` for all four icon show/hide rules — necessary because (a) the `[data-theme="dark"]` ancestor selector lives on `<html>` outside any component scope, and (b) Astro's scoped attribute (cid) raises specificity of the default rules, which would otherwise override the global dark-mode rules
   - Vanilla JS `<script>` (Astro module script, auto-deferred): syncs `aria-label` on mount, toggles theme+localStorage on click, listens to `prefers-color-scheme` only when no `localStorage.theme` key

3. **Updated `src/components/shared/SiteNav.astro`**:
   - Removed `import DarkModeToggle from '@components/shared/DarkModeToggle.tsx'`
   - Added `import DarkModeToggleAstro from '@components/shared/DarkModeToggleAstro.astro'`
   - Replaced `<DarkModeToggle client:load />` with `<DarkModeToggleAstro />`
   - Removed the three `:global(.dark-mode-toggle)` CSS rule blocks (moved into new component)
   - Retained all SiteNav layout/positioning styles (no flex/margin styles existed specifically for the toggle)

4. **Deleted `src/components/shared/DarkModeToggle.tsx`** — confirmed no remaining imports elsewhere in `src/`.

5. **Verified build output**:
   - Writing essay page (`/writing/essays/sample-essay/`) and TDA paper page (`/tda/papers/paper-01/`): zero `client.*.js` references in generated HTML — React runtime absent ✓
   - CL chapter page (`/counting-lives/chapters/ch-01/`): still loads `client.Diyn9Kyd.js` (expected — ExpandableCard uses `client:visible`) ✓
   - Toggle button (`#dark-mode-toggle`) present in prose page HTML ✓

## Output

- **Created**: `src/components/shared/DarkModeToggleAstro.astro`
- **Modified**: `src/components/shared/SiteNav.astro`
- **Deleted**: `src/components/shared/DarkModeToggle.tsx`
- **React runtime** (`client.Diyn9Kyd.js`): 178K uncompressed / ~55K gzip — still present for interactive components (PovertySimulator, FiltrationPlayground, etc.) but **no longer loaded on prose pages** with no other React islands
- **Toggle vanilla JS**: bundled inline by Astro module system — negligible additional footprint (~500–800B estimated)
- **Pages freed from React load**: all prose pages without other React islands (most writing/TDA papers/learning module pages)

## Issues

None. Build, unit tests, lint, and accessibility spec all passed first attempt.

## Important Findings

**Icon direction change**: The existing `DarkModeToggle.tsx` showed the **moon icon in light mode** and **sun icon in dark mode** (icon represents the action: "click to switch to dark/light"). The task instructions explicitly and consistently specify **sun in light mode, moon in dark mode** (icon represents current state). The new component follows the task specification. Manager should confirm this is the intended UX direction, as it is a visible behaviour change from the Task 6.4 implementation.

## Next Steps

None from this task. React is now scoped to only pages that genuinely need interactive components.
