/**
 * FiltrationPlayground.stories.tsx — Task 5.3 — Agent_Interactive_Advanced
 *
 * Storybook stories for the Filtration Playground interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * FiltrationPlayground.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see PersistenceDiagramBuilder.stories.tsx
 * and MapperParameterLab.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { FiltrationPlayground } from './FiltrationPlayground';
import {
  DefaultStory,
  WithCirclePreset,
  WithFigureEight,
  NarrowViewport,
  PausedStory,
} from './FiltrationPlayground.stories.helpers';

const meta: Meta<typeof FiltrationPlayground> = {
  title: 'Interactives/FiltrationPlayground',
  component: FiltrationPlayground,
  parameters: {
    docs: {
      description: {
        component:
          'Step-through Vietoris-Rips filtration playground. Place a point cloud on the ' +
          'left panel, then sweep the radius slider (or press Play) to watch balls grow ' +
          'around each point, edges form between close pairs, and triangles fill cliques. ' +
          'The right panel tracks β₀ (connected components) and β₁ (loops) live, with a ' +
          'scrollable event log of topological births and deaths.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — empty canvas ---

export const Default = {
  name: '(a) Default — empty canvas',
  render: () => React.createElement(DefaultStory, null),
};

// --- (b) Circle preset (8 points) ---

export const WithCircle = {
  name: '(b) Circle preset (8 pts)',
  render: () => React.createElement(WithCirclePreset, null),
};

// --- (c) Figure-eight preset (11 points) ---

export const FigureEight = {
  name: '(c) Figure-eight preset (11 pts)',
  render: () => React.createElement(WithFigureEight, null),
};

// --- (d) Narrow viewport — responsive layout at 360 px ---

export const Narrow = {
  name: '(d) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewport, null),
};

// --- (e) Paused initial state (reduced-motion simulation) ---

export const Paused = {
  name: '(e) Paused — reduced-motion auto-pause',
  render: () => React.createElement(PausedStory, null),
  parameters: {
    docs: {
      description: {
        story:
          'Simulates prefers-reduced-motion: reduce. The component auto-pauses on mount ' +
          'and shows the “Resume animation” button. The Pause/Resume toggle is always ' +
          'visible regardless of OS motion preference (WCAG 2.1 §2.2.2).',
      },
    },
  },
};
