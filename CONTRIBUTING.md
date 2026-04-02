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

Run `npm test` before committing (available once configured in Task 2.11).

## Pull Requests

- Keep PRs focused on a single task or fix.
- Reference the relevant task ID in the PR description (e.g., `Task 1.2`).
- Ensure `npm run lint`, `npm run format:check`, and `npm run check` all pass before
  opening a PR.
