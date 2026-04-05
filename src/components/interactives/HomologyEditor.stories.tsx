/**
 * HomologyEditor.stories.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Storybook stories for the Simplex / Homology Editor.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Complex JSX lives in HomologyEditor.stories.helpers.tsx.
 * Pattern established in Task 3.1.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { HomologyEditor } from './HomologyEditor';
import {
  DefaultEditor,
  TorusSkeletonEditor,
  MobiusEditor,
  NarrowViewport,
} from './HomologyEditor.stories.helpers';

const meta: Meta<typeof HomologyEditor> = {
  title: 'Interactives/HomologyEditor',
  component: HomologyEditor,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive Simplex / Homology Editor. Click edges and triangles to ' +
          'add or remove them from the simplicial complex. β₀ (components) and ' +
          'β₁ (loops) update in real time using GF(2) Gaussian elimination. ' +
          'Three presets: Triangle, Torus skeleton, Möbius strip.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — Triangle preset, 1 loop ---

export const Default = {
  name: '(a) Triangle — β₁=1 open loop',
  render: () => React.createElement(DefaultEditor, null),
};

// --- (b) Torus skeleton — 2 independent loops ---

export const TorusSkeleton = {
  name: '(b) Torus skeleton — β₁=2',
  render: () => React.createElement(TorusSkeletonEditor, null),
};

// --- (c) Möbius strip (flat) ---

export const MobiusStrip = {
  name: '(c) Möbius strip (flat representation)',
  render: () => React.createElement(MobiusEditor, null),
};

// --- (d) Narrow viewport ---

export const NarrowViewportStory = {
  name: '(d) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewport, null),
};
