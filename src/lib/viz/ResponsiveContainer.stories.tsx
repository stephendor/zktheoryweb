/**
 * ResponsiveContainer.stories.tsx — Task 3.1 — Agent_Interactive_Core
 *
 * Template stories demonstrating:
 *   (a) ResponsiveContainer with a placeholder SVG child
 *   (b) TextDescriptionToggle a11y component wrapping a placeholder visualisation
 *   (c) Token-derived colour scale rendered as a colour swatch strip
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX is in
 * ResponsiveContainer.stories.helpers.tsx (not matched by the *.stories.* pattern).
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { ResponsiveContainer } from './ResponsiveContainer';
import type { ResponsiveContainerProps } from './ResponsiveContainer';
import type { VizDimensions } from './types';
import {
  ResponsivePlaceholder,
  TextDescriptionDemo,
  SwatchStrip,
} from './ResponsiveContainer.stories.helpers';

const meta: Meta<typeof ResponsiveContainer> = {
  title: 'Viz/ResponsiveContainer',
  component: ResponsiveContainer,
  parameters: {
    docs: {
      description: {
        component:
          'SSR-safe render-prop container that tracks its own dimensions via ' +
          'ResizeObserver and passes { width, height } to child visualisations.',
      },
    },
  },
};

export default meta;

// --- (a) Responsive container with placeholder SVG ---

export const WithSVGPlaceholder = {
  name: '(a) Responsive container - SVG placeholder',
  args: { minHeight: 200 } satisfies Partial<ResponsiveContainerProps>,
  render: (args: ResponsiveContainerProps) =>
    React.createElement(
      'div',
      { style: { width: '100%', maxWidth: 600 } },
      React.createElement(
        ResponsiveContainer,
        args,
        ({ width, height }: VizDimensions) =>
          React.createElement(ResponsivePlaceholder, { width, height }),
      ),
    ),
};

// --- (b) A11y - TextDescriptionToggle wrapping a visualisation ---

export const WithTextDescriptionToggle = {
  name: '(b) A11y - TextDescriptionToggle wrapping a visualisation',
  render: () => React.createElement(TextDescriptionDemo, null),
};

// --- (c) Token-derived colour scale as a swatch strip ---

export const TokenColorScale = {
  name: '(c) Token-derived colour scale - swatch strip',
  render: () => React.createElement(SwatchStrip, null),
};
