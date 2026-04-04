/**
 * BarcodeComparator.stories.tsx — Task 6.1b — Agent_Interactive_Advanced
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { BarcodeComparator } from './BarcodeComparator';
import {
  DefaultComparator,
  NarrowViewport,
} from './BarcodeComparator.stories.helpers';

const meta: Meta<typeof BarcodeComparator> = {
  title: 'Interactives/BarcodeComparator',
  component: BarcodeComparator,
  parameters: {
    docs: {
      description: {
        component:
          'Compares the persistence barcodes produced when the same 30 households ' +
          'are described using official DWP deprivation indices vs community-defined ' +
          'dimensions (safety, trust, green space). The divergence between the two ' +
          'barcodes — quantified by the H₀ and H₁ bottleneck distances — is the ' +
          'mathematical signature of the difference between being measured and being heard.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

export const Default = {
  name: '(a) Default — H₀ barcodes',
  render: () => React.createElement(DefaultComparator, null),
};

export const NarrowViewportStory = {
  name: '(b) Narrow viewport — 400 px',
  render: () => React.createElement(NarrowViewport, null),
};
