/**
 * The build-time Zotero refresh is opt-in.
 *
 * `astro build` used to call fetchZoteroLibrary() on every run. With credentials present that rewrote
 * the tracked src/data/zotero-library.json (version 682 → 1806, about 115 KB), so a routine "check it
 * builds" left an unrelated bibliography refresh waiting to ride along on the next commit. A
 * verification step must not mutate tracked state.
 *
 * The refresh now runs only when asked for (ZOTERO_REFRESH=1), or on Netlify (NETLIFY=true), whose
 * build output is never committed. `npm run fetch:zotero` stays the deliberate local refresh.
 */

export type BuildEnv = Record<string, string | undefined>;

export function shouldRefreshZotero(env: BuildEnv): boolean {
  return env.ZOTERO_REFRESH === '1' || env.NETLIFY === 'true';
}

/** Run the refresh only when the environment opts in; returns whether it ran. */
export async function zoteroBuildStart(
  env: BuildEnv,
  refresh: () => Promise<unknown>,
  log: (message: string) => void = console.log,
): Promise<boolean> {
  if (!shouldRefreshZotero(env)) {
    log('[zotero] Build hook: using the committed cache (set ZOTERO_REFRESH=1 to refresh it)');
    return false;
  }
  await refresh();
  return true;
}
