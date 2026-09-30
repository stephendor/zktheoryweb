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
 * Client components that only need the formatting helpers must import them from
 * ./bibliographyFormat, which has no JSON import.
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

// ─── Formatting helpers ───────────────────────────────────────────────────────
// Defined in bibliographyFormat.ts (no JSON import) and re-exported here for
// build-time callers. Client components must import from './bibliographyFormat'.
export { formatAuthorList, formatCitation, generateBibTeX } from './bibliographyFormat.js';
