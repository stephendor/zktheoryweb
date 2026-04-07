/**
 * PersistenceDiagramBuilder.stories.helpers.tsx — Task 3.7b — Agent_Interactive_Core
 *
 * Helper components for PersistenceDiagramBuilder.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with nested interactives,
 * render-prop patterns, and expression children is safe here.
 *
 * See PovertySimulator.stories.helpers.tsx for the established pattern.
 */

import { PersistenceDiagramBuilder } from './PersistenceDiagramBuilder';
import React from 'react';

/** Full builder rendered at a realistic page width. */
export function DefaultBuilder() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <PersistenceDiagramBuilder />
    </div>
  );
}

/** Builder in a narrow-viewport wrapper to exercise responsive layout. */
export function NarrowViewport() {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <PersistenceDiagramBuilder />
    </div>
  );
}

/**
 * Paused story wrapper — simulates prefers-reduced-motion: reduce so the
 * component auto-pauses on mount. Story-only code; not used in production.
 */
export function PausedBuilder() {
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
      <PersistenceDiagramBuilder />
    </div>
  );
}
