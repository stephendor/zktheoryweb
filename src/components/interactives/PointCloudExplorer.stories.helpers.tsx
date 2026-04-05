/**
 * PointCloudExplorer.stories.helpers.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Helper wrappers for PointCloudExplorer Storybook stories.
 * Lives in a non-story file so es-module-lexer (Storybook 10 / rolldown)
 * does not process complex JSX. See BenefitTaperCalculator.stories.helpers.tsx.
 */

import { PointCloudExplorer } from './PointCloudExplorer';

export function DefaultExplorer() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <PointCloudExplorer />
    </div>
  );
}

export function TwoClustersExplorer() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <PointCloudExplorer />
    </div>
  );
}

export function RingExplorer() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <PointCloudExplorer />
    </div>
  );
}

export function NarrowViewport() {
  return (
    <div style={{ width: 360, padding: '1rem', boxSizing: 'border-box' }}>
      <PointCloudExplorer />
    </div>
  );
}
