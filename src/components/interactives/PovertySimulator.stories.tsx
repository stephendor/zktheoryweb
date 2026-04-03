/**
 * PovertySimulator.stories.tsx — Task 3.3 — Agent_Interactive_Core
 *
 * Storybook stories for the Poverty Threshold Simulator interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * PovertySimulator.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see ResponsiveContainer.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { PovertySimulator } from './PovertySimulator';
import {
  DefaultSimulator,
  NarrowViewport,
} from './PovertySimulator.stories.helpers';

const meta: Meta<typeof PovertySimulator> = {
  title: 'Interactives/PovertySimulator',
  component: PovertySimulator,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive poverty threshold simulator demonstrating that poverty ' +
          'thresholds are political choices. Three measurement traditions ' +
          '(Rowntree/JRF absolute, Townsend/EU relative 60%, DWP HBAI BHC) ' +
          'are compared for any user-defined household composition.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — 2 adults, 0 children, rest-of-england ---

export const Default = {
  name: '(a) Default — 2 adults, rest of England',
  render: () => React.createElement(DefaultSimulator, null),
};

// --- (b) Narrow viewport — tests responsive layout at 360 px ---

export const Narrow = {
  name: '(b) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewport, null),
};
