/**
 * MapperParameterLab.stories.tsx — Task 5.2 — Agent_Interactive_Advanced
 *
 * Storybook stories for the Mapper Parameter Lab interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * MapperParameterLab.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see PersistenceDiagramBuilder.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { MapperParameterLab } from './MapperParameterLab';
import {
  DefaultStory,
  TwoBlobsPreset,
  NarrowViewport,
} from './MapperParameterLab.stories.helpers';

const meta: Meta<typeof MapperParameterLab> = {
  title: 'Interactives/MapperParameterLab',
  component: MapperParameterLab,
  parameters: {
    docs: {
      description: {
        component:
          'Mapper algorithm parameter lab. Left panel shows the point cloud coloured ' +
          'by the active filter function. Right panel shows the resulting Mapper ' +
          'force-directed graph in real time. Controls: preset point cloud, filter ' +
          'function (PCA / Density / Eccentricity), cover resolution, interval overlap, ' +
          'and cluster threshold.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — circle preset ---

export const Default = {
  name: '(a) Default — circle preset',
  render: () => React.createElement(DefaultStory, null),
};

// --- (b) Two blobs preset ---

export const TwoBlobs = {
  name: '(b) Two blobs preset',
  render: () => React.createElement(TwoBlobsPreset, null),
};

// --- (c) Narrow viewport — responsive layout at 360 px ---

export const Narrow = {
  name: '(c) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewport, null),
};
