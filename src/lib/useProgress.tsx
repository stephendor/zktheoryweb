/**
 * src/lib/useProgress.tsx — Task 4.2 — Agent_Schema_Platform
 *
 * React context and hook for learning progress tracking.
 *
 * Architecture:
 *  - ProgressContext holds the state for one learning path.
 *  - ProgressProvider initialises state from localStorage via loadProgress()
 *    inside a useEffect so it never runs on the server.
 *  - useProgress() is the consumer hook — throws if used outside a provider.
 *
 * SSR safety:
 *  - All localStorage reads/writes happen exclusively inside useEffect, which
 *    React only invokes client-side. The initial render state is always the
 *    default (empty) value until hydration completes.
 *
 * Usage pattern (client:only="react" islands):
 *
 *   <ProgressProvider pathSlug="topology-social-scientists" totalModules={8}>
 *     <MyComponent />
 *   </ProgressProvider>
 *
 * Inside MyComponent:
 *
 *   const { isComplete, markComplete, pathPercentage } = useProgress();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loadProgress,
  saveProgress,
  getPathPercentage,
  isModuleComplete,
} from './progress';
import type { ProgressData } from './progress';

// ─── Context shape ────────────────────────────────────────────────────────────

interface ProgressContextValue {
  /** Set of module identifiers (String(moduleNumber)) the learner has completed. */
  completedModules: Set<string>;
  /** Mark a module as complete and persist to localStorage. */
  markComplete: (moduleSlug: string) => void;
  /** Remove a module from completed set and persist to localStorage. */
  markIncomplete: (moduleSlug: string) => void;
  /** Convenience: returns true if the given module identifier is complete. */
  isComplete: (moduleSlug: string) => boolean;
  /**
   * Returns the integer completion percentage (0–100) for the given path.
   * `pathSlug` must match the one this provider was initialised with.
   */
  pathPercentage: (pathSlug: string, totalModules: number) => number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProgressProviderProps {
  /** The slug of the learning path being tracked. */
  pathSlug: string;
  children: React.ReactNode;
}

export function ProgressProvider({ pathSlug, children }: ProgressProviderProps) {
  // Initialise with an empty default; loadProgress() runs in useEffect
  // so it never executes during SSR.
  const [data, setData] = useState<ProgressData>({
    version: 1,
    completedModules: [],
    lastVisited: null,
    updatedAt: new Date().toISOString(),
  });

  // Hydrate from localStorage on mount (client-side only).
  useEffect(() => {
    setData(loadProgress(pathSlug));
  }, [pathSlug]);

  // Derive a Set<string> for O(1) membership checks.
  const completedModules = useMemo(
    () => new Set(data.completedModules),
    [data.completedModules],
  );

  const markComplete = useCallback(
    (moduleSlug: string) => {
      setData((prev) => {
        if (isModuleComplete(prev, moduleSlug)) return prev;
        const next: ProgressData = {
          ...prev,
          completedModules: [...prev.completedModules, moduleSlug],
          lastVisited: moduleSlug,
          updatedAt: new Date().toISOString(),
        };
        saveProgress(pathSlug, next);
        return next;
      });
    },
    [pathSlug],
  );

  const markIncomplete = useCallback(
    (moduleSlug: string) => {
      setData((prev) => {
        if (!isModuleComplete(prev, moduleSlug)) return prev;
        const next: ProgressData = {
          ...prev,
          completedModules: prev.completedModules.filter((s) => s !== moduleSlug),
          updatedAt: new Date().toISOString(),
        };
        saveProgress(pathSlug, next);
        return next;
      });
    },
    [pathSlug],
  );

  const isComplete = useCallback(
    (moduleSlug: string) => completedModules.has(moduleSlug),
    [completedModules],
  );

  const pathPercentage = useCallback(
    (_pathSlug: string, totalModules: number) =>
      getPathPercentage(data, totalModules),
    [data],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ completedModules, markComplete, markIncomplete, isComplete, pathPercentage }),
    [completedModules, markComplete, markIncomplete, isComplete, pathPercentage],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * useProgress
 *
 * Returns the ProgressContextValue for the nearest ProgressProvider ancestor.
 * Throws an error if called outside a ProgressProvider.
 */
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (ctx === null) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return ctx;
}
