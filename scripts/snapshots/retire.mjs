/**
 * retire.mjs: remove unlisted snapshot folders from public/s/.
 *
 * Takes tokens, or the CSV printed by add.mjs (any file ending .csv; the
 * "token" column is used). Every token is checked before anything is
 * removed: it must look like a token and its folder must exist.
 *
 * Usage: node scripts/snapshots/retire.mjs <token|file.csv> [...] [--dry-run]
 * See docs/snapshots.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SNAPSHOT_DIR, TOKEN_RE } from './add.mjs';

export function tokensFromCsv(text) {
  const [header, ...lines] = text.split(/\r?\n/).filter((l) => l.trim());
  const col = header
    .split(',')
    .map((h) => h.trim())
    .indexOf('token');
  if (col === -1) throw new Error('CSV has no "token" column');
  return lines.map((l) => l.split(',')[col].trim());
}

export function retireSnapshots(
  tokens,
  { snapshotDir = DEFAULT_SNAPSHOT_DIR, dryRun = false } = {}
) {
  const unique = [...new Set(tokens)];
  const problems = [];
  for (const t of unique) {
    if (!TOKEN_RE.test(t)) problems.push(`${t}: not a snapshot token`);
    else if (!fs.existsSync(path.join(snapshotDir, t)))
      problems.push(`${t}: no folder in ${snapshotDir}`);
  }
  if (problems.length) throw new Error(`Nothing removed:\n  ${problems.join('\n  ')}`);
  if (!dryRun) for (const t of unique) fs.rmSync(path.join(snapshotDir, t), { recursive: true });
  return unique;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const inputs = args.filter((a) => a !== '--dry-run');
  if (inputs.length === 0) {
    console.error('Usage: node scripts/snapshots/retire.mjs <token|file.csv> [...] [--dry-run]');
    process.exit(1);
  }
  try {
    const tokens = inputs.flatMap((a) =>
      a.endsWith('.csv') ? tokensFromCsv(fs.readFileSync(a, 'utf8')) : [a]
    );
    const removed = retireSnapshots(tokens, { dryRun });
    for (const t of removed) console.log(`${dryRun ? 'would remove' : 'removed'} public/s/${t}/`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
