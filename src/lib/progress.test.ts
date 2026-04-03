/**
 * src/lib/progress.test.ts — Task 4.2 — Agent_Schema_Platform
 *
 * Vitest unit tests for the localStorage progress utilities in progress.ts.
 *
 * localStorage is mocked via vi.stubGlobal — no real browser storage involved.
 * All tests run in the happy-dom environment configured in vitest.config.ts.
 *
 * Test coverage:
 *   loadProgress   — default when absent; round-trip after save; corrupt JSON;
 *                    version mismatch discard; SSR guard (window undefined)
 *   saveProgress   — round-trip; SSR guard no-op
 *   getPathPercentage — 0 modules done; partial; full; zero total guard
 *   isModuleComplete  — true when present; false when absent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadProgress,
  saveProgress,
  getPathPercentage,
  isModuleComplete,
} from './progress';
import type { ProgressData } from './progress';

// ─── localStorage mock helpers ────────────────────────────────────────────────

/** Minimal in-memory localStorage stub compatible with the Storage interface. */
function createLocalStorageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key]! : null),
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => { delete store[k]; }); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

const PATH_SLUG = 'topology-social-scientists';

// ─── Setup / teardown ─────────────────────────────────────────────────────────

let mockStorage: Storage;

beforeEach(() => {
  mockStorage = createLocalStorageMock();
  vi.stubGlobal('localStorage', mockStorage);
  // Ensure window is defined (happy-dom provides it; stub just in case).
  if (typeof window === 'undefined') {
    vi.stubGlobal('window', { localStorage: mockStorage });
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── loadProgress ─────────────────────────────────────────────────────────────

describe('loadProgress', () => {
  it('returns a default ProgressData when no entry exists', () => {
    const result = loadProgress(PATH_SLUG);
    expect(result.version).toBe(1);
    expect(result.completedModules).toEqual([]);
    expect(result.lastVisited).toBeNull();
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns stored data when a valid entry exists', () => {
    const stored: ProgressData = {
      version: 1,
      completedModules: ['1', '2'],
      lastVisited: '2',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockStorage.setItem(`zktheory:progress:${PATH_SLUG}`, JSON.stringify(stored));

    const result = loadProgress(PATH_SLUG);
    expect(result.completedModules).toEqual(['1', '2']);
    expect(result.lastVisited).toBe('2');
  });

  it('returns default when stored JSON is corrupt', () => {
    mockStorage.setItem(`zktheory:progress:${PATH_SLUG}`, 'not-valid-json{{{');
    const result = loadProgress(PATH_SLUG);
    expect(result.completedModules).toEqual([]);
  });

  it('returns default when stored object has wrong version', () => {
    const outdated = { version: 99, completedModules: ['1'], lastVisited: null, updatedAt: '' };
    mockStorage.setItem(`zktheory:progress:${PATH_SLUG}`, JSON.stringify(outdated));
    const result = loadProgress(PATH_SLUG);
    expect(result.completedModules).toEqual([]);
  });

  it('returns default when stored object has no version field', () => {
    const noVersion = { completedModules: ['1'], lastVisited: null, updatedAt: '' };
    mockStorage.setItem(`zktheory:progress:${PATH_SLUG}`, JSON.stringify(noVersion));
    const result = loadProgress(PATH_SLUG);
    expect(result.completedModules).toEqual([]);
  });

  it('returns default when window is undefined (SSR guard)', () => {
    vi.stubGlobal('window', undefined);
    const result = loadProgress(PATH_SLUG);
    expect(result.completedModules).toEqual([]);
  });
});

// ─── saveProgress ─────────────────────────────────────────────────────────────

describe('saveProgress', () => {
  it('persists data that can be re-loaded by loadProgress (round-trip)', () => {
    const data: ProgressData = {
      version: 1,
      completedModules: ['3', '4', '5'],
      lastVisited: '5',
      updatedAt: '2026-04-01T12:00:00.000Z',
    };
    saveProgress(PATH_SLUG, data);
    const reloaded = loadProgress(PATH_SLUG);
    expect(reloaded.completedModules).toEqual(['3', '4', '5']);
    expect(reloaded.lastVisited).toBe('5');
    expect(reloaded.updatedAt).toBe('2026-04-01T12:00:00.000Z');
  });

  it('is a no-op when window is undefined (SSR guard)', () => {
    vi.stubGlobal('window', undefined);
    const data: ProgressData = {
      version: 1,
      completedModules: ['1'],
      lastVisited: null,
      updatedAt: new Date().toISOString(),
    };
    // Should not throw.
    expect(() => saveProgress(PATH_SLUG, data)).not.toThrow();
  });
});

// ─── getPathPercentage ────────────────────────────────────────────────────────

describe('getPathPercentage', () => {
  it('returns 0 when no modules are complete', () => {
    const data: ProgressData = {
      version: 1, completedModules: [], lastVisited: null, updatedAt: '',
    };
    expect(getPathPercentage(data, 8)).toBe(0);
  });

  it('returns the correct integer percentage for partial completion', () => {
    const data: ProgressData = {
      version: 1, completedModules: ['1', '2'], lastVisited: '2', updatedAt: '',
    };
    // 2/8 = 25%
    expect(getPathPercentage(data, 8)).toBe(25);
  });

  it('returns 100 when all modules are complete', () => {
    const data: ProgressData = {
      version: 1,
      completedModules: ['1', '2', '3', '4', '5', '6', '7', '8'],
      lastVisited: '8',
      updatedAt: '',
    };
    expect(getPathPercentage(data, 8)).toBe(100);
  });

  it('returns 0 when totalModules is 0 (guard against divide-by-zero)', () => {
    const data: ProgressData = {
      version: 1, completedModules: [], lastVisited: null, updatedAt: '',
    };
    expect(getPathPercentage(data, 0)).toBe(0);
  });

  it('caps at 100 even if completedModules exceeds totalModules', () => {
    const data: ProgressData = {
      version: 1,
      completedModules: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      lastVisited: '9',
      updatedAt: '',
    };
    expect(getPathPercentage(data, 8)).toBe(100);
  });
});

// ─── isModuleComplete ─────────────────────────────────────────────────────────

describe('isModuleComplete', () => {
  const data: ProgressData = {
    version: 1,
    completedModules: ['1', '3'],
    lastVisited: '3',
    updatedAt: '',
  };

  it('returns true when the module slug is in completedModules', () => {
    expect(isModuleComplete(data, '1')).toBe(true);
    expect(isModuleComplete(data, '3')).toBe(true);
  });

  it('returns false when the module slug is not in completedModules', () => {
    expect(isModuleComplete(data, '2')).toBe(false);
    expect(isModuleComplete(data, '4')).toBe(false);
  });

  it('returns false for an empty completedModules array', () => {
    const empty: ProgressData = {
      version: 1, completedModules: [], lastVisited: null, updatedAt: '',
    };
    expect(isModuleComplete(empty, '1')).toBe(false);
  });
});
