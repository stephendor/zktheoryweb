/**
 * TransitionsTimeline.stories.tsx — Task 3.6b — Agent_Interactive_Core
 *
 * Storybook stories for the Five Transitions Timeline.
 *
 * NOTE — React.createElement is used throughout render functions instead of JSX.
 * Storybook 10 + Vite 8/rolldown passes raw TSX source to inject-export-order-plugin
 * (es-module-lexer) before the JSX transform runs. es-module-lexer fails on
 * JSX with depth > 2, self-closing children, or expression/text children.
 * React.createElement sidesteps this entirely. Complex JSX is in
 * TransitionsTimeline.stories.helpers.tsx (not matched by the *.stories.* pattern).
 *
 * See src/lib/viz/ResponsiveContainer.stories.tsx for the established pattern.
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import TransitionsTimeline from './TransitionsTimeline';
import type { TransitionsTimelineProps } from './TransitionsTimeline';
import {
  TimelineDemo,
  TimelineAnnotationOpen,
  TimelineMobileViewport,
  TimelineTextDescription,
  MOCK_TIMELINE_DATA,
} from './TransitionsTimeline.stories.helpers';

const meta: Meta<typeof TransitionsTimeline> = {
  title:     'Counting Lives/TransitionsTimeline',
  component: TransitionsTimeline,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Five Transitions Timeline — horizontal SVG showing overlapping eras ' +
          'in poverty measurement (1830–present), with coloured thread strands ' +
          'for the Scottish and Gender threads beneath the bands. ' +
          'Includes hover/focus annotation panel, keyboard navigation, ' +
          'ARIA live region, text-description toggle, and a vertical mobile layout.',
      },
    },
  },
};

export default meta;

// ─── (a) Full timeline with mock data ─────────────────────────────────────────

export const FullTimeline = {
  name: '(a) Full timeline — five transitions + thread strands',
  render: () => React.createElement(TimelineDemo, null),
};

// ─── (b) Component with explicit props (controls-enabled) ─────────────────────

export const WithControls = {
  name: '(b) With Storybook controls',
  args: { data: MOCK_TIMELINE_DATA } satisfies Partial<TransitionsTimelineProps>,
  render: (args: TransitionsTimelineProps) =>
    React.createElement(
      'div',
      { style: { width: '100%', padding: '1rem' } },
      React.createElement(TransitionsTimeline, args),
    ),
};

// ─── (c) Annotation panel open on Transition 2 ────────────────────────────────

export const AnnotationOpen = {
  name: '(c) Annotation panel — open on T2',
  render: () => React.createElement(TimelineAnnotationOpen, null),
};

// ─── (d) Mobile vertical layout (375 px viewport) ─────────────────────────────

export const MobileLayout = {
  name: '(d) Mobile vertical layout — 375 px viewport',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    chromatic: { viewports: [375] },
  },
  render: () => React.createElement(TimelineMobileViewport, null),
};

// ─── (e) Text-description fallback (accessibility) ────────────────────────────

export const TextDescriptionFallback = {
  name: '(e) Text description fallback',
  render: () => React.createElement(TimelineTextDescription, null),
};
