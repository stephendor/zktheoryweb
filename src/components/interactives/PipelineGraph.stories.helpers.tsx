/**
 * PipelineGraph.stories.helpers.tsx — Task 3.4 — Agent_Interactive_Core
 *
 * Helper components for PipelineGraph.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with deep nesting
 * and conditional rendering is safe here.
 *
 * See also: src/lib/viz/ResponsiveContainer.stories.helpers.tsx for the
 * established pattern.
 */

import PipelineGraph from './PipelineGraph';
import type { PipelineGraphData } from './PipelineGraph.data';

// ─── Mock data ─────────────────────────────────────────────────────────────────

/**
 * Four-paper slice of the real pipeline: Stage 0 → Stage 1 (×2) → Stage 2.
 * Kept small for a clear, fast-loading story.
 */
export const MOCK_GRAPH_DATA: PipelineGraphData = {
  nodes: [
    {
      id: 'paper-01',
      paper_number: 1,
      title: 'The Markov Memory Ladder',
      stage: 0,
      status: 'in-progress',
      compute: { hardware: 'CPU', runtime: 'Minutes', cloud: false },
    },
    {
      id: 'paper-02',
      paper_number: 2,
      title: 'Multiplex Filtration',
      stage: 1,
      status: 'planned',
    },
    {
      id: 'paper-03',
      paper_number: 3,
      title: 'Regional Topology',
      stage: 1,
      status: 'planned',
    },
    {
      id: 'paper-04',
      paper_number: 4,
      title: 'Poverty Trap Topology',
      stage: 2,
      status: 'planned',
      compute: { hardware: 'GPU', runtime: '4h', cloud: true },
    },
  ],
  edges: [
    { source: 'paper-01', target: 'paper-02' },
    { source: 'paper-01', target: 'paper-03' },
    { source: 'paper-02', target: 'paper-04' },
    { source: 'paper-03', target: 'paper-04' },
  ],
};

/** All-published variant to show colour states in the legend. */
export const PUBLISHED_GRAPH_DATA: PipelineGraphData = {
  nodes: MOCK_GRAPH_DATA.nodes.map((n, i) => ({
    ...n,
    status: (
      ['published', 'published', 'in-review', 'submitted'] as const
    )[i]!,
  })),
  edges: MOCK_GRAPH_DATA.edges,
};

// ─── Story wrapper components ─────────────────────────────────────────────────

interface GraphDemoProps {
  data?: PipelineGraphData;
}

/** Default story: four-node mock with responsive sizing. */
export function PipelineGraphDemo({ data = MOCK_GRAPH_DATA }: GraphDemoProps) {
  return (
    <div style={{ width: '100%', maxWidth: 900, fontFamily: 'system-ui' }}>
      <PipelineGraph data={data} />
    </div>
  );
}

/** Status variety story: shows the published/review/submitted colour states. */
export function PipelineGraphPublished() {
  return (
    <div style={{ width: '100%', maxWidth: 900, fontFamily: 'system-ui' }}>
      <PipelineGraph data={PUBLISHED_GRAPH_DATA} />
    </div>
  );
}
