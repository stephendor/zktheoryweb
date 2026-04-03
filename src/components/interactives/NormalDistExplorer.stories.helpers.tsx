/**
 * NormalDistExplorer.stories.helpers.tsx — Task 3.2 — Agent_Interactive_Core
 *
 * Helper components for NormalDistExplorer.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with nested interactives,
 * conditional rendering, and render-prop patterns is safe here.
 *
 * See ResponsiveContainer.stories.helpers.tsx for the established pattern.
 */

import { NormalDistExplorer } from './NormalDistExplorer';

/** Default interactive — μ=0, σ=1. */
export function DefaultExplorer() {
  return (
    <div style={{ width: '100%', maxWidth: 800, padding: '1rem' }}>
      <NormalDistExplorer />
    </div>
  );
}

/** Pre-shifted mean to demonstrate non-zero μ. */
export function ShiftedMean() {
  return (
    <div style={{ width: '100%', maxWidth: 800, padding: '1rem' }}>
      <NormalDistExplorer initialMu={1} initialSigma={1} />
    </div>
  );
}

/** Wide σ to demonstrate a flat, spread-out distribution. */
export function WideSigma() {
  return (
    <div style={{ width: '100%', maxWidth: 800, padding: '1rem' }}>
      <NormalDistExplorer initialMu={0} initialSigma={2} />
    </div>
  );
}

/** Narrow σ to demonstrate a tall, tight distribution. */
export function NarrowSigma() {
  return (
    <div style={{ width: '100%', maxWidth: 800, padding: '1rem' }}>
      <NormalDistExplorer initialMu={0} initialSigma={0.3} />
    </div>
  );
}
