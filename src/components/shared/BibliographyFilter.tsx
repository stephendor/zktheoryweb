/**
 * BibliographyFilter.tsx — Task 2.9b — Agent_Integration
 *
 * React island: wraps a bibliography item list with live search and tag filtering.
 * All filtering runs client-side; initial render is SSR from Astro.
 *
 * Design choice: React island (vs URL-param approach) — chosen because:
 *   1. Items are already passed as props from Astro at build time.
 *   2. Avoids a full page reload on every filter/search change.
 *   3. Consistent with the existing React island pattern used throughout the site.
 *
 * Props:
 *   items        — BibliographyEntry[] with pre-computed bibtex field injected by
 *                  BibliographyList.astro at build time (server-side). BibTeX generation
 *                  is intentionally NOT done here to keep client bundle lean.
 *   accentColor  — CSS custom property value for accent elements (e.g. "var(--color-cl-red)")
 *
 * Client directive: client:load (must be interactive from page load for search)
 *
 * Accessibility:
 *   - Search input has aria-label and aria-controls pointing to list id.
 *   - Tag filter buttons have aria-pressed to communicate selected state.
 *   - Live region announces filtered count changes.
 *   - "Clear filters" resets both search and active tag.
 */

import { useState, useId, useMemo } from 'react';
import type { ZoteroItem } from '@lib/zotero';
import { formatAuthorList } from '@lib/bibliography';
import { BibTexCopyButton } from '@components/tda/BibTexCopyButton';
import './BibliographyFilter.css';

/**
 * ZoteroItem extended with a pre-computed BibTeX string.
 * BibliographyList.astro generates this at build time via generateBibTeX().
 */
export type BibliographyEntry = ZoteroItem & { bibtex: string };

export interface BibliographyFilterProps {
  items: BibliographyEntry[];
  accentColor?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractYear(date?: string): string {
  if (!date) return 'n.d.';
  const m = date.match(/\d{4}/);
  return m ? m[0] : 'n.d.';
}

type ExtendedItem = ZoteroItem & {
  journal?: string;
  publicationTitle?: string;
  publisher?: string;
};

function getPublicationVenue(item: ZoteroItem): string | null {
  const ext = item as ExtendedItem;
  return ext.journal ?? ext.publicationTitle ?? ext.publisher ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────

export function BibliographyFilter({
  items,
  accentColor = 'var(--color-cl-red)',
}: BibliographyFilterProps) {
  const [query, setQuery]         = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const uid    = useId();
  const listId = `biblio-list-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  // ── Collect all unique tags from items ────────────────────────────────────
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => item.tags?.forEach(t => tagSet.add(t.tag)));
    return [...tagSet].sort();
  }, [items]);

  // ── Filtered items ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const lq = query.trim().toLowerCase();
    return items.filter(item => {
      // Tag filter
      if (activeTag && !item.tags?.some(t => t.tag === activeTag)) {
        return false;
      }
      // Text filter — title and author surnames
      if (lq) {
        const title = (item.title ?? '').toLowerCase();
        const authors = formatAuthorList(item.creators).toLowerCase();
        if (!title.includes(lq) && !authors.includes(lq)) {
          return false;
        }
      }
      return true;
    });
  }, [items, query, activeTag]);

  const hasFilters = query.trim() !== '' || activeTag !== null;

  // ── CSS accent injection via inline style on root ─────────────────────────
  const rootStyle = { '--cp-accent': accentColor } as React.CSSProperties;

  return (
    <div className="bibf-root" style={rootStyle}>

      {/* ── Search input ────────────────────────────────────────────────── */}
      <div className="bibf-search-row">
        <label htmlFor={`${uid}-search`} className="bibf-search-label">
          Search bibliography
        </label>
        <input
          id={`${uid}-search`}
          type="search"
          className="bibf-search-input"
          placeholder="Title or author…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-controls={listId}
          aria-label="Search bibliography by title or author"
        />
      </div>

      {/* ── Tag filter row (only shown when tags exist) ──────────────────── */}
      {allTags.length > 0 && (
        <div className="bibf-tag-row" role="group" aria-label="Filter by tag">
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              className={`bibf-tag${activeTag === tag ? ' bibf-tag--active' : ''}`}
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(prev => (prev === tag ? null : tag))}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* ── Clear filters ────────────────────────────────────────────────── */}
      {hasFilters && (
        <button
          type="button"
          className="bibf-clear"
          onClick={() => { setQuery(''); setActiveTag(null); }}
        >
          ✕ Clear filters
        </button>
      )}

      {/* ── Live count ──────────────────────────────────────────────────── */}
      <p
        className="bibf-count"
        aria-live="polite"
        aria-atomic="true"
      >
        {filtered.length === items.length
          ? `${items.length} items`
          : `${filtered.length} of ${items.length} items`}
      </p>

      {/* ── Item list ───────────────────────────────────────────────────── */}
      <ol id={listId} className="bibf-list">
        {filtered.map(item => {
          const year    = extractYear(item.date);
          const authors = formatAuthorList(item.creators);
          const venue   = getPublicationVenue(item);
          const doi     = item.DOI?.trim() || null;
          const url     = item.url?.trim() || null;
          // bibtex is pre-computed at build time by BibliographyList.astro
          const { bibtex } = item;

          return (
            <li key={item.key} className="bibf-item">
              {/* Author + year */}
              <p className="bibf-item-meta">
                <span className="bibf-authors">{authors}</span>
                {' '}
                <span className="bibf-year">({year})</span>
              </p>

              {/* Title */}
              <p className="bibf-item-title">
                <cite>{item.title}</cite>
              </p>

              {/* Journal / publisher */}
              {venue && (
                <p className="bibf-item-venue">{venue}</p>
              )}

              {/* DOI / URL links */}
              {(doi || url) && (
                <p className="bibf-item-links">
                  {doi && (
                    <a
                      href={`https://doi.org/${doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bibf-doi"
                    >
                      DOI: {doi}
                    </a>
                  )}
                  {url && !doi && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bibf-url"
                    >
                      Link ↗
                    </a>
                  )}
                </p>
              )}

              {/* Tag pills */}
              {item.tags && item.tags.length > 0 && (
                <ul className="bibf-item-tags" aria-label="Item tags">
                  {item.tags.map(t => (
                    <li key={t.tag}>
                      <button
                        type="button"
                        className={`bibf-tag bibf-tag--sm${activeTag === t.tag ? ' bibf-tag--active' : ''}`}
                        aria-pressed={activeTag === t.tag}
                        onClick={() => setActiveTag(prev => (prev === t.tag ? null : t.tag))}
                      >
                        {t.tag}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* BibTeX copy button */}
              <div className="bibf-item-bibtex">
                <BibTexCopyButton bibtex={bibtex} />
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <p className="bibf-empty">No items match your search.</p>
      )}
    </div>
  );
}
