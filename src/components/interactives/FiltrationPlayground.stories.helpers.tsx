/**
 * FiltrationPlayground.stories.helpers.tsx — Task 5.3 — Agent_Interactive_Advanced
 *
 * Helper components for FiltrationPlayground.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with render-prop patterns,
 * expression children, and nested interactive components is safe here.
 *
 * See MapperParameterLab.stories.helpers.tsx / PersistenceDiagramBuilder.stories.helpers.tsx
 * for the established pattern.
 */

import { FiltrationPlayground } from './FiltrationPlayground';

/** Default: empty canvas at a realistic page width. */
export function DefaultStory() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <FiltrationPlayground />
    </div>
  );
}

/**
 * Circle preset wrapper.
 * Reviewer should click the "Circle (8 pts)" preset to load points and then
 * step through or animate the filtration.
 */
export function WithCirclePreset() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <p
        style={{
          fontFamily: 'system-ui',
          fontSize: 13,
          marginBottom: '0.5rem',
          color: '#555',
        }}
      >
        Click <strong>Circle (8 pts)</strong> preset, then press Play or step through
        the filtration to watch β₁ rise when a loop forms.
      </p>
      <FiltrationPlayground />
    </div>
  );
}

/**
 * Figure-eight preset wrapper.
 * Reviewer should click the "Figure-8 (11 pts)" preset — two persistent loops
 * expected (β₁ = 2 at intermediate radii).
 */
export function WithFigureEight() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <p
        style={{
          fontFamily: 'system-ui',
          fontSize: 13,
          marginBottom: '0.5rem',
          color: '#555',
        }}
      >
        Click <strong>Figure-8 (11 pts)</strong> preset — look for β₁ = 2 at
        intermediate radii (two loops before the loops fill).
      </p>
      <FiltrationPlayground />
    </div>
  );
}

/** Narrow viewport wrapper to exercise the responsive grid layout at 360 px. */
export function NarrowViewport() {
  return (
    <div style={{ width: 360, padding: '1rem', boxSizing: 'border-box' }}>
      <FiltrationPlayground />
    </div>
  );
}

import React from 'react';

/**
 * Paused story wrapper — overrides window.matchMedia to simulate
 * prefers-reduced-motion: reduce so the component auto-pauses on mount.
 * Story-only code; not used in production.
 */
export function PausedStory() {
  const origRef = React.useRef<typeof window.matchMedia | undefined>(undefined);

  if (typeof window !== 'undefined' && !origRef.current) {
    origRef.current = window.matchMedia.bind(window);
    window.matchMedia = (q: string): MediaQueryList =>
      q === '(prefers-reduced-motion: reduce)'
        ? ({
            matches: true, media: q, onchange: null,
            addEventListener: () => {}, removeEventListener: () => {},
            addListener: () => {}, removeListener: () => {},
            dispatchEvent: () => true,
          } as MediaQueryList)
        : origRef.current!(q);
  }

  React.useEffect(() => {
    return () => {
      if (origRef.current) window.matchMedia = origRef.current;
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <p style={{ fontFamily: 'system-ui', fontSize: 13, marginBottom: '0.5rem', color: '#555' }}>
        Simulating <code>prefers-reduced-motion: reduce</code>. The component auto-pauses
        on mount — the &ldquo;Resume animation&rdquo; button is visible.
      </p>
      <FiltrationPlayground />
    </div>
  );
}
