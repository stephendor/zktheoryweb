/**
 * bibliography.ts — Task 2.9b — Agent_Integration
 *
 * Build-time utility functions for bibliography display.
 * Reads from the Zotero JSON cache imported at Vite/Astro build time.
 *
 * IMPORTANT: This module imports the full Zotero JSON cache at module level.
 * Do NOT import this module in client-side React components; pass
 * ZoteroItem[] as props from Astro page/layout context instead.
 *
 * BibTeX generation is exported from this same module (added in Task step 3).
 */

import type { ZoteroItem } from './zotero.js';
import libraryData from '@data/zotero-library.json';

// Cast to access the shape we need; extra JSON fields are safely ignored.
const cachedItems = (libraryData as unknown as { items: ZoteroItem[] }).items;
// Collection key → name map populated by fetchZoteroLibrary. Empty until first fetch.
const cachedCollections = (libraryData as unknown as { collections?: Record<string, string> }).collections ?? {};

const SKIP_TYPES = new Set(['note', 'attachment']);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all non-note, non-attachment items from the Zotero cache.
 */
export function getBibliographyItems(): ZoteroItem[] {
  return cachedItems.filter(item => !SKIP_TYPES.has(item.itemType));
}

/**
 * Returns items belonging to a named Zotero collection (e.g. 'Counting Lives',
 * 'TDA-Research'). Falls back to the full library when the collections map is
 * empty (i.e. before the first `fetchZoteroLibrary` run populates it).
 *
 * @param collectionName - The human-readable Zotero collection name.
 */
export function getBibliographyByCollection(collectionName: string): ZoteroItem[] {
  if (Object.keys(cachedCollections).length === 0) {
    // Collections map not yet populated — return full library as fallback.
    return getBibliographyItems();
  }

  const matchingKeys = new Set(
    Object.entries(cachedCollections)
      .filter(([, name]) => name === collectionName)
      .map(([key]) => key),
  );

  if (matchingKeys.size === 0) {
    // Collection name not found — return full library as fallback.
    return getBibliographyItems();
  }

  return getBibliographyItems().filter(item =>
    (item.collections ?? []).some(k => matchingKeys.has(k)),
  );
}

/**
 * Finds a single Zotero item by its key from the full bibliography.
 */
export function getCitationByKey(key: string): ZoteroItem | undefined {
  return getBibliographyItems().find(item => item.key === key);
}

/**
 * Formats a creator list for display in bibliography contexts.
 *   Single author:  "Surname, F."
 *   Two authors:    "Surname & Surname"
 *   Three or more:  "Surname et al."
 *
 * Filters to creatorType === 'author'; falls back to all creators if none.
 */
export function formatAuthorList(creators: ZoteroItem['creators']): string {
  const authors = creators.filter(c => c.creatorType === 'author');
  const target = authors.length > 0 ? authors : creators;

  if (target.length === 0) return 'Unknown';

  const lastName = (c: ZoteroItem['creators'][number]): string =>
    c.lastName ?? c.name ?? 'Unknown';

  const withInitial = (c: ZoteroItem['creators'][number]): string => {
    const last = lastName(c);
    const init = c.firstName ? ` ${c.firstName.charAt(0)}.` : '';
    return `${last},${init}`;
  };

  if (target.length === 1) return withInitial(target[0]);
  if (target.length === 2) return `${lastName(target[0])} & ${lastName(target[1])}`;
  return `${lastName(target[0])} et al.`;
}

/**
 * Produces a minimal inline citation string for prose: "Author (Year)" or
 * "Author et al. (Year)". Used as the visible trigger text in CitationPopover.
 */
export function formatCitation(item: ZoteroItem): string {
  const authors = item.creators.filter(c => c.creatorType === 'author');
  const target = authors.length > 0 ? authors : item.creators;

  const year = extractYear(item.date);

  if (target.length === 0) return `Unknown (${year})`;

  const first = target[0];
  const surname = first.lastName ?? first.name ?? 'Unknown';

  if (target.length >= 3) return `${surname} et al. (${year})`;
  if (target.length === 2) {
    const second = target[1].lastName ?? target[1].name ?? 'Unknown';
    return `${surname} & ${second} (${year})`;
  }
  return `${surname} (${year})`;
}

