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
