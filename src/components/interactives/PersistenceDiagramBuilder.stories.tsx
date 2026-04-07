/**
 * PersistenceDiagramBuilder.stories.tsx — Task 3.7b — Agent_Interactive_Core
 *
 * Storybook stories for the Persistence Diagram Builder interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * PersistenceDiagramBuilder.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see ResponsiveContainer.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { PersistenceDiagramBuilder } from './PersistenceDiagramBuilder';
import {
  DefaultBuilder,
  NarrowViewport,
  PausedBuilder,
} from './PersistenceDiagramBuilder.stories.helpers';

const meta: Meta<typeof PersistenceDiagramBuilder> = {
  title: 'Interactives/PersistenceDiagramBuilder',
  component: PersistenceDiagramBuilder,
  parameters: {
    docs: {
      description: {
        component:
          'Dual-panel Vietoris-Rips filtration explorer. Left panel: editable ' +
          'point cloud with simplicial complex overlay. Right panel: birth-death ' +
          'persistence diagram updating in real time. Filtration slider, play/pause ' +
          'animation, step-through mode, and cross-panel highlighting. ' +
          'Educational notes for key topological presets.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Default — empty canvas ---

export const Default = {
  name: '(a) Default — empty canvas',
  render: () => React.createElement(DefaultBuilder, null),
};

// --- (b) Narrow viewport — responsive layout at 400 px ---

export const Narrow = {
  name: '(b) Narrow viewport — 400 px',
  render: () => React.createElement(NarrowViewport, null),
};

// --- (c) Paused initial state (reduced-motion simulation) ---

export const Paused = {
  name: '(c) Paused — reduced-motion auto-pause',
  render: () => React.createElement(PausedBuilder, null),
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
