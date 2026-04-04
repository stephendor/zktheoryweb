/**
 * HomologyEditor.stories.helpers.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Helper wrappers for HomologyEditor Storybook stories.
 * Lives in a non-story file so es-module-lexer (Storybook 10 / rolldown)
 * does not process complex JSX.
 */

import { HomologyEditor } from './HomologyEditor';

export function DefaultEditor() {
  return (
    <div style={{ width: '100%', maxWidth: 720, padding: '1rem' }}>
      <HomologyEditor />
    </div>
  );
}

export function TorusSkeletonEditor() {
  return (
    <div style={{ width: '100%', maxWidth: 720, padding: '1rem' }}>
      <HomologyEditor />
    </div>
  );
}

export function MobiusEditor() {
  return (
    <div style={{ width: '100%', maxWidth: 720, padding: '1rem' }}>
      <HomologyEditor />
    </div>
  );
}

export function NarrowViewport() {
  return (
    <div style={{ width: 360, padding: '1rem', boxSizing: 'border-box' }}>
      <HomologyEditor />
    </div>
  );
}
