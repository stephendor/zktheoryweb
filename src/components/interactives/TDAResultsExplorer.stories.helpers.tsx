/**
 * TDAResultsExplorer.stories.helpers.tsx — Task 5.5b — Agent_Interactive_Advanced
 *
 * Helper components for TDAResultsExplorer.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with expression children
 * and nested interactive components is safe here.
 *
 * See FiltrationPlayground.stories.helpers.tsx / MapperParameterLab.stories.helpers.tsx
 * for the established pattern.
 */

import { TDAResultsExplorer } from './TDAResultsExplorer';

const WRAPPER_STYLE: React.CSSProperties = {
  width: '100%',
  maxWidth: 960,
  padding: '1rem',
};

const HINT_STYLE: React.CSSProperties = {
  fontFamily: 'system-ui',
  fontSize: 13,
  marginBottom: '0.75rem',
  color: '#555',
};

/** (a) Circle preset at a realistic page width. */
export function CirclePresetStory() {
  return (
    <div style={WRAPPER_STYLE}>
      <p style={HINT_STYLE}>
        <strong>Circle (20 pts).</strong> Sweep the radius slider to watch 20 points on the
        unit circle connect into a single loop. The persistence diagram should show one
        long-lived H₁ feature (teal dot far above the diagonal) — the hallmark of a circle.
      </p>
      <TDAResultsExplorer presetId="circle-20pts" />
    </div>
  );
}

/** (b) Two Clusters preset. */
export function TwoClustersPresetStory() {
  return (
    <div style={WRAPPER_STYLE}>
      <p style={HINT_STYLE}>
        <strong>Two Clusters (16 pts).</strong> Two Gaussian clusters separated on the x-axis.
        Watch the long-lived H₀ bar in the diagram — it records the large inter-cluster gap.
        Both clusters merge at the radius matching their centre distance.
      </p>
      <TDAResultsExplorer presetId="two-clusters-16pts" />
    </div>
  );
}

/** (c) Figure-Eight preset — should show 2 persistent H₁ loops. */
export function FigureEightPresetStory() {
  return (
    <div style={WRAPPER_STYLE}>
      <p style={HINT_STYLE}>
        <strong>Figure-Eight (11 pts).</strong> Two tangent circles. The persistence diagram
        should show <em>two</em> teal H₁ dots above the diagonal — one per lobe. Click either
        H₁ point in the diagram to highlight the generating edges in the left panel.
      </p>
      <TDAResultsExplorer presetId="figure-eight-11pts" />
    </div>
  );
}

/** (d) Narrow viewport — responsive stacked layout at 360 px. */
export function NarrowViewportStory() {
  return (
    <div style={{ width: 360, padding: '0.75rem', border: '1px dashed #ccc' }}>
      <p style={HINT_STYLE}>
        <strong>360 px viewport.</strong> Panels should stack vertically; controls should
        remain accessible and the slider should be usable at narrow width.
      </p>
      <TDAResultsExplorer presetId="circle-20pts" />
    </div>
  );
}
