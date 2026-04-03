/**
 * PovertySimulator.stories.helpers.tsx — Task 3.3 — Agent_Interactive_Core
 *
 * Helper components for PovertySimulator.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with nested interactives,
 * conditional rendering, and render-prop patterns is safe here.
 *
 * See ResponsiveContainer.stories.helpers.tsx for the established pattern.
 */

import { PovertySimulator } from './PovertySimulator';

/** Full simulator rendered at a realistic page width. */
export function DefaultSimulator() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <PovertySimulator />
    </div>
  );
}

/** Simulator in a narrow-viewport wrapper to exercise responsive layout. */
export function NarrowViewport() {
  return (
    <div style={{ width: 360, padding: '1rem', boxSizing: 'border-box' }}>
      <PovertySimulator />
    </div>
  );
}
