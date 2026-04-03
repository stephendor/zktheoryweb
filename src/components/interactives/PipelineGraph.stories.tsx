/**
 * PipelineGraph.stories.tsx — Task 3.4 — Agent_Interactive_Core
 *
 * Storybook stories for the TDA Research Pipeline Graph.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX is in
 * PipelineGraph.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * See: src/lib/viz/ResponsiveContainer.stories.tsx for the established pattern.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import PipelineGraph from './PipelineGraph';
import type { PipelineGraphProps } from './PipelineGraph';
import {
  PipelineGraphDemo,
  PipelineGraphPublished,
  MOCK_GRAPH_DATA,
} from './PipelineGraph.stories.helpers';

const meta: Meta<typeof PipelineGraph> = {
  title: 'Interactives/PipelineGraph',
  component: PipelineGraph,
  parameters: {
    docs: {
      description: {
        component:
          'D3 force-directed graph of the TDA research pipeline. ' +
          '10 nodes across 4 research stages, directed edges show paper dependencies. ' +
          'Keyboard-navigable; reduced-motion respects OS preference; ' +
          'mobile viewport falls back to a static ordered list.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// ── (a) Default four-paper demo ──────────────────────────────────────────────

export const Default = {
  name: '(a) Default — four-paper mock',
  render: (_args: PipelineGraphProps) =>
    React.createElement(PipelineGraphDemo, null),
};

// ── (b) Published / status variety ───────────────────────────────────────────

export const StatusVariety = {
  name: '(b) Status variety — published / in-review / submitted',
  render: (_args: PipelineGraphProps) =>
    React.createElement(PipelineGraphPublished, null),
};

// ── (c) Minimal single-node (no edges) ───────────────────────────────────────

export const SingleNode = {
  name: '(c) Edge case — single isolated node',
  args: {
    data: {
      nodes: [
        {
          id: 'paper-01',
          paper_number: 1,
          title: 'The Markov Memory Ladder',
          stage: 0,
          status: 'in-progress' as const,
        },
      ],
      edges: [],
    },
  } satisfies Partial<PipelineGraphProps>,
  render: (args: PipelineGraphProps) =>
    React.createElement(
      'div',
      { style: { width: '100%', maxWidth: 700 } },
      React.createElement(PipelineGraph, args),
    ),
};

// ── (d) Full ten-paper dataset via props ─────────────────────────────────────

export const FullDataset = {
  name: '(d) Full dataset — ten papers (mock)',
  args: { data: MOCK_GRAPH_DATA } satisfies Partial<PipelineGraphProps>,
  render: (args: PipelineGraphProps) =>
    React.createElement(
      'div',
      { style: { width: '100%', maxWidth: 1100 } },
      React.createElement(PipelineGraph, args),
    ),
};
