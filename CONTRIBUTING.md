# Contributing to zktheory.org

## Branch Naming

| Type    | Pattern                         | Example                        |
| ------- | ------------------------------- | ------------------------------ |
| Feature | `feature/<phase>-<description>` | `feature/phase1-design-tokens` |
| Fix     | `fix/<description>`             | `fix/nav-keyboard-focus`       |
| Chore   | `chore/<description>`           | `chore/update-dependencies`    |

## Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

**Types:** `feat`, `fix`, `style`, `refactor`, `test`, `docs`, `chore`

**Examples:**

```
feat: add TDA filtration slider component
fix: correct footnote anchor IDs on mobile
docs: update PRD with Astro 6 version note
chore: upgrade prettier to v3
```

## Code Style

1. Run `npm run format` before committing — formats all files with Prettier.
2. Run `npm run lint` and resolve all errors before committing (warnings are acceptable).
3. Run `npm run check` to verify TypeScript and Astro diagnostics are clean.

## Accessibility

All components must meet **WCAG 2.1 AA**. The ESLint `jsx-a11y` plugin enforces this
automatically — do not suppress a11y warnings.

## Testing

### Framework

| Tool | Role |
|---|---|
| [Vitest](https://vitest.dev/) 4.x | Test runner — shares Vite's transform pipeline with Astro, so JSX/TSX/TS is transformed identically in tests and production builds |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) | Render and query React islands |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) v14 | Simulate user interactions (always prefer over `fireEvent`) |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | DOM matchers: `toBeInTheDocument`, `toBeVisible`, `toHaveAttribute`, etc. |
| [happy-dom](https://github.com/capricorn86/happy-dom) | Lightweight DOM environment (faster than jsdom; sufficient for all behavioural tests) |

### Running tests

```bash
npm run test          # single run
```

### What to test

- **React islands** (`.tsx`): use `@testing-library/react` + `userEvent` to test component behaviour — ARIA states, user interactions, conditional rendering.
- **Astro component JS behaviour** (`.ts`): Astro `.astro` files cannot be rendered in Vitest (server-rendered). Test the DOM behaviour they produce by constructing equivalent DOM fragments directly with happy-dom (see `Sidenote.test.ts` for the pattern).
- **Do not test** visual styling, CSS classes, or animation timing — `css: false` is set in `vitest.config.ts` intentionally.

### File naming

| Component type | Test file name |
|---|---|
| React island (`.tsx`) | `ComponentName.test.tsx` |
| Vanilla JS / Astro DOM behaviour | `ComponentName.test.ts` |

Test files live alongside the component in the same directory.

### Note on Astro components

Astro `.astro` components cannot be imported or rendered inside Vitest — they are processed by the Astro build pipeline which is not available in the Vitest JS runtime. Test the JavaScript or HTML behaviour they produce instead:

1. Identify the interactive or structural contract (e.g. a `<details>` disclosure, an ARIA attribute, a DOM relationship).
2. Construct a minimal equivalent DOM fragment using `document.createElement` in a `.test.ts` file.
3. Assert the browser/DOM contract (e.g. `details.open === false` by default; clicking `summary` sets `details.open === true`).

### Mocking patterns

**Clipboard API** — `navigator.clipboard` is replaced by a `user-event` stub when `userEvent.setup()` is called. Always call `userEvent.setup()` in `beforeEach` **before** `vi.spyOn`, so the spy is placed on the stub (not the original object). Example from `BibTexCopyButton.test.tsx`:

```typescript
describe('MyComponent', () => {
  let writeTextSpy: ReturnType<typeof vi.spyOn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup(); // MUST be first — attaches ClipboardStub to navigator
    writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

## Pull Requests

- Keep PRs focused on a single task or fix.
- Reference the relevant task ID in the PR description (e.g., `Task 1.2`).
- Ensure `npm run lint`, `npm run format:check`, and `npm run check` all pass before
  opening a PR.
