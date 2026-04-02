/**
 * CitationPopover.tsx — Task 2.9b — Agent_Integration
 *
 * React island: inline citation trigger showing a positioned tooltip with
 * full citation details loaded from the Zotero cache.
 *
 * Props:
 *   citeKey — Zotero item key (e.g. "SGG8RTK3")
 *   items   — bibliography items passed from Astro page at build time;
 *             do NOT import zotero-library.json here (client hydration).
 *
 * Usage in MDX (import getBibliographyItems() in the Astro page, pass result):
 *   <CitationPopover client:visible citeKey="SGG8RTK3" items={bibItems} />
 *
 * ARIA pattern:
 *   - Trigger <button> has aria-describedby pointing to tooltip id (when open).
 *   - Tooltip <div> has role="tooltip" with the matching id.
 *   - aria-hidden="true" removes hidden tooltip from the AT tree.
 *   - <cite> is not interactive; wrapped in <button type="button"> for keyboard.
 *
 * Positioning:
 *   - Absolute within position:relative wrapper (below trigger by default).
 *   - Right-edge flip via getBoundingClientRect when tooltip overflows viewport.
 *
 * Reduced motion: transition suppressed when prefers-reduced-motion: reduce.
 */

import { useState, useId, useEffect, useRef, useCallback } from 'react';
import type { ZoteroItem } from '@lib/zotero';
import './CitationPopover.css';

export interface CitationPopoverProps {
  citeKey: string;
  items: ZoteroItem[];
}

// ── Local formatting helpers ──────────────────────────────────────────────────
// Mirrors bibliography.ts utilities but inlined here to avoid bundling the
// full zotero-library.json JSON into the client hydration payload.

function extractYear(date?: string): string {
  if (!date) return 'n.d.';
  const m = date.match(/\d{4}/);
  return m ? m[0] : 'n.d.';
}

type Creator = ZoteroItem['creators'][number];

function lastName(c: Creator): string {
  return c.lastName ?? c.name ?? 'Unknown';
}

/** "Surname (Year)" or "Surname et al. (Year)" — inline prose trigger text */
function formatInlineCitation(item: ZoteroItem): string {
  const authors = item.creators.filter(c => c.creatorType === 'author');
  const target = authors.length > 0 ? authors : item.creators;
  const year = extractYear(item.date);
  if (target.length === 0) return `Unknown (${year})`;
  const first = lastName(target[0]);
  if (target.length >= 3) return `${first} et al. (${year})`;
  if (target.length === 2) return `${first} & ${lastName(target[1])} (${year})`;
  return `${first} (${year})`;
}

/** Full author list for tooltip display — "Surname, F." / "A & B" / "A et al." */
function formatFullAuthorList(creators: ZoteroItem['creators']): string {
  const authors = creators.filter(c => c.creatorType === 'author');
  const target = authors.length > 0 ? authors : creators;
  if (target.length === 0) return 'Unknown';

  const fmt = (c: Creator): string => {
    if (c.lastName) {
      return c.firstName ? `${c.lastName}, ${c.firstName.charAt(0)}.` : c.lastName;
    }
    return c.name ?? 'Unknown';
  };

  if (target.length === 1) return fmt(target[0]);
  if (target.length === 2) return `${fmt(target[0])} & ${lastName(target[1])}`;
  return `${fmt(target[0])} et al.`;
}

// ─────────────────────────────────────────────────────────────────────────────

export function CitationPopover({ citeKey, items }: CitationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flippedLeft, setFlippedLeft] = useState(false);

  const uid = useId();
  const tooltipId = `cp-tooltip-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const wrapperRef  = useRef<HTMLSpanElement>(null);
  const tooltipRef  = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const prefersRed  = useRef(false);

  const item = items.find(i => i.key === citeKey);

  // Detect reduced motion once on mount
  useEffect(() => {
    prefersRed.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // After tooltip renders, check for right-edge overflow and flip if needed
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

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
        triggerRef.current?.focus();
      }
    },
    [isOpen, close],
  );

  // Click-outside handler
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

  // ── Graceful fallback for unknown citeKey ─────────────────────────────────
  if (!item) {
    return (
      <span className="cp-missing" aria-label={`Unknown citation: ${citeKey}`}>
        [{citeKey}]
      </span>
    );
  }

  const displayText    = formatInlineCitation(item);
  const fullAuthorList = formatFullAuthorList(item.creators);
  const year           = extractYear(item.date);
  const doi            = item.DOI?.trim() || null;
  const url            = item.url?.trim() || null;

  const tooltipClasses = [
    'cp-tooltip',
    isOpen              ? 'cp-tooltip--visible' : '',
    flippedLeft         ? 'cp-tooltip--left'    : '',
    prefersRed.current  ? 'cp-tooltip--instant' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      ref={wrapperRef}
      className="cp-wrapper"
      // Mouse handlers on wrapper so moving from button → tooltip stays open
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <button
        ref={triggerRef}
        type="button"
        className="cp-trigger"
        aria-label={`View citation: ${item.title}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        onFocus={open}
        onBlur={(e) => {
          // Keep open if focus moves to an element inside the wrapper (e.g. DOI link)
          if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
            close();
          }
        }}
        onClick={() => (isOpen ? close() : open())}
      >
        <cite>{displayText}</cite>
      </button>

      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={tooltipClasses}
        aria-hidden={!isOpen}
      >
        <p className="cp-title">{item.title}</p>
        <p className="cp-authors">{fullAuthorList}</p>
        <p className="cp-year">{year}</p>

        {(doi || url) && (
          <div className="cp-links">
            {doi && (
              <a
                href={`https://doi.org/${doi}`}
                className="cp-doi-link"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isOpen ? 0 : -1}
              >
                DOI: {doi}
              </a>
            )}
            {url && !doi && (
              <a
                href={url}
                className="cp-url-link"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isOpen ? 0 : -1}
              >
                Link ↗
              </a>
            )}
          </div>
        )}
      </div>
    </span>
  );
}
