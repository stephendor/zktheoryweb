/**
 * EquivalisationComparator.stories.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Storybook stories for the Equivalisation Comparator.
 * React.createElement used throughout — see HomologyEditor.stories.tsx for rationale.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { EquivalisationComparator } from './EquivalisationComparator';
import { DefaultComparator, NarrowViewport } from './EquivalisationComparator.stories.helpers';

const meta: Meta<typeof EquivalisationComparator> = {
  title: 'Interactives/EquivalisationComparator',
  component: EquivalisationComparator,
  parameters: {
    docs: {
      description: {
        component:
          'Applies three UK equivalisation scales (Original OECD, Modified OECD, ' +
          'McClements) to the same stylised household income distribution. ' +
          'The poverty rate changes purely from the formula choice. ' +
          'Adjust the threshold slider to see how each scale responds.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

export const Default = {
  name: '(a) Default — 60% of median',
  render: () => React.createElement(DefaultComparator, null),
};

export const NarrowViewportStory = {
  name: '(b) Narrow viewport — 400 px',
  render: () => React.createElement(NarrowViewport, null),
};
