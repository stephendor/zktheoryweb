/**
 * ConceptTooltip.tsx — Task 2.2c — Agent_Design_Templates
 *
 * Inline React island that shows a definition tooltip on hover/focus
 * and links to the full mathematical interlude.
 *
 * Usage in MDX:
 *   <ConceptTooltip
 *     client:visible
 *     concept="persistent homology"
 *     interlude="persistent-homology"
 *     definition="A method for computing topological features of data across multiple scales."
 *   />
 *
 * ARIA pattern:
 *   - Trigger <a> has aria-describedby pointing to tooltip id.
 *   - Tooltip <div> has role="tooltip" and the matching id.
 *   - When tooltip is hidden, aria-hidden="true" removes it from the AT tree.
 *
 * Positioning:
 *   - Tooltip is absolute within the inline wrapper (position: relative).
 *   - On open, getBoundingClientRect detects right-edge overflow and flips
 *     the tooltip to the left side when it would overflow the viewport.
 *
 * Reduced motion:
 *   - Transitions are suppressed when prefers-reduced-motion: reduce is active.
 *   - Checked once on mount via matchMedia.
 */

import { useState, useId, useEffect, useRef, useCallback } from 'react';
import './ConceptTooltip.css';

export interface ConceptTooltipProps {
  /** The concept text displayed inline as the trigger link */
  concept: string;
  /** Interlude slug — builds href /counting-lives/interludes/{slug}/ */
  interlude: string;
  /** Short definition displayed inside the tooltip */
  definition: string;
}

export function ConceptTooltip({ concept, interlude, definition }: ConceptTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flippedLeft, setFlippedLeft] = useState(false);

  const uid = useId();
  // Strip non-alphanumeric chars from useId output for a valid HTML id
  const tooltipId = `ct-tooltip-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);

  // Check reduced-motion once on mount
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Detect right-edge overflow and flip tooltip left when needed
  const checkOverflow = useCallback(() => {
    if (!tooltipRef.current || !wrapperRef.current) return;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    setFlippedLeft(tooltipRect.right > viewportWidth - 16);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    // After the tooltip is rendered, check for overflow
    requestAnimationFrame(checkOverflow);
  }, [checkOverflow]);

  const close = useCallback(() => {
    setIsOpen(false);
    setFlippedLeft(false);
  }, []);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
        triggerRef.current?.focus();
      }
    },
    [isOpen, close],
  );

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        isOpen &&
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        close();
      }
    },
    [isOpen, close],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  const interludeHref = `/counting-lives/interludes/${interlude}/`;

  return (
    <span
      ref={wrapperRef}
      className={`ct-wrapper${prefersReducedMotion.current ? ' ct-reduced-motion' : ''}`}
    >
      {/* ── Trigger link ── */}
      <a
        ref={triggerRef}
        href={interludeHref}
        className="ct-trigger"
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={(e) => {
          // Prevent navigation; toggle tooltip instead
          e.preventDefault();
          isOpen ? close() : open();
        }}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={(e) => {
          // Only close if focus moves outside the wrapper
          if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
            close();
          }
        }}
      >
        {concept}
      </a>

      {/* ── Tooltip panel ──
           Must be <span> (not <div>) so it remains valid phrasing content
           inside a <p>. A <div> inside <span> inside <p> causes the browser
           HTML parser to implicitly close the <p>, splitting the paragraph
           and corrupting the CSS Grid sidenote layout. ── */}
      <span
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={`ct-tooltip${flippedLeft ? ' ct-tooltip--left' : ''}${isOpen ? ' ct-tooltip--visible' : ''}`}
        aria-hidden={!isOpen}
      >
        <span className="ct-definition">{definition}</span>
        <a href={interludeHref} className="ct-interlude-link">
          Read interlude →
        </a>
      </span>
    </span>
  );
}
