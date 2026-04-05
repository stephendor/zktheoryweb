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

import { useState, useCallback, useEffect, useRef } from 'react';

type Lens = 'politics' | 'math';

interface TwoLensesToggleProps {
  defaultLens?: Lens;
}

export function TwoLensesToggle({ defaultLens = 'politics' }: TwoLensesToggleProps) {
  const [activeLens, setActiveLens] = useState<Lens>(defaultLens);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const switchLens = useCallback((lens: Lens) => {
    setActiveLens(lens);

    // Walk up the DOM to find the nearest .interlude-content ancestor
    const el = buttonRef.current;
    if (!el) return;
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      if (node.classList.contains('interlude-content')) {
        node.setAttribute('data-lens', lens);
        break;
      }
      node = node.parentElement;
    }
  }, []);

  // Set initial data-lens on mount
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      if (node.classList.contains('interlude-content')) {
        node.setAttribute('data-lens', defaultLens);
        break;
      }
      node = node.parentElement;
    }
  }, [defaultLens]);

  return (
    <div className="two-lenses-toggle" role="group" aria-label="Reading mode">
      <span className="two-lenses-label" aria-hidden="true">
        Reading mode:
      </span>
      <div className="two-lenses-control">
        <button
          ref={buttonRef}
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
