/**
 * ExpandableCard.tsx — Task 2.2b — Agent_Design_Templates
 *
 * Reusable React island for collapsible key-claims, key-findings, and
 * reflection-question disclosures across CL chapters and TDA paper pages.
 *
 * Usage in parent Astro component:
 *   <ExpandableCard client:visible title={kc.claim} detail={kc.detail} />
 *
 * Directive choice: client:visible — the component lives in the article body
 * (typically below the fold) so hydration on viewport entry is appropriate.
 *
 * Animation: CSS grid-template-rows 0fr → 1fr, 250 ms ease.
 * Reduced-motion: transition is suppressed via @media prefers-reduced-motion
 * inside ExpandableCard.css.
 *
 * ARIA pattern: button (aria-expanded + aria-controls) + region (role + aria-label).
 * The region is removed from the accessibility tree (aria-hidden) when collapsed
 * so assistive technologies respect the disclosed / undisclosed state.
 */

import { useState, useId } from 'react';
import './ExpandableCard.css';

export interface ExpandableCardProps {
  /** The claim / question / heading shown in the always-visible trigger */
  title: string;
  /** The expanded body — string or JSX */
  detail: React.ReactNode;
  /** Start open. Defaults to false. */
  defaultOpen?: boolean;
  /**
   * CSS custom-property value used as the accent colour on the trigger icon.
   * Pass e.g. "var(--color-tda-teal)" for TDA contexts.
   * Defaults to "var(--color-cl-red)".
   */
  accentColor?: string;
}

export function ExpandableCard({
  title,
  detail,
  defaultOpen = false,
  accentColor = 'var(--color-cl-red)',
}: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // useId() returns a stable colon-delimited string like ":r0:".
  // Strip non-alphanumeric chars to form a valid, unique HTML id.
  const uid = useId();
  const panelId = `ec-panel-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div
      className="ec-card"
      // Expose the accent as a local CSS custom property so the cascade
      // carries it into the CSS file without requiring inline style duplication.
      style={{ '--ec-accent': accentColor } as React.CSSProperties}
    >
      {/* ── Trigger ── */}
      <button
        type="button"
        className="ec-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {/* +/− icon toggled with state; hidden from AT since it's decorative */}
        <span className="ec-icon" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
        <span className="ec-title">{title}</span>
      </button>

      {/* ── Detail panel ── */}
      {/*
        aria-hidden is set to true when collapsed so assistive technologies
        skip the collapsed content (matching the visual state).
        The id is always present so aria-controls resolves correctly.
      */}
      <div
        id={panelId}
        role="region"
        aria-label={title}
        aria-hidden={isOpen ? undefined : true}
        className={`ec-panel${isOpen ? ' ec-panel--open' : ''}`}
      >
        <div className="ec-panel-inner">{detail}</div>
      </div>
    </div>
  );
}
