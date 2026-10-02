/**
 * check-client-bundle.mjs: assert on the emitted client bundle (dist/_astro/*.js)
 * that build-time-only data did not reach the browser.
 *
 * src/lib/bibliography.ts imports the whole Zotero cache (src/data/zotero-library.json,
 * including private research notes) and carries a comment saying never to import it
 * from client code. That rule used to hold only because the bundler tree-shook the
 * import away; a toolchain change would revoke it silently. This check asserts it
 * on the artifact instead:
 *
 *   1. no chunk contains a Zotero item key as a quoted string literal;
 *   2. no chunk contains a distinctive fragment of a Zotero note;
 *   3. no non-vendor chunk (anything not named vendor-*) exceeds
 *      NON_VENDOR_BUDGET_BYTES.
 *
 * The decisive checks are 1 and 2. Check 3 is the cheap general form: the full
 * Zotero JSON is ~450 KB, so inlining it into any island busts the budget.
 *
 * Usage: node scripts/check-client-bundle.mjs [distDir] [projectRoot]
 * Exit code 1 on any finding.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Size budget for a single non-vendor chunk. Measured on 2026-10-02 (Astro 7 /
 * Vite 8 build): the largest non-vendor chunk is PersistenceDiagramBuilderWrapper
 * at 185 KB (the React DOM client runtime, `client.*`, is next at 181 KB). 256 KiB
 * leaves roughly 40% headroom over the largest and sits well below the 454 KB
 * Zotero cache. vendor-* chunks (three.js, 748 KB) are exempt by design.
 */
export const NON_VENDOR_BUDGET_BYTES = 256 * 1024;

const NOTE_FRAGMENT_LEN = 48;
const MIN_NOTE_TEXT_LEN = 24;

function stripHtml(s) {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strings that must never appear in client JS, derived from the Zotero cache. */
export function loadSentinels(projectRoot) {
  const file = path.join(projectRoot, 'src/data/zotero-library.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const items = Array.isArray(data.items) ? data.items : [];
  const keys = [
    ...new Set(items.map((i) => i.key).filter((k) => typeof k === 'string' && k.length >= 6)),
  ];
  const notes = [];
  for (const item of items) {
    if (item.itemType !== 'note' || typeof item.note !== 'string') continue;
    const text = stripHtml(item.note);
    if (text.length < MIN_NOTE_TEXT_LEN) continue;
    // A mid-text fragment, so a bundle that keeps only part of a note still matches.
    const start = Math.min(
      Math.floor(text.length / 4),
      Math.max(0, text.length - NOTE_FRAGMENT_LEN)
    );
    notes.push({ key: item.key, fragment: text.slice(start, start + NOTE_FRAGMENT_LEN) });
  }
  return { keys, notes };
}

export function checkClientBundle(distDir, projectRoot) {
  const astroDir = path.join(distDir, '_astro');
  const files = fs.existsSync(astroDir)
    ? fs.readdirSync(astroDir).filter((f) => f.endsWith('.js'))
    : [];
  const { keys, notes } = loadSentinels(projectRoot);
  const findings = [];
  for (const file of files) {
    const full = path.join(astroDir, file);
    const code = fs.readFileSync(full, 'utf8');
    for (const key of keys) {
      if (code.includes(`"${key}"`) || code.includes(`'${key}'`) || code.includes(`\`${key}\``)) {
        findings.push({ kind: 'zotero-key', file, detail: `item key ${key}` });
      }
    }
    for (const note of notes) {
      if (code.includes(note.fragment)) {
        findings.push({
          kind: 'zotero-note',
          file,
          detail: `note ${note.key}: "${note.fragment}"`,
        });
      }
    }
    const size = Buffer.byteLength(code);
    if (!file.startsWith('vendor-') && size > NON_VENDOR_BUDGET_BYTES) {
      findings.push({
        kind: 'size',
        file,
        detail: `${size} bytes > budget ${NON_VENDOR_BUDGET_BYTES}`,
      });
    }
  }
  return findings;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const dist = path.resolve(process.argv[2] ?? 'dist');
  const root = path.resolve(process.argv[3] ?? process.cwd());
  const astroDir = path.join(dist, '_astro');
  const jsCount = fs.existsSync(astroDir)
    ? fs.readdirSync(astroDir).filter((f) => f.endsWith('.js')).length
    : 0;
  if (jsCount === 0) {
    console.error(
      `check-client-bundle: FAIL. No JS found in ${astroDir}; the check would be vacuous.`
    );
    process.exit(1);
  }
  const { keys, notes } = loadSentinels(root);
  if (keys.length === 0 || notes.length === 0) {
    console.error(
      'check-client-bundle: FAIL. No Zotero keys or notes loaded; the content check would be vacuous.'
    );
    process.exit(1);
  }
  const findings = checkClientBundle(dist, root);
  if (findings.length > 0) {
    console.error(`check-client-bundle: FAIL. ${findings.length} finding(s) in the client bundle:`);
    for (const f of findings) console.error(`  [${f.kind}] ${f.file}: ${f.detail}`);
    console.error(
      'Client code must not import src/lib/bibliography.ts or src/data/zotero-library.json; pass data as props.'
    );
    process.exit(1);
  }
  console.log(
    `check-client-bundle: OK (${jsCount} chunks; ${keys.length} item keys and ${notes.length} notes absent; ` +
      `non-vendor budget ${NON_VENDOR_BUDGET_BYTES} bytes)`
  );
}
