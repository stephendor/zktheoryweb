/**
 * MapperParameterLab.stories.helpers.tsx — Task 5.2 — Agent_Interactive_Advanced
 *
 * Helper components for MapperParameterLab.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with nested interactives,
 * render-prop patterns, and expression children is safe here.
 *
 * See PersistenceDiagramBuilder.stories.helpers.tsx for the established pattern.
 */

import { MapperParameterLab } from './MapperParameterLab';

/** Full Mapper Parameter Lab at a realistic page width. */
export function DefaultStory() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <MapperParameterLab />
    </div>
  );
}

/**
 * Two-blobs preset wrapper.
 * The preset cannot be forced via props alone since selection is internal state;
 * this wrapper provides the correct viewport context for reviewers to set it manually.
 */
export function TwoBlobsPreset() {
  return (
    <div style={{ width: '100%', maxWidth: 960, padding: '1rem' }}>
      <p style={{ fontFamily: 'system-ui', fontSize: 13, marginBottom: '0.5rem', color: '#555' }}>
        Select <strong>Two Blobs</strong> preset and <strong>Eccentricity</strong> filter to see two disconnected components.
      </p>
      <MapperParameterLab />
    </div>
  );
}

/** Mapper Parameter Lab in a narrow-viewport wrapper to exercise responsive layout. */
export function NarrowViewport() {
  return (
    <div style={{ width: 360, padding: '1rem', boxSizing: 'border-box' }}>
      <MapperParameterLab />
    </div>
  );
}
