---
agent: Agent_Interactive_Core
task_ref: Task_3.1
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 3.1 – Shared Interactive Infrastructure

## Summary

All shared interactive foundations established: `src/lib/viz/` directory with type definitions, `ResponsiveContainer`, D3 utility modules, a11y infrastructure, and Storybook 10 fully configured and building. All success criteria met: Astro build clean, lint clean, 10/10 tests passing, Storybook static build complete.

## Details

**Step 1 — Types & ResponsiveContainer:**
- Created `src/lib/viz/types.ts` with `VizDimensions` and `VizProps<T>` interfaces; inline comments document `client:visible` vs `client:idle` hydration strategy
- Created `src/lib/viz/ResponsiveContainer.tsx` using `ResizeObserver` render-prop pattern; SSR-safe (`dimensions` initialised to `null`, only renders children after `useEffect` fires)
- Co-located `src/lib/viz/ResponsiveContainer.css` to avoid inline style lint warning (ESLint flags `style={{...}}` as an editor hint; confirmed zero real lint errors via direct `eslint` invocation)

**Step 2 — D3 & Utilities:**
- Installed `d3@^7.9.0` + `@types/d3@^7.4.3`
- `scales.ts`: `getVizColorScale()` and `getPaletteColor(name)` read live CSS custom properties so dark-mode overrides are automatic
- `axes.ts`: `renderXAxis`/`renderYAxis` with `integer`/`percentage`/`year` tick-format shortcuts and centred axis labels
- `tooltip.ts`: `createTooltip`/`showTooltip`/`hideTooltip`/`destroyTooltip` with right-edge and bottom-edge overflow clamping
- Applied dark-mode `--color-viz-4: #D4C000` override in `[data-theme="dark"]` block of `tokens.css` (alongside existing `--color-viz-8` override)

**Step 3 — A11y Infrastructure:**
- `keyboardNav.ts`: `makeFocusable(selection)` + `arrowKeyHandler(items, onFocus)` for SVG keyboard navigation
- `AriaLiveRegion.tsx`: visually-hidden `aria-live="polite"` announcer component
- `TextDescriptionToggle.tsx`: `<details>/<summary>` disclosure wrapper; uses `visibility: hidden` (not `display: none`) to preserve chart layout
- `useReducedMotion.ts`: SSR-safe hook defaulting `false` on server; subscribes to `'change'` media query events
- `paletteEnforcement.ts`: no-op in production via `import.meta.env.DEV` guard; reads live CSS values for dark-mode correctness

**Step 4 — Storybook:**
Encountered and resolved three significant Storybook 10 + Vite 8/rolldown compatibility issues (see Important Findings). Final working config:
- `.storybook/main.ts` with `viteFinal` adding `@vitejs/plugin-react()`, `tailwindcss()`, and `cssMinify: false`
- `.storybook/preview.ts` using classic `Preview` type (not `definePreview` which is ESM-only)
- `ResponsiveContainer.stories.tsx` using `React.createElement` in all render functions (JSX workaround — see findings)
- `ResponsiveContainer.stories.helpers.tsx` (non-story file) contains all complex JSX components imported by the story
- Added `storybook-static/` to ESLint ignores in `eslint.config.js`
- Added `storybook` and `build-storybook` scripts to `package.json`

## Output

Modified files:
- `src/styles/tokens.css` — `--color-viz-4` dark-mode override added
- `eslint.config.js` — `storybook-static/` added to ignores
- `package.json` — `storybook` and `build-storybook` scripts added

Created files:
- `src/lib/viz/types.ts`
- `src/lib/viz/ResponsiveContainer.tsx`
- `src/lib/viz/ResponsiveContainer.css`
- `src/lib/viz/scales.ts`
- `src/lib/viz/axes.ts`
- `src/lib/viz/tooltip.ts`
- `src/lib/viz/a11y/keyboardNav.ts`
- `src/lib/viz/a11y/AriaLiveRegion.tsx` + `AriaLiveRegion.css`
- `src/lib/viz/a11y/TextDescriptionToggle.tsx` + `TextDescriptionToggle.css`
- `src/lib/viz/a11y/useReducedMotion.ts`
- `src/lib/viz/a11y/paletteEnforcement.ts`
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `src/lib/viz/ResponsiveContainer.stories.tsx`
- `src/lib/viz/ResponsiveContainer.stories.helpers.tsx`

## Issues

None blocking. All checks pass: `npm run build` ✓ · `npm run lint` ✓ · `npm run test` (10/10) ✓ · `npm run build-storybook` ✓

## Important Findings

**Storybook 10 + Vite 8/rolldown compatibility — THREE critical issues for all Phase 3 agents writing stories:**

### Finding 1: `@storybook/react-vite` v10 does NOT include `@vitejs/plugin-react`
In Vite 8/rolldown, `@storybook/react-vite`'s preset does not add `@vitejs/plugin-react` to the plugin chain. Without it, rolldown's OXC parser has no JSX configuration and fails on ALL `.tsx` files with "JSX syntax is disabled". **Fix**: `viteFinal` in `.storybook/main.ts` must explicitly include `react()` from `@vitejs/plugin-react`.

### Finding 2: `inject-export-order-plugin` runs on raw TSX source in rolldown
Despite `enforce: "post"` intent, Storybook's `inject-export-order-plugin` (using `es-module-lexer` WASM) processes story files BEFORE JSX transformation in rolldown's pipeline. `es-module-lexer` fails on:
- JSX self-closing tags as children (`<Tag />` inside another element)
- Expression children (`{expr}` in JSX)
- Text node children
- JSX nesting deeper than 2 levels
**Fix**: Story files (`*.stories.tsx`) must use `React.createElement` for ALL render functions. Complex JSX must live in a separate helper file with a non-story name (e.g., `.stories.helpers.tsx`).

### Finding 3: `definePreview` is ESM-only in `@storybook/react`
`definePreview` is exported from the ESM bundle of `@storybook/react` but NOT from the CJS bundle (`dist/index.js`). rolldown resolves the CJS entry and throws `MISSING_EXPORT`. **Fix**: Use the classic `Preview` type with `export default preview` in `.storybook/preview.ts`.

### Additional: lightningcss rejects Tailwind v4 `@theme` at-rule
Storybook's default CSS minifier (lightningcss) does not know the `@theme` custom at-rule used by Tailwind v4. **Fix**: Set `cssMinify: false` in `viteFinal`'s build config.

## Next Steps

Phase 3 story authors must follow the patterns in `.storybook/main.ts` and `ResponsiveContainer.stories.tsx` (see important findings). All parallel Phase 3 tasks (3.2, 3.3, 3.4, 3.6a, 3.7a) can now proceed with the shared infrastructure available in `src/lib/viz/`.

