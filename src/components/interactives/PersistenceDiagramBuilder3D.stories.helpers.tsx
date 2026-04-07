/**
 * PersistenceDiagramBuilder3D.stories.helpers.tsx — Task 5.1 — Agent_Interactive_Advanced
 *
 * Helper components for PersistenceDiagramBuilder3D.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with nested components
 * and expression children is safe here.
 *
 * See PersistenceDiagramBuilder.stories.helpers.tsx for the established pattern.
 */

import { PersistenceDiagramBuilder3D } from './PersistenceDiagramBuilder3D';
import { PersistenceDiagramBuilderWrapper } from './PersistenceDiagramBuilderWrapper';
import React from 'react';

/** 3D builder rendered at a realistic page width. */
export function DefaultBuilder3D() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <PersistenceDiagramBuilder3D />
    </div>
  );
}

/** 3D builder in a narrow-viewport wrapper to exercise responsive layout. */
export function NarrowViewport3D() {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <PersistenceDiagramBuilder3D />
    </div>
  );
}

/**
 * Wrapper component story helper — renders the progressive-enhancement
 * wrapper which auto-detects WebGL2 support.
 */
export function WrapperDefault() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <PersistenceDiagramBuilderWrapper />
    </div>
  );
}

/**
 * Paused story wrapper — simulates prefers-reduced-motion: reduce so the
 * component auto-pauses on mount. Story-only code; not used in production.
 */
export function PausedBuilder3D() {
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
      <PersistenceDiagramBuilder3D />
    </div>
  );
}
