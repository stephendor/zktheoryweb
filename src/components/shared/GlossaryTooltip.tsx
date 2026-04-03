/**
 * GlossaryTooltip.tsx — Task 4.6 — Agent_Integration
 *
 * React island: inline glossary term trigger showing a small positioned
 * tooltip with the first definition and a "See full entry" link.
 *
 * Props:
 *   term — the display text rendered in prose (e.g. "persistent homology")
 *   slug — kebab-case glossary entry slug, used to look up the definition
 *          and build the link to /learn/glossary/#${slug}
 *
 * Usage in MDX (mount with client:visible):
 *   import { GlossaryTooltip } from '@components/shared/GlossaryTooltip';
 *   <GlossaryTooltip client:visible term="persistent homology" slug="persistent-homology" />
 *
 * ARIA pattern (mirrors CitationPopover):
 *   - Trigger <button> has aria-describedby pointing to tooltip id when open.
 *   - Tooltip <div> has role="tooltip" with the matching id.
 *   - aria-hidden="true" removes hidden tooltip from the AT tree.
 *
 * Positioning:
 *   - Below trigger by default (top: calc(100% + space-1)).
 *   - Right-edge flip via getBoundingClientRect when tooltip overflows viewport.
 *
 * Reduced motion: CSS transition suppressed when prefers-reduced-motion: reduce.
 *
 * Dismiss: pointer leave from wrapper, Escape key, click outside.
 */

import { useState, useId, useEffect, useRef, useCallback } from 'react';
import { getBySlug } from '@data/glossary';
import './GlossaryTooltip.css';

export interface GlossaryTooltipProps {
  /** Display text rendered in the prose flow */
  term: string;
  /** kebab-case slug matching a GlossaryEntry */
  slug: string;
}

export function GlossaryTooltip({ term, slug }: GlossaryTooltipProps) {
  const [isOpen, setIsOpen]         = useState(false);
  const [flippedLeft, setFlippedLeft] = useState(false);

  const uid        = useId();
  const tooltipId  = `gt-tooltip-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prefersRed = useRef(false);

  // Look up definition at render time (static data — no async needed)
  const entry = getBySlug(slug);

  // First definition text, trimmed to ≤2 sentences for tooltip brevity
  const firstDefinition = entry?.definitions[0];
  const tooltipText = firstDefinition
    ? truncateToSentences(firstDefinition.text, 2)
    : null;

  // Detect reduced motion once on mount
  useEffect(() => {
    prefersRed.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Check right-edge overflow and flip if needed
  const checkOverflow = useCallback(() => {
    if (!tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setFlippedLeft(rect.right > window.innerWidth - 16);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(checkOverflow);
  }, [checkOverflow]);

  const close = useCallback(() => {
    setIsOpen(false);
    setFlippedLeft(false);
  }, []);

  // Escape key: close and return focus to trigger
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
        triggerRef.current?.focus();
      }
    },
    [isOpen, close],
  );

  // Click outside: close
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (isOpen && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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

  // Graceful fallback: unknown slug — render plain text
  if (!entry || !tooltipText) {
    return <span className="gt-missing">{term}</span>;
  }

  const tooltipClasses = [
    'gt-tooltip',
    isOpen             ? 'gt-tooltip--visible' : '',
    flippedLeft        ? 'gt-tooltip--left'    : '',
    prefersRed.current ? 'gt-tooltip--instant' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      ref={wrapperRef}
      className="gt-wrapper"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <button
        ref={triggerRef}
        type="button"
        className="gt-trigger"
        aria-label={`Glossary: ${entry.term}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        onFocus={open}
        onBlur={(e) => {
          // Keep open if focus moves within the wrapper (e.g. "See full entry" link)
          if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
            close();
          }
        }}
        onClick={() => (isOpen ? close() : open())}
      >
        {term}
      </button>

      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={tooltipClasses}
        aria-hidden={isOpen ? 'false' : 'true'}
      >
        <p className="gt-definition">{tooltipText}</p>
        <a
          href={`/learn/glossary/#${slug}`}
          className="gt-link"
          tabIndex={isOpen ? 0 : -1}
        >
          See full entry →
        </a>
      </div>
    </span>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Return at most `n` sentences from a block of text.
 * Splits on ". ", "? ", "! " or end-of-string sentence boundaries.
 */
function truncateToSentences(text: string, n: number): string {
  // Match sentence-ending punctuation followed by space or end of string
  const sentenceRe = /[^.!?]*[.!?](?:\s|$)/g;
  const sentences: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = sentenceRe.exec(text)) !== null && sentences.length < n) {
    sentences.push(match[0].trim());
  }
  // Fallback: if regex found nothing, return the whole text
  return sentences.length > 0 ? sentences.join(' ') : text;
}
