/**
 * DecisionThresholdExplorer.stories.tsx — Task 6.1b — Agent_Interactive_Advanced
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { DecisionThresholdExplorer } from './DecisionThresholdExplorer';
import { DefaultExplorer, NarrowViewport } from './DecisionThresholdExplorer.stories.helpers';

const meta: Meta<typeof DecisionThresholdExplorer> = {
  title: 'Interactives/DecisionThresholdExplorer',
  component: DecisionThresholdExplorer,
  parameters: {
    docs: {
      description: {
        component:
          'Adjust the logistic regression decision threshold τ and observe ' +
          'how TPR, FPR, precision and F1 respond. Sub-group comparison panels ' +
          'show how the same τ produces different error rates for Group A and Group B ' +
          '— demonstrating label bias in welfare prediction systems.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

export const Default = {
  name: '(a) Default — τ = 0.50',
  render: () => React.createElement(DefaultExplorer, null),
};

export const NarrowViewportStory = {
  name: '(b) Narrow viewport — 400 px',
  render: () => React.createElement(NarrowViewport, null),
};
