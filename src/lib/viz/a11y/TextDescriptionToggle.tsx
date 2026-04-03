/**
 * TextDescriptionToggle.tsx — Task 3.1 — Agent_Interactive_Core
 *
 * Accessibility wrapper that pairs a visualisation with a prose text
 * description. A "Show text description" toggle (a native <details> /
 * <summary> element) lets keyboard and screen-reader users access the
 * data without interpreting the SVG.
 *
 * Behaviour:
 *   – Default (closed): visualisation is visible; description is hidden.
 *   – Open: description appears below the visualisation (additive layout —
 *     the visualisation remains visible and the page does not reflow).
 *
 * ARIA notes:
 *   – <details> / <summary> is the recommended native disclosure pattern;
 *     no additional ARIA roles are needed.
 *   – The visualisation is always present in both the DOM and the AT tree.
 *     Screen-reader users can navigate past the visualisation to the
 *     description in the <details> element below.
 *
 * Usage:
 *   <TextDescriptionToggle
 *     description="Bar chart showing five categories. Category A is highest at 42%."
 *   >
 *     <MyBarChart client:visible />
 *   </TextDescriptionToggle>
 */

import type { ReactNode } from 'react';
import './TextDescriptionToggle.css';

export interface TextDescriptionToggleProps {
  /** Prose description of the visualisation for non-visual users. */
  description: string;
  /** The visualisation element(s) to wrap. */
  children: ReactNode;
  /** Optional label override for the toggle summary. Defaults to "Show text description". */
  toggleLabel?: string;
}

export function TextDescriptionToggle({
  description,
  children,
  toggleLabel = 'Show text description',
}: TextDescriptionToggleProps) {
  return (
    <div className="tdt-wrapper">
      {/* Visualisation — always visible; description shown additively below */}
      <div className="tdt-viz">
        {children}
      </div>

      {/*
       * <details> / <summary> is the native HTML disclosure pattern.
       * The browser natively tracks open/closed state; no React state needed.
       */}
      <details
        className="tdt-details"
      >
        <summary className="tdt-summary">{toggleLabel}</summary>
        <p className="tdt-description">{description}</p>
      </details>
    </div>
  );
}
