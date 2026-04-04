import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ZoteroItem = {
  key: string;
  version: number;
  itemType: string;
  title: string;
  creators: Array<{
    creatorType: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }>;
  date?: string;
  url?: string;
  DOI?: string;
  abstractNote?: string;
  tags: Array<{ tag: string }>;
  collections: string[];
};

export type ZoteroCollection = {
  key: string;
  name: string;
  parentCollection?: string | false;
};

export type ZoteroLibraryCache = {
  version: number;
  items: ZoteroItem[];
  /** key → collection name map, populated by fetchZoteroLibrary */
  collections: Record<string, string>;
  fetchedAt: string;
};

// ─── Internal Helpers ─────────────────────────────────────────────────────────

const CACHE_PATH = join(__dirname, '../data/zotero-library.json');
const ZOTERO_API_BASE = 'https://api.zotero.org';

function readCache(): ZoteroLibraryCache | null {
  try {
    const raw = readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as ZoteroLibraryCache;
  } catch {
    return null;
  }
}

function writeCache(cache: ZoteroLibraryCache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function fetchZoteroLibrary(options?: { force?: boolean }): Promise<ZoteroItem[]> {
  const userID = process.env.ZOTERO_USER_ID;
  const apiKey = process.env.ZOTERO_API_KEY;

  if (!userID || !apiKey) {
    throw new Error(
      'Missing required environment variables: ZOTERO_USER_ID and ZOTERO_API_KEY must be set.'
    );
  }

  const headers: Record<string, string> = {
    'Zotero-API-Version': '3',
    Authorization: `Bearer ${apiKey}`,
  };

  const cache = readCache();

  // ── Collection fetch helper ──────────────────────────────────────────────
  async function fetchCollections(): Promise<Record<string, string>> {
    console.log('[zotero] Fetching collections...');
    const res = await fetch(
      `${ZOTERO_API_BASE}/users/${userID}/collections?format=json&include=data&limit=100`,
      { headers }
    );
    if (!res.ok) {
      throw new Error(`Zotero collections API error: ${res.status} ${res.statusText}`);
    }
    const raw = (await res.json()) as Array<{ data: ZoteroCollection }>;
    const map: Record<string, string> = {};
    for (const { data } of raw) {
      map[data.key] = data.name;
    }
    console.log(`[zotero] ${Object.keys(map).length} collection(s) fetched.`);
    return map;
  }

  try {
    // ── Incremental fetch ──────────────────────────────────────────────────
    if (cache && options?.force !== true) {
      console.log(`[zotero] Incremental fetch using ?since=${cache.version}...`);
      const res = await fetch(
        `${ZOTERO_API_BASE}/users/${userID}/items?format=json&include=data&since=${cache.version}&limit=100`,
        { headers }
      );

      if (res.status === 304) {
        console.log('[zotero] Cache is up to date (304). Returning cached data.');
        return cache.items;
      }

      if (!res.ok) {
        throw new Error(`Zotero API error: ${res.status} ${res.statusText}`);
      }

      const rawItems = (await res.json()) as Array<{ data: ZoteroItem }>;
      const newVersion = parseInt(
        res.headers.get('Last-Modified-Version') ?? String(cache.version),
        10
      );

      // Always refresh collections on incremental fetch too (lightweight).
      const collections = await fetchCollections();

      if (rawItems.length === 0) {
        console.log('[zotero] No item changes since last fetch. Updating collections only.');
        const noChange: ZoteroLibraryCache = {
          ...cache,
          collections,
          fetchedAt: new Date().toISOString(),
        };
        writeCache(noChange);
        return cache.items;
      }

      console.log(`[zotero] ${rawItems.length} updated item(s). Merging into cache...`);
      const itemMap = new Map(cache.items.map((i) => [i.key, i]));
      for (const { data } of rawItems) {
        itemMap.set(data.key, data);
      }

      const updated: ZoteroLibraryCache = {
        version: newVersion,
        items: Array.from(itemMap.values()),
        collections,
        fetchedAt: new Date().toISOString(),
      };
      writeCache(updated);
      console.log(`[zotero] Cache updated. Total items: ${updated.items.length}`);
      return updated.items;
    }

    // ── Full fetch with pagination ─────────────────────────────────────────
    console.log('[zotero] Performing full library fetch...');
    const firstRes = await fetch(
      `${ZOTERO_API_BASE}/users/${userID}/items?format=json&include=data&limit=100`,
      { headers }
    );

    if (!firstRes.ok) {
      throw new Error(`Zotero API error: ${firstRes.status} ${firstRes.statusText}`);
    }

    const totalResults = parseInt(firstRes.headers.get('Total-Results') ?? '0', 10);
    const lastVersion = parseInt(firstRes.headers.get('Last-Modified-Version') ?? '0', 10);
    const firstBatch = (await firstRes.json()) as Array<{ data: ZoteroItem }>;

    console.log(`[zotero] ${totalResults} total item(s) in library. Fetching all pages...`);
    const allItems: ZoteroItem[] = firstBatch.map(({ data }) => data);

    for (let start = 100; start < totalResults; start += 100) {
      const pageRes = await fetch(
        `${ZOTERO_API_BASE}/users/${userID}/items?format=json&include=data&limit=100&start=${start}`,
        { headers }
      );
      if (!pageRes.ok) {
        throw new Error(
          `Zotero API pagination error at start=${start}: ${pageRes.status} ${pageRes.statusText}`
        );
      }
      const pageBatch = (await pageRes.json()) as Array<{ data: ZoteroItem }>;
      allItems.push(...pageBatch.map(({ data }) => data));
    }

    const collections = await fetchCollections();

    const fullCache: ZoteroLibraryCache = {
      version: lastVersion,
      items: allItems,
      collections,
      fetchedAt: new Date().toISOString(),
    };
    writeCache(fullCache);
    console.log(
      `[zotero] Full fetch complete. ${allItems.length} item(s) cached at version ${lastVersion}.`
    );
    return allItems;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[zotero] Warning: Fetch failed — ${message}`);
    if (cache) {
      console.warn('[zotero] Falling back to cached data.');
      return cache.items;
    }
    console.warn('[zotero] No cache available. Returning empty array.');
    return [];
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const force = process.argv.includes('--force');
  fetchZoteroLibrary({ force }).then((items) => {
    console.log(`[zotero] Done. ${items.length} item(s) in library.`);
  });
}
