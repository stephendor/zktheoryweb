---
agent: Agent_Interactive_Core
task_ref: Task_3.6b
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 3.6b — Five Transitions Timeline: Interaction & Accessibility

## Summary

Added the full interaction layer (hover/focus annotation panel, chapter dot click-through, touch/swipe), responsive vertical mobile layout (<768px), keyboard navigation, ARIA live region, text-description toggle, reduced-motion support, 3 new Storybook stories, and 13 Vitest interaction tests. Build, lint, and all 124 tests pass.

## Details

**Step 1 — Interaction layer:**
- `BandGroup` extended with `isActive`, `onActivate`, `onDeactivate`, `tabIndex`, `onKeyDown` props; lifted active-index state to parent component
- `AnnotationPanel` component renders below `.tt-scroll` (never overlapping SVG); shows era number/title/date-range, pull-quote from `BAND_CLAIMS` map, chapter count
- Panel fades in/out via `opacity` transition (skipped when `reducedMotion` is true with `.tt-annotation--instant`)
- Each chapter dot in `ThreadStrandGroup` wrapped in SVG `<a href="/counting-lives/chapters/ch-NN/">` with zero-padded number and `aria-label`
- Touch/swipe: `scroll-behavior: smooth` added to `.tt-scroll`; `touch-action: pan-x` on the scroll container div — native browser scroll, no custom handler needed
- `arrowKeyHandler` attached to SVG element via `useEffect`; traverses `.tt-band-link` elements on left/right arrow; `onActivate` intentionally omitted from deps (stable `useCallback` ref) with `// eslint-disable-next-line` on the closing `}, []` line
- `Enter`/`Escape` on band links: first `Enter` opens annotation (prevents default); second `Enter` allows navigation; `Escape` navigates immediately

**Step 2 — Responsive mobile layout:**
- `useWindowWidth` hook: SSR-safe (defaults to `Infinity` so server always renders horizontal); coalesces resize events via `requestAnimationFrame`
- `isMobile = windowWidth < MOBILE_BREAKPOINT` (768px); public component switches between `<MobileLayout>` and horizontal SVG render path
- `MobileLayout`: `<ol>` of 5 `<li>` cards; each card has a left border coloured by `data-transition` attribute, era header `<a>`, thread strand `<ul>` with links to thread pages, chapter count
- Mobile cards support up/down arrow traversal and Enter/Escape keyboard nav
- No flash of unstyled content: `useState(Infinity)` means SSR renders horizontal; `useEffect` then sets real width on mount

**Step 3 — A11y, Storybook, tests:**
- `AriaLiveRegion` announces focused era name + date range, debounced 200ms
- `TextDescriptionToggle` wraps whole component; `buildTextDescription()` emits ordered prose list of all 5 eras with date ranges, chapter counts, thread strand chapter titles
- `useReducedMotion` plumbed through to both annotation panel and mobile cards
- 3 new Storybook helpers: `TimelineAnnotationOpen` (forceActiveIndex=1), `TimelineMobileViewport` (375px constrained), `TimelineTextDescription` (auto-opens details toggle via ref click)
- 3 new story exports: `AnnotationOpen`, `MobileLayout`, `TextDescriptionFallback`
- New test file `TransitionsTimeline.interaction.test.tsx`: 13 tests across annotation panel (hidden/visible, correct title/dates/count) and mobile breakpoint (switches at 768px, 5 cards, correct data-transition attrs, thread links present)
- `afterEach(cleanup)` added explicitly — without it, rendered nodes leaked into `ExpandableCard.test.tsx` in the same happy-dom worker, causing 2 pre-existing tests to fail

**Pre-existing broken content fixed (blocker for build):**
- `paper-02.mdx:8` — two YAML keys concatenated on one line (`enables: [3, 5]methods:`)
- `paper-03.mdx:25` — `\'` backslash escape inside YAML single-quoted string (invalid YAML; changed to `''` doubling)
- `paper-09.mdx:7` — two YAML keys concatenated on one line (`depends_on: [7, 8]enables: []`)
These were introduced by another agent's work (confirmed via `git stash` baseline comparison).

## Output

**Modified files:**
- `src/components/interactives/TransitionsTimeline.tsx` — full interaction layer, mobile layout hook + component, a11y imports, annotation panel, text description builder
- `src/components/interactives/TransitionsTimeline.css` — annotation panel styles, mobile card styles, scroll-behavior: smooth, dot link styles
- `src/components/interactives/TransitionsTimeline.stories.tsx` — 3 new story exports
- `src/components/interactives/TransitionsTimeline.stories.helpers.tsx` — 3 new helper components
- `src/content/tda/papers/paper-02.mdx` — YAML fix (not my task, but required for build)
- `src/content/tda/papers/paper-03.mdx` — YAML fix
- `src/content/tda/papers/paper-09.mdx` — YAML fix

**New files:**
- `src/components/interactives/TransitionsTimeline.interaction.test.tsx` — 13 Vitest tests

**Final counts:** 0 lint errors · 0 new lint warnings · 124/124 tests pass · build exits 0

## Issues

**Test pollution (resolved):** Without `afterEach(cleanup)`, rendered React nodes from TransitionsTimeline tests leaked into ExpandableCard tests running in the same happy-dom worker, causing 2 failures. Fixed by adding explicit `cleanup` import and `afterEach` call.

**aria-hidden serialisation (resolved):** `aria-hidden={false}` in React is serialised by happy-dom as the string `"false"`, not removed from the attribute list. Assertion changed to `not.toBe('true')` to be environment-neutral.

**pre-existing content YAML errors (resolved):** Three content files had concatenated YAML keys from another agent's edit — blocked the Astro build. Fixed inline.

## Important Findings

**eslint-disable placement with dependency-array effects:** The `eslint-disable-next-line react-hooks/exhaustive-deps` directive must be placed on the line immediately before the closing `}, [])` of the `useEffect` call (i.e., inside the effect body as a trailing comment). Placing it before `useEffect(()` does not suppress the warning, which fires on the deps-array line at close.

**SVG `<a>` elements support onKeyDown in React/JSX:** React synthetic events wire correctly to SVG `<a>` elements, enabling keyboard interaction (`Enter`/`Escape`) without needing a separate non-SVG focusable wrapper. This is the correct pattern for keyboard-accessible SVG band links.

**happy-dom cleanup required explicitly:** @testing-library/react v16 does NOT auto-call `cleanup()` after each test in Vitest. `afterEach(cleanup)` must be added manually in test files that render React components, otherwise rendered DOM leaks between test files sharing the same worker.

## Next Steps

Task 3.6b complete — Timeline fully delivered. Manager may proceed to next phase task.

compatibility_issues: false
important_findings: false
---

<!-- To be populated by Agent_Interactive_Core upon task completion -->