// ─── BibTeX Generation (Step 3) ───────────────────────────────────────────────

/**
 * Entry type mapping from Zotero itemType to BibTeX entry type.
 */
const BIBTEX_TYPE_MAP: Record<string, string> = {
  journalArticle:  '@article',
  book:            '@book',
  bookSection:     '@incollection',
  conferencePaper: '@inproceedings',
  report:          '@techreport',
};

/**
 * Generates a BibTeX entry string from a ZoteroItem.
 *
 * Citation key format: {firstAuthorLastname}{year}{firstTitleWord}
 * (lowercase, special characters stripped)
 *
 * Required fields: author, title, year.
 * Optional fields included if present: journal, volume, number, pages,
 * doi, url, publisher, editor, booktitle.
 */
export function generateBibTeX(item: ZoteroItem): string {
  const entryType = BIBTEX_TYPE_MAP[item.itemType] ?? '@misc';
  const year = extractYear(item.date);

  // ── Citation key ──────────────────────────────────────────────────────────
  const authors = item.creators.filter(c => c.creatorType === 'author');
  const firstAuthor = authors[0] ?? item.creators[0];
  const firstLastname = sanitizeBibKey(
    firstAuthor ? (firstAuthor.lastName ?? firstAuthor.name ?? 'unknown') : 'unknown'
  );
  const firstTitleWord = sanitizeBibKey(
    (item.title ?? '').split(/\s+/)[0] ?? 'untitled'
  );
  const citeKey = `${firstLastname}${year}${firstTitleWord}`;

  // ── Author field (BibTeX: "Lastname, Firstname and Lastname, Firstname") ──
  const allAuthors = authors.length > 0 ? authors : item.creators;
  const authorField = allAuthors
    .map(c => {
      if (c.lastName && c.firstName) return `${c.lastName}, ${c.firstName}`;
      if (c.lastName) return c.lastName;
      return c.name ?? 'Unknown';
    })
    .join(' and ');

  // ── Build fields ──────────────────────────────────────────────────────────
  const fields: [string, string][] = [
    ['author', authorField || 'Unknown'],
    ['title',  item.title ?? 'Untitled'],
    ['year',   year],
  ];

  // Extra fields — cast to access potential additional Zotero data fields
  type ExtendedItem = ZoteroItem & {
    journal?: string;
    publicationTitle?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    publisher?: string;
    editor?: string;
    bookTitle?: string;
    proceedingsTitle?: string;
  };
  const ext = item as ExtendedItem;

  const journal = ext.journal ?? ext.publicationTitle;
  if (journal) fields.push(['journal', journal]);
  if (ext.volume) fields.push(['volume', ext.volume]);
  if (ext.issue)  fields.push(['number', ext.issue]);
  if (ext.pages)  fields.push(['pages',  ext.pages]);

  const dOI = item.DOI?.trim();
  if (dOI) fields.push(['doi', dOI]);

  const url = item.url?.trim();
  if (url) fields.push(['url', url]);

  if (ext.publisher) fields.push(['publisher', ext.publisher]);

  const booktitle = ext.bookTitle ?? ext.proceedingsTitle;
  if (booktitle) fields.push(['booktitle', booktitle]);

  // ── Assemble ──────────────────────────────────────────────────────────────
  const fieldLines = fields
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(',\n');

  return `${entryType}{${citeKey},\n${fieldLines}\n}`;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Extracts a 4-digit year from a Zotero date string, or returns 'n.d.' */
function extractYear(date?: string): string {
  if (!date) return 'n.d.';
  const match = date.match(/\d{4}/);
  return match ? match[0] : 'n.d.';
}

/** Strips non-alphanumeric characters and lowercases for BibTeX citation keys */
function sanitizeBibKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}
