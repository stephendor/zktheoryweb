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

/**
 * Housing element story — renders the default interactive state.
 * Toggle the "Has housing element" checkbox inside the calculator to apply
 * the lower £404 work allowance; no prop controls that initial state.
 */
export function WithHousingElement() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <BenefitTaperCalculator />
    </div>
  );
}

/**
 * Comparison mode story — renders the default interactive state.
 * Toggle the "Show comparison" control inside the calculator to enable the
 * overlay; comparison mode is interaction-only and has no initialising prop.
 */
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
