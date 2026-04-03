/**
 * BenefitTaperCalculator.stories.tsx — Task 5.4 — Agent_Interactive_Advanced
 *
 * Storybook stories for the Benefit Taper Calculator interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * BenefitTaperCalculator.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see ResponsiveContainer.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { BenefitTaperCalculator } from './BenefitTaperCalculator';
import {
  DefaultCalculator,
  WithHousingElement,
  WithComparison,
  NarrowViewport,
} from './BenefitTaperCalculator.stories.helpers';

const meta: Meta<typeof BenefitTaperCalculator> = {
  title: 'Interactives/BenefitTaperCalculator',
  component: BenefitTaperCalculator,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive UC Benefit Taper Calculator. Shows net income and UC ' +
          'amount against gross monthly earnings under the 2025–26 55% taper ' +
          'rate. Toggle the housing element (lower work allowance) and enable ' +
          'the pre-2021 63% comparison overlay. Spotlight any earnings level ' +
          'to see your effective marginal rate.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — no housing element, no comparison ---

export const Default = {
  name: '(a) Default — no housing element',
  render: () => React.createElement(DefaultCalculator, null),
};

// --- (b) With housing element — lower £404/mo work allowance ---

export const WithHousingElementStory = {
  name: '(b) With housing element',
  render: () => React.createElement(WithHousingElement, null),
};

// --- (c) With comparison — pre-2021 63% taper overlay ---

export const WithComparisonStory = {
  name: '(c) With comparison overlay',
  render: () => React.createElement(WithComparison, null),
};

// --- (d) Narrow viewport — tests responsive layout at 360 px ---

export const NarrowViewportStory = {
  name: '(d) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewport, null),
};
