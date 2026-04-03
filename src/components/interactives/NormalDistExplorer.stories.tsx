/**
 * NormalDistExplorer.stories.tsx — Task 3.2 — Agent_Interactive_Core
 *
 * Storybook stories for the Normal Distribution Explorer interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * NormalDistExplorer.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see ResponsiveContainer.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { NormalDistExplorer } from './NormalDistExplorer';
import type { NormalDistExplorerProps } from './NormalDistExplorer';
import {
  DefaultExplorer,
  ShiftedMean,
  WideSigma,
  NarrowSigma,
} from './NormalDistExplorer.stories.helpers';

const meta: Meta<typeof NormalDistExplorer> = {
  title: 'Interactives/NormalDistExplorer',
  component: NormalDistExplorer,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive normal distribution explorer. Drag the handles to adjust ' +
          'μ (mean) and σ (standard deviation) in real time. Toggle historical ' +
          'overlays to explore how the Gaussian curve has been applied — and ' +
          'misapplied — throughout the history of statistics and welfare policy.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — μ=0, σ=1 ---

export const Default = {
  name: '(a) Default — μ=0, σ=1',
  args: { initialMu: 0, initialSigma: 1 } satisfies Partial<NormalDistExplorerProps>,
  render: () => React.createElement(DefaultExplorer, null),
};

// --- (b) Shifted mean — μ=1, σ=1 ---

export const ShiftedMeanStory = {
  name: '(b) Shifted mean — μ=1, σ=1',
  args: { initialMu: 1, initialSigma: 1 } satisfies Partial<NormalDistExplorerProps>,
  render: () => React.createElement(ShiftedMean, null),
};

// --- (c) Wide distribution — μ=0, σ=2 ---

export const WideSigmaStory = {
  name: '(c) Wide distribution — μ=0, σ=2',
  args: { initialMu: 0, initialSigma: 2 } satisfies Partial<NormalDistExplorerProps>,
  render: () => React.createElement(WideSigma, null),
};

// --- (d) Narrow distribution — μ=0, σ=0.3 ---

export const NarrowSigmaStory = {
  name: '(d) Narrow distribution — μ=0, σ=0.3',
  args: { initialMu: 0, initialSigma: 0.3 } satisfies Partial<NormalDistExplorerProps>,
  render: () => React.createElement(NarrowSigma, null),
};
