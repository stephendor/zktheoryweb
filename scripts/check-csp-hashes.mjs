/**
 * check-csp-hashes.mjs: after `astro build`, fail when an inline <script> that
 * the build emitted has a SHA-256 hash that netlify.toml's Content-Security-Policy
 * script-src does not list. Such a script is blocked by the browser in
 * production but runs fine in dev and preview, so nothing else notices.
 *
 * Hash extraction is shared with scripts/gen-csp-hashes.mjs (the generator that
 * prints the replacement policy).
 *
 * Usage: node scripts/check-csp-hashes.mjs [distDir] [netlifyToml]
 * Exit code 1 when any emitted hash is missing from the policy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectInlineScriptHashes } from './lib/inline-script-hashes.mjs';

export function checkCspHashes(distDir, tomlPath) {
  const emittedMap = collectInlineScriptHashes(distDir);
  const toml = fs.readFileSync(tomlPath, 'utf8');
  const policyHashes = new Set([...toml.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((m) => m[1]));
  const missing = [];
  for (const [hash, file] of emittedMap) {
    if (!policyHashes.has(hash)) missing.push({ hash: `sha256-${hash}`, file });
  }
  const stale = [...policyHashes].filter((h) => !emittedMap.has(h)).map((h) => `sha256-${h}`);
  return { emitted: emittedMap.size, missing, stale };
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const dist = path.resolve(process.argv[2] ?? 'dist');
  const toml = path.resolve(process.argv[3] ?? 'netlify.toml');
  if (!fs.existsSync(dist)) {
    console.error(`check-csp-hashes: FAIL. ${dist} does not exist (run after the build).`);
    process.exit(1);
  }
  const { emitted, missing, stale } = checkCspHashes(dist, toml);
  if (emitted === 0) {
    console.error(
      'check-csp-hashes: FAIL. No inline scripts found in dist; the extraction is vacuous.'
    );
    process.exit(1);
  }
  if (missing.length > 0) {
    console.error(
      `check-csp-hashes: FAIL. ${missing.length} emitted inline-script hash(es) absent from ${toml}:`
    );
    for (const m of missing) console.error(`  '${m.hash}'  (first seen in ${m.file})`);
    console.error('Run `node scripts/gen-csp-hashes.mjs` and update script-src in netlify.toml.');
    process.exit(1);
  }
  console.log(
    `check-csp-hashes: OK (${emitted} emitted inline-script hashes all present in policy)`
  );
  if (stale.length > 0)
    console.log(
      `  note: ${stale.length} hash(es) in netlify.toml are no longer emitted (harmless)`
    );
}
