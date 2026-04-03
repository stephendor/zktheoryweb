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
 *   – Open: description is shown; visualisation is hidden visually
 *     (visibility: hidden keeps the layout footprint so the page does
 *     not reflow).
 *
 * ARIA notes:
 *   – <details> / <summary> is the recommended native disclosure pattern;
 *     no additional ARIA roles are needed.
 *   – When the description is shown the SVG child is still present in the
 *     DOM but visually hidden. If you also wish to remove it from the AT
 *     tree, add aria-hidden="true" to the visualisation's root SVG element
 *     when `descriptionOpen` is true (pass `isDescriptionOpen` prop to the
 *     child via a render-prop pattern if needed).
 *
 * Usage:
 *   <TextDescriptionToggle
 *     description="Bar chart showing five categories. Category A is highest at 42%."
 *   >
 *     <MyBarChart client:visible />
 *   </TextDescriptionToggle>
 */

import { useState } from 'react';
import './TextDescriptionToggle.css';

export interface TextDescriptionToggleProps {
  /** Prose description of the visualisation for non-visual users. */
  description: string;
  /** The visualisation element(s) to wrap. */
  children: React.ReactNode;
  /** Optional label override for the toggle summary. Defaults to "Show text description". */
  toggleLabel?: string;
}

export function TextDescriptionToggle({
  description,
  children,
  toggleLabel = 'Show text description',
}: TextDescriptionToggleProps) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  return (
    <div className="tdt-wrapper">
      {/* Visualisation — always visible; description shown additively below */}
      <div className="tdt-viz">
        {children}
      </div>

      {/*
       * <details> / <summary> is the native HTML disclosure pattern.
       * onToggle fires after the open state changes; we mirror it into
       * React state to drive the viz visibility class above.
       */}
      <details
        className="tdt-details"
        onToggle={(e: React.SyntheticEvent<HTMLDetailsElement>) => {
          setDescriptionOpen(e.currentTarget.open);
        }}
      >
        <summary className="tdt-summary">{toggleLabel}</summary>
        <p className="tdt-description">{description}</p>
      </details>
    </div>
  );
}
