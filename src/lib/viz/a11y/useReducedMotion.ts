/**
 * useReducedMotion.ts — Task 3.1 — Agent_Interactive_Core
 *
 * React hook that returns true when the user has requested reduced motion
 * via their OS/browser accessibility setting.
 *
 * SSR safety: window.matchMedia is unavailable during Astro's build-time
 * SSR pass. The hook defaults to `false` on the initial render so server
 * output is deterministic. After hydration, useEffect reads the real
 * preference and updates the state.
 *
 * The hook also subscribes to `change` events on the media query list so
 * it stays in sync if the user toggles the preference mid-session.
 *
 * Usage:
 *   const reduced = useReducedMotion();
 *   const duration = reduced ? 0 : 400;
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns `true` if `prefers-reduced-motion: reduce` is active.
 * Safe to call during SSR — always returns `false` until mounted.
 */
export function useReducedMotion(): boolean {
  // Default false: no assumption about the user's preference during SSR.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);

    // Take an immediate reading on mount.
    setPrefersReducedMotion(mq.matches);

    // Stay in sync with live preference changes (e.g. toggled in OS settings
    // while the page is open).
    const handleChange = (e: MediaQueryListEvent): void => {
      setPrefersReducedMotion(e.matches);
    };

    mq.addEventListener('change', handleChange);
    return () => {
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
