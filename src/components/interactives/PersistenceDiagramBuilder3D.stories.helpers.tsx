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
