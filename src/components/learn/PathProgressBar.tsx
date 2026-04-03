/**
 * src/components/learn/PathProgressBar.tsx — Task 4.2 — Agent_Schema_Platform
 *
 * Client-only React island that reads localStorage progress for a learning
 * path and renders an accessible progress bar.
 *
 * Usage in src/pages/learn/index.astro:
 *   <PathProgressBar client:only="react" pathSlug={path.slug} totalModules={path.moduleCount} />
 *
 * Replaces the static `.path-card__progress` block rendered by Agent_Design_Templates.
 *
 * SSR safety: all localStorage reads occur inside ProgressProvider's useEffect.
 * On the initial render (before hydration) the component shows 0% — identical
 * to the static placeholder it replaces.
 */

import './PathProgressBar.css';
import { ProgressProvider, useProgress } from '@lib/useProgress';

interface Props {
  pathSlug: string;
  totalModules: number;
}

// ─── Inner component (reads from context) ─────────────────────────────────────

function ProgressBarInner({ pathSlug, totalModules }: Props) {
  const { pathPercentage } = useProgress();
  const pct = pathPercentage(pathSlug, totalModules);
  const completed = Math.round((pct / 100) * totalModules);

  // Derive fill colour from slug: topology-* → TDA teal; others → CL red.
  const fillColor = pathSlug.startsWith('topology')
    ? 'var(--color-tda-teal)'
    : 'var(--color-cl-red)';

  const label = `${completed} of ${totalModules} modules complete`;

  return (
    <div className="ppb-wrapper">
      <div className="ppb-label">
        <span>Progress</span>
        <span className="ppb-pct">{pct}%</span>
      </div>
      {/* Using a div with ARIA role to allow reliable cross-browser fill styling */}
      <div
        className="ppb-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="ppb-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      <p className="ppb-label" style={{ marginTop: 'var(--space-1)', marginBottom: 0 }}>
        <span className="sr-only">{label}</span>
        <span aria-hidden="true">{completed}/{totalModules} modules</span>
      </p>
    </div>
  );
}

// ─── Exported island (wraps provider) ────────────────────────────────────────

export default function PathProgressBar({ pathSlug, totalModules }: Props) {
  return (
    <ProgressProvider pathSlug={pathSlug}>
      <ProgressBarInner pathSlug={pathSlug} totalModules={totalModules} />
    </ProgressProvider>
  );
}
