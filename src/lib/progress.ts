/**
 * src/lib/progress.ts — Task 4.2 — Agent_Schema_Platform
 *
 * localStorage-based learning progress utilities.
 *
 * ── localStorage schema ──────────────────────────────────────────────────────
 *
 * One entry per learning path, keyed as:
 *   `zktheory:progress:{pathSlug}`
 *   e.g. `zktheory:progress:topology-social-scientists`
 *
 * Value shape (JSON-serialised):
 * {
 *   version:          1,
 *   completedModules: string[],   // module identifiers (String(moduleNumber))
 *   lastVisited:      string | null,  // last-visited module identifier
 *   updatedAt:        string,         // ISO 8601 timestamp
 * }
 *
 * ── Version policy ───────────────────────────────────────────────────────────
 * If the stored object lacks a `version` field, or its `version` differs from
 * CURRENT_VERSION, the stored record is discarded and re-initialised with
 * defaults. No migration is attempted (migration path deferred).
 *
 * ── SSR safety ───────────────────────────────────────────────────────────────
 * All functions guard against `typeof window === 'undefined'` so they are safe
 * to import and call in Astro SSR contexts. `loadProgress` returns a default
 * value; `saveProgress` is a no-op when running server-side.
 */

const STORAGE_KEY_PREFIX = 'zktheory:progress:';
const CURRENT_VERSION = 1;

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Stored progress record for a single learning path. */
export interface ProgressData {
  /** Schema version; must equal CURRENT_VERSION for the record to be trusted. */
  version: number;
  /** Ordered list of module identifiers (String(moduleNumber)) that are done. */
  completedModules: string[];
  /** The identifier of the most recently visited module, or null if none. */
  lastVisited: string | null;
  /** ISO 8601 timestamp of the last write. */
  updatedAt: string;
}

/** Associates a ProgressData record with its owning path slug. */
export interface PathProgress {
  pathSlug: string;
  data: ProgressData;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns a new, empty ProgressData with the current timestamp. */
function defaultProgressData(): ProgressData {
  return {
    version: CURRENT_VERSION,
    completedModules: [],
    lastVisited: null,
    updatedAt: new Date().toISOString(),
  };
}

/** Derives the localStorage key for a given path slug. */
function storageKey(pathSlug: string): string {
  return `${STORAGE_KEY_PREFIX}${pathSlug}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * loadProgress
 *
 * Reads stored progress for `pathSlug` from localStorage.
 * Returns a default (empty) ProgressData when:
 *   - running server-side (`typeof window === 'undefined'`)
 *   - no entry exists for the key
 *   - the stored JSON is malformed or cannot be parsed
 *   - the stored object's `version` does not equal CURRENT_VERSION
 */
export function loadProgress(pathSlug: string): ProgressData {
  if (typeof window === 'undefined') return defaultProgressData();

  try {
    const raw = window.localStorage.getItem(storageKey(pathSlug));
    if (raw === null) return defaultProgressData();

    const parsed = JSON.parse(raw) as unknown;

    // Reject anything that isn't an object literal with the expected version.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed) ||
      (parsed as Record<string, unknown>)['version'] !== CURRENT_VERSION
    ) {
      return defaultProgressData();
    }

    return parsed as ProgressData;
  } catch {
    // JSON.parse threw; treat as absent / corrupt.
    return defaultProgressData();
  }
}

/**
 * saveProgress
 *
 * Serialises `data` to localStorage under the key for `pathSlug`.
 * No-ops when running server-side.
 */
export function saveProgress(pathSlug: string, data: ProgressData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(pathSlug), JSON.stringify(data));
}

/**
 * getPathPercentage
 *
 * Returns the completion percentage as an integer in the range [0, 100].
 * Returns 0 if `totalModules` is 0 or negative.
 */
export function getPathPercentage(data: ProgressData, totalModules: number): number {
  if (totalModules <= 0) return 0;
  const raw = (data.completedModules.length / totalModules) * 100;
  return Math.min(100, Math.round(raw));
}

/**
 * isModuleComplete
 *
 * Returns true if `moduleSlug` (String(moduleNumber)) appears in the stored
 * completedModules array, false otherwise.
 */
export function isModuleComplete(data: ProgressData, moduleSlug: string): boolean {
  return data.completedModules.includes(moduleSlug);
}
