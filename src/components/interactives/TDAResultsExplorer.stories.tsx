/**
 * TDAResultsExplorer.stories.tsx — Task 5.5b — Agent_Interactive_Advanced
 *
 * Storybook stories for the TDA Results Explorer interactive.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX lives in
 * TDAResultsExplorer.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * Pattern established in Task 3.1 — see PersistenceDiagramBuilder.stories.tsx,
 * MapperParameterLab.stories.tsx, FiltrationPlayground.stories.tsx.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { TDAResultsExplorer } from './TDAResultsExplorer';
import {
  CirclePresetStory,
  TwoClustersPresetStory,
  FigureEightPresetStory,
  NarrowViewportStory,
} from './TDAResultsExplorer.stories.helpers';

const meta: Meta<typeof TDAResultsExplorer> = {
  title: 'Interactives/TDAResultsExplorer',
  component: TDAResultsExplorer,
  parameters: {
    docs: {
      description: {
        component:
          'Pre-computed TDA Results Explorer. Displays a dual-panel view of ' +
          'Vietoris-Rips persistence diagrams for four canonical point clouds. ' +
          'Left panel: point cloud with edges and filled triangles at the current ' +
          'filtration radius. Right panel: birth-death scatter with alive/dead/unborn ' +
          'highlighting. Controls: radius slider, reset button, preset selector.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

// --- (a) Circle preset (20 points) ---

export const CirclePreset = {
  name: '(a) Circle preset — 20 pts',
  render: () => React.createElement(CirclePresetStory, null),
};

// --- (b) Two clusters preset (16 points) ---

export const TwoClustersPreset = {
  name: '(b) Two Clusters preset — 16 pts',
  render: () => React.createElement(TwoClustersPresetStory, null),
};

// --- (c) Figure-eight preset (11 points) ---

export const FigureEightPreset = {
  name: '(c) Figure-Eight preset — 11 pts',
  render: () => React.createElement(FigureEightPresetStory, null),
};

// --- (d) Narrow viewport — responsive layout at 360 px ---

export const NarrowViewport = {
  name: '(d) Narrow viewport — 360 px',
  render: () => React.createElement(NarrowViewportStory, null),
};
