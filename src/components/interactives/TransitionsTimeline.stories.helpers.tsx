/**
 * TransitionsTimeline.stories.helpers.tsx — Task 3.6b — Agent_Interactive_Core
 *
 * Helper components for TransitionsTimeline.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX is safe here.
 *
 * See ResponsiveContainer.stories.helpers.tsx for the established pattern.
 */

import { useState } from 'react';
import TransitionsTimeline from './TransitionsTimeline';
import type { TimelineData } from './TransitionsTimeline.data';

// ─── Mock data ────────────────────────────────────────────────────────────────

/**
 * Representative mock TimelineData using actual content-stub values.
 * Exported so story files and tests can reference the same fixture.
 */
export const MOCK_TIMELINE_DATA: TimelineData = {
  transitions: [
    {
      id: 'transition-01',
      number: 1,
      title: 'From the Body to the Budget',
      dateStart: 1830,
      dateEnd: 1905,
      chapters: [
        { number: 1, title: "The Statistician's Stomach", threads: ['scottish-thread'] },
        { number: 2, title: 'The Eugenic Ledger',         threads: ['scottish-thread', 'gender-thread'] },
      ],
      colour: '--color-cl-red',
    },
    {
      id: 'transition-02',
      number: 2,
      title: 'The Welfare State Settlement',
      dateStart: 1905,
      dateEnd: 1945,
      chapters: [
        { number: 3, title: 'The Actuarial Citizen',          threads: [] },
        { number: 4, title: 'The Grocery List as Resistance', threads: ['gender-thread'] },
      ],
      colour: '--color-cl-ochre',
    },
    {
      id: 'transition-03',
      number: 3,
      title: 'The Technocratic Turn',
      dateStart: 1945,
      dateEnd: 1975,
      chapters: [
        { number: 5, title: 'Cybernetics and Control', threads: [] },
        { number: 6, title: 'The Poverty Line Goes Global', threads: [] },
      ],
      colour: '--color-viz-3',
    },
    {
      id: 'transition-04',
      number: 4,
      title: 'The Market Consensus',
      dateStart: 1975,
      dateEnd: 2000,
      chapters: [
        { number: 7, title: 'Dependency and Desert',    threads: [] },
        { number: 8, title: 'The Targeting Revolution', threads: [] },
        { number: 9, title: 'The Multidimensional Turn', threads: [] },
      ],
      colour: '--color-viz-5',
    },
    {
      id: 'transition-05',
      number: 5,
      title: 'The Algorithmic State',
      dateStart: 2000,
      dateEnd: undefined,
      chapters: [
        { number: 10, title: 'Risk Scores and Redlining', threads: [] },
        { number: 11, title: 'Automated Austerity',       threads: [] },
      ],
      colour: '--color-viz-6',
    },
  ],
  threads: [
    {
      slug:           'scottish-thread',
      label:          'Scottish Thread',
      colour:         '--color-viz-2',
      chapterNumbers: [1, 2],
    },
    {
      slug:           'gender-thread',
      label:          'Gender Thread',
      colour:         '--color-viz-7',
      chapterNumbers: [2, 4],
    },
  ],
  yearMin: 1830,
  yearMax: 2026,
};

// ─── Demo wrapper ─────────────────────────────────────────────────────────────

/** Full-width demo wrapper rendering the timeline with mock data. */
export function TimelineDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      <TransitionsTimeline data={MOCK_TIMELINE_DATA} />
    </div>
  );
}

// ─── Annotation open story helper ─────────────────────────────────────────────

/**
 * Renders the timeline with the annotation panel forced open on Transition 2
 * (The Welfare State Settlement) — demonstrates the panel layout.
 */
export function TimelineAnnotationOpen() {
  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      <TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={1} />
    </div>
  );
}

// ─── Mobile viewport story helper ─────────────────────────────────────────────

/**
 * Renders inside a 375 px-wide frame to demonstrate the vertical mobile layout.
 * The Storybook viewport decorator sets the iframe to 375 px; this wrapper
 * constrains the component width to match.
 */
export function TimelineMobileViewport() {
  return (
    <div style={{ width: 375, padding: '0.75rem' }}>
      <TransitionsTimeline data={MOCK_TIMELINE_DATA} />
    </div>
  );
}

// ─── Text description story helper ────────────────────────────────────────────

/**
 * Renders the timeline with the text-description toggle already expanded,
 * demonstrating the accessible prose fallback.
 *
 * The toggle is a native <details> element — we auto-open it by rendering
 * inside a wrapper that clicks the summary on mount.
 */
export function TimelineTextDescription() {
  // We open the <details> programmatically after mount by toggling our own
  // state flag; the details element is controlled by its own DOM state so we
  // rely on a ref click instead of trying to force it via React.
  const [clicked, setClicked] = useState(false);

  return (
    <div
      style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '1rem' }}
      ref={(el) => {
        if (el && !clicked) {
          const summary = el.querySelector<HTMLElement>('summary.tdt-summary');
          summary?.click();
          setClicked(true);
        }
      }}
    >
      <TransitionsTimeline data={MOCK_TIMELINE_DATA} />
    </div>
  );
}
