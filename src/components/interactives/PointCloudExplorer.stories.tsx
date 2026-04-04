/**
 * PointCloudExplorer.stories.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Storybook stories for the Point Cloud & Distance Explorer.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * PointCloudExplorer.stories.helpers.tsx.
 *
 * Pattern established in Task 3.1 — see ResponsiveContainer.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { PointCloudExplorer } from './PointCloudExplorer';
import {
  DefaultExplorer,
  TwoClustersExplorer,
  RingExplorer,
  NarrowViewport,
} from './PointCloudExplorer.stories.helpers';

const meta: Meta<typeof PointCloudExplorer> = {
  title: 'Interactives/PointCloudExplorer',
  component: PointCloudExplorer,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive Point Cloud & Distance Explorer. Click any point to select it ' +
          'as the ε-ball centre. The ball shape changes with the metric: Euclidean ' +
          '(circle) vs Manhattan (diamond). Expand the distance matrix panel to see ' +
          'all pairwise distances.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — Scattered preset, Euclidean metric ---

export const Default = {
  name: '(a) Default — Scattered, Euclidean',
  render: () => React.createElement(DefaultExplorer, null),
};

// --- (b) Two clusters preset ---

export const TwoClusters = {
  name: '(b) Two clusters preset',
  render: () => React.createElement(TwoClustersExplorer, null),
};

// --- (c) Ring preset ---

export const Ring = {
  name: '(c) Ring preset',
  render: () => React.createElement(RingExplorer, null),
};

// --- (d) Narrow viewport ---

export const NarrowViewportStory = {
  name: '(d) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewport, null),
};
