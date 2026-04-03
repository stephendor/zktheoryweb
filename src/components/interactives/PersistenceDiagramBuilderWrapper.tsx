/**
 * PersistenceDiagramBuilderWrapper.tsx — Task 5.1 — Agent_Interactive_Advanced
 *
 * Progressive enhancement wrapper for the Persistence Diagram Builder.
 *
 * Strategy (DECISION 4 from PersistenceDiagramBuilder3D.tsx):
 *   - During SSR / initial render: render SVG fallback (PersistenceDiagramBuilder)
 *     to ensure the page is always functional without JS.
 *   - After client-side hydration (useEffect):
 *     (a) Test WebGL2 support by attempting to obtain a webgl2 context.
 *     (b) Check useReducedMotion() preference.
 *     If both pass → swap to PersistenceDiagramBuilder3D.
 *     If either fails → keep SVG fallback.
 *
 * This is the component referenced in page routes and ModuleLayout.
 * Do NOT import PersistenceDiagramBuilder3D or PersistenceDiagramBuilder
 * directly in pages — import this wrapper instead.
 */

import { useState, useEffect } from 'react';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';
import { PersistenceDiagramBuilder } from './PersistenceDiagramBuilder';
import { PersistenceDiagramBuilder3D } from './PersistenceDiagramBuilder3D';

/** Check if the browser supports WebGL2. Creates and immediately discards a test canvas. */
function supportsWebGL2(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof WebGL2RenderingContext === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2');
    return ctx !== null;
  } catch {
    return false;
  }
}

export interface PersistenceDiagramBuilderWrapperProps {
  /** Optional CSS class forwarded to the active component. */
  className?: string;
}

/**
 * Renders the 3D Persistence Diagram Builder (Three.js/R3F) when the browser
 * supports WebGL2 and the user has not requested reduced motion. Falls back
 * to the original 2D SVG version otherwise.
 */
export function PersistenceDiagramBuilderWrapper({
  className,
}: PersistenceDiagramBuilderWrapperProps) {
  // Default to SVG during SSR and before hydration.
  const [use3D, setUse3D] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Only upgrade to 3D if WebGL2 is available and motion is not reduced.
    if (!reducedMotion && supportsWebGL2()) {
      setUse3D(true);
    } else {
      setUse3D(false);
    }
  }, [reducedMotion]);

  if (use3D) {
    return <PersistenceDiagramBuilder3D className={className} />;
  }

  return <PersistenceDiagramBuilder className={className} />;
}
