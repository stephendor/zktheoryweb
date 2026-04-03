/**
 * PointCloudEditor.stories.tsx — Task 3.7a — Agent_Interactive_Core
 *
 * Storybook stories for the PointCloudEditor component.
 *
 * NOTE: React.createElement is used throughout render functions.
 * Storybook 10 + Vite 8/rolldown passes *.stories.* files through
 * es-module-lexer (inject-export-order-plugin) BEFORE the JSX transform runs.
 * es-module-lexer fails on JSX depth > 2, self-closing children, or
 * expression/text children. React.createElement sidesteps this entirely.
 * Complex JSX lives in PointCloudEditor.stories.helpers.tsx instead.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { PointCloudEditor } from './PointCloudEditor';
import {
  PointCloudEditorDemo,
  CirclePresetDemo,
  TwoClustersPresetDemo,
  Figure8PresetDemo,
  RandomPresetDemo,
} from './PointCloudEditor.stories.helpers';

const meta: Meta<typeof PointCloudEditor> = {
  title: 'Interactives/PointCloudEditor',
  component: PointCloudEditor,
  parameters: {
    docs: {
      description: {
        component:
          'Interactive point cloud editor for the Persistence Diagram Builder (Task 3.7). ' +
          'Click to add points (max 30), drag to reposition, double-click to remove. ' +
          'Load presets or build a custom configuration. ' +
          'Exports the current Point2D[] via onPointsChange for Task 3.7b.',
      },
    },
  },
};

export default meta;

// --- (a) Default interactive — empty canvas, add/drag/remove demo ---

export const Default = {
  name: '(a) Default — interactive canvas',
  render: () => React.createElement(PointCloudEditorDemo, null),
};

// --- (b) Circle preset (8 pts) — expected: 1 H₁ loop ---

export const CirclePreset = {
  name: '(b) Preset — Circle (8 pts)',
  render: () => React.createElement(CirclePresetDemo, null),
};

// --- (c) Two clusters preset (8 pts) — expected: 2 H₀ components ---

export const TwoClustersPreset = {
  name: '(c) Preset — Two Clusters (8 pts)',
  render: () => React.createElement(TwoClustersPresetDemo, null),
};

// --- (d) Figure-8 preset (11 pts) — expected: 2 H₁ loops ---

export const Figure8Preset = {
  name: '(d) Preset — Figure-8 (11 pts)',
  render: () => React.createElement(Figure8PresetDemo, null),
};

// --- (e) Random preset (15 pts) ---

export const RandomPreset = {
  name: '(e) Preset — Random (15 pts)',
  render: () => React.createElement(RandomPresetDemo, null),
};

// --- (f) Max capacity — 30 points pre-loaded ---

export const AtCapacity = {
  name: '(f) At capacity — 30 pts (add blocked, counter highlighted)',
  render: () =>
    React.createElement(PointCloudEditorDemo, {
      initialPoints: Array.from({ length: 30 }, (_, i) => ({
        x: 0.05 + (i % 6) * 0.18,
        y: 0.1 + Math.floor(i / 6) * 0.18,
        id: `cap-${i}`,
      })),
    }),
};
