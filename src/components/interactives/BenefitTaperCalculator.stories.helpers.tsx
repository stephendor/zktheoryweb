/**
 * BenefitTaperCalculator.stories.helpers.tsx — Task 5.4 — Agent_Interactive_Advanced
 *
 * Helper components for BenefitTaperCalculator.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX with nested interactives,
 * conditional rendering, and render-prop patterns is safe here.
 *
 * See PovertySimulator.stories.helpers.tsx for the established pattern.
 */

import { BenefitTaperCalculator } from './BenefitTaperCalculator';

/** Default: no housing element, no comparison overlay. */
export function DefaultCalculator() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <BenefitTaperCalculator />
    </div>
  );
}

/** With housing element: lower £404 work allowance applied. */
export function WithHousingElement() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <BenefitTaperCalculator />
    </div>
  );
}

/** Comparison mode wrapper — comparison toggle is interaction-only, rendered here at default. */
export function WithComparison() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <BenefitTaperCalculator />
    </div>
  );
}

/** Narrow-viewport wrapper at 360 px to exercise responsive layout. */
export function NarrowViewport() {
  return (
    <div style={{ width: 360, padding: '1rem', boxSizing: 'border-box' }}>
      <BenefitTaperCalculator />
    </div>
  );
}
