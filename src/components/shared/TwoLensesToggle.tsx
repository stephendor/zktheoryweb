/**
 * TwoLensesToggle.tsx — Task 6.3 — Agent_Integration
 *
 * React island for mathematical interlude pages.
 * Switches between two reading modes:
 *   - "Political Stakes" (default): historical/intuitive framing
 *   - "Mathematical Formulation": technical treatment
 *
 * The toggle sets data-lens="politics"|"math" on the nearest
 * .interlude-content ancestor, which CSS uses to show/hide
 * .is-politics and .is-math lens sections.
 *
 * Usage: <TwoLensesToggle client:load />
 * Must be rendered inside a .interlude-content wrapper div.
 */

import { useState, useCallback, useEffect } from 'react';

type Lens = 'politics' | 'math';

interface TwoLensesToggleProps {
  defaultLens?: Lens;
}

export function TwoLensesToggle({ defaultLens = 'politics' }: TwoLensesToggleProps) {
  const [activeLens, setActiveLens] = useState<Lens>(defaultLens);

  const switchLens = useCallback((lens: Lens) => {
    setActiveLens(lens);
    // document.querySelector is more reliable than parentElement walking:
    // Astro island wrappers (<astro-island>) insert into the DOM tree and can
    // make the ref-based walk miss the .interlude-content ancestor.
    const container = document.querySelector<HTMLElement>('.interlude-content');
    if (container) {
      container.setAttribute('data-lens', lens);
    }
  }, []);

  // Set the initial data-lens on mount (matches the defaultLens prop)
  useEffect(() => {
    const container = document.querySelector<HTMLElement>('.interlude-content');
    if (container) {
      container.setAttribute('data-lens', defaultLens);
    }
  }, [defaultLens]);

  return (
    <div className="two-lenses-toggle" role="group" aria-label="Reading mode">
      <span className="two-lenses-label" aria-hidden="true">
        Reading mode:
      </span>
      <div className="two-lenses-control">
        <button
          type="button"
          className={`two-lenses-btn${activeLens === 'politics' ? ' two-lenses-btn--active' : ''}`}
          aria-pressed={activeLens === 'politics'}
          onClick={() => switchLens('politics')}
        >
          Political Stakes
        </button>
        <button
          type="button"
          className={`two-lenses-btn${activeLens === 'math' ? ' two-lenses-btn--active' : ''}`}
          aria-pressed={activeLens === 'math'}
          onClick={() => switchLens('math')}
        >
          Mathematical Formulation
        </button>
      </div>
    </div>
  );
}

export default TwoLensesToggle;
