/**
 * PersistenceDiagramBuilder3D.stories.tsx — Task 5.1 — Agent_Interactive_Advanced
 *
 * Storybook stories for the 3D Persistence Diagram Builder interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * PersistenceDiagramBuilder3D.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see ResponsiveContainer.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { PersistenceDiagramBuilder3D } from './PersistenceDiagramBuilder3D';
import {
  DefaultBuilder3D,
  NarrowViewport3D,
  WrapperDefault,
} from './PersistenceDiagramBuilder3D.stories.helpers';

const meta: Meta<typeof PersistenceDiagramBuilder3D> = {
  title: 'Interactives/PersistenceDiagramBuilder3D',
  component: PersistenceDiagramBuilder3D,
  parameters: {
    docs: {
      description: {
        component:
          'Three.js/React Three Fiber 3D upgrade of the Persistence Diagram Builder. ' +
          'Left panel: R3F Canvas with OrbitControls for 3D point cloud placement and ' +
          'simplicial complex overlay. Right panel: unchanged 2D D3 SVG persistence diagram. ' +
          'Math computation is identical (z-stripped 2D projection). ' +
          'Fallback: SVG version shown when WebGL2 unavailable or reduced-motion active.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — empty 3D canvas ---

export const Default = {
  name: '(a) Default — empty 3D canvas',
  render: () => React.createElement(DefaultBuilder3D, null),
};

// --- (b) With Circle preset (8 pts, z=0) ---

export const WithCircle = {
  name: '(b) With Circle preset — 8 pts, z=0',
  render: () => React.createElement(DefaultBuilder3D, null),
  parameters: {
    docs: {
      description: {
        story:
          'Load the Circle (8 pts) preset to verify a persistent H₁ loop appears ' +
          'in the persistence diagram as the filtration radius grows.',
      },
    },
  },
};

// --- (c) With Two Clusters preset (8 pts) ---

export const WithTwoClusters = {
  name: '(c) With Two Clusters preset — H₀ signature',
  render: () => React.createElement(DefaultBuilder3D, null),
  parameters: {
    docs: {
      description: {
        story:
          'Two Clusters (8 pts): two long-lived H₀ bars are the signature feature. ' +
          'The H₁ loop reflects 4-pt square geometry, not clustering structure. ' +
          'Annotation in diagram must describe H₀ bars, not the H₁ loop.',
      },
    },
  },
};

// --- (d) Narrow viewport — responsive layout at 400 px ---

export const NarrowViewport = {
  name: '(d) Narrow viewport — 400 px',
  render: () => React.createElement(NarrowViewport3D, null),
};

// --- (e) Wrapper (progressive enhancement) ---

export const Wrapper = {
  name: '(e) Wrapper — auto WebGL2 detection',
  render: () => React.createElement(WrapperDefault, null),
  parameters: {
    docs: {
      description: {
        story:
          'PersistenceDiagramBuilderWrapper: renders the 3D version when WebGL2 is ' +
          'supported and reduced-motion is not requested; falls back to the SVG version otherwise.',
      },
    },
  },
};
