/**
 * ShapInstabilityDemo.stories.tsx — Task 6.1b — Agent_Interactive_Advanced
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { ShapInstabilityDemo } from './ShapInstabilityDemo';
import { DefaultDemo, NarrowViewport } from './ShapInstabilityDemo.stories.helpers';

const meta: Meta<typeof ShapInstabilityDemo> = {
  title: 'Interactives/ShapInstabilityDemo',
  component: ShapInstabilityDemo,
  parameters: {
    docs: {
      description: {
        component:
          'Perturb a near-threshold welfare claimant\'s feature values and ' +
          'watch SHAP attributions shift dramatically while the predicted score ' +
          'stays approximately constant. SHAP values are computed exactly via ' +
          'subset enumeration (2^4 = 16 subsets) using a small fixed-weight ' +
          'neural network.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

export const Default = {
  name: '(a) Default — baseline claimant near threshold',
  render: () => React.createElement(DefaultDemo, null),
};

export const NarrowViewportStory = {
  name: '(b) Narrow viewport — 400 px',
  render: () => React.createElement(NarrowViewport, null),
};
