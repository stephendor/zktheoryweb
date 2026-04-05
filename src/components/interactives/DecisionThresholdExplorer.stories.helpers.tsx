/** DecisionThresholdExplorer.stories.helpers.tsx */
import { DecisionThresholdExplorer } from './DecisionThresholdExplorer';

export function DefaultExplorer() {
  return (
    <div style={{ width: '100%', maxWidth: 900, padding: '1rem' }}>
      <DecisionThresholdExplorer />
    </div>
  );
}

export function NarrowViewport() {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <DecisionThresholdExplorer />
    </div>
  );
}
