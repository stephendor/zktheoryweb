/**
 * add.mjs: publish a folder of one-page snapshot PDFs at unlisted links.
 *
 * Each PDF is copied to public/s/<token>/<filename>.pdf, where <token> is 10
 * crypto-random characters from [a-z0-9] that no existing folder uses. A CSV
 * of file,token,url,organisation is printed to stdout, with organisation left
 * blank to fill in by hand. The organisation-to-link map is never written into
 * the repo: keep the CSV outside it.
 *
 * Usage: node scripts/snapshots/add.mjs <folder-of-pdfs> [--dry-run]
 * See docs/snapshots.md.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://zktheory.org';
export const TOKEN_LENGTH = 10;
export const TOKEN_RE = /^[a-z0-9]{10}$/;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** Lower-case letters, digits, dot, dash and underscore; ends in .pdf. */
export const FILENAME_RE = /^[a-z0-9][a-z0-9._-]*\.pdf$/;

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_SNAPSHOT_DIR = path.join(REPO, 'public', 's');

export function newToken(taken) {
  for (;;) {
    let token = '';
    for (let i = 0; i < TOKEN_LENGTH; i++) token += ALPHABET[crypto.randomInt(ALPHABET.length)];
    if (!taken.has(token)) return token;
  }
}

export function existingTokens(snapshotDir) {
  if (!fs.existsSync(snapshotDir)) return new Set();
  return new Set(
    fs
      .readdirSync(snapshotDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  );
}

function isPdf(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(5);
    fs.readSync(fd, head, 0, 5, 0);
    return head.toString('latin1') === '%PDF-';
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Validate every PDF in `sourceDir` first, then copy each one under a fresh
 * token. Throws before copying anything if any file is unsuitable.
 * Returns [{ file, token, url }].
 */
export function addSnapshots(
  sourceDir,
  { snapshotDir = DEFAULT_SNAPSHOT_DIR, dryRun = false } = {}
) {
  const files = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort();
  if (files.length === 0) throw new Error(`No files in ${sourceDir}`);

  const problems = [];
  for (const name of files) {
    if (!FILENAME_RE.test(name))
      problems.push(`${name}: name must be lower-case letters, digits, . _ - and end in .pdf`);
    else if (!isPdf(path.join(sourceDir, name)))
      problems.push(`${name}: not a PDF (no %PDF- header)`);
  }
  if (problems.length) throw new Error(`Nothing copied:\n  ${problems.join('\n  ')}`);

  const taken = existingTokens(snapshotDir);
  const rows = [];
  for (const name of files) {
    const token = newToken(taken);
    taken.add(token);
    if (!dryRun) {
      const dir = path.join(snapshotDir, token);
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(path.join(sourceDir, name), path.join(dir, name), fs.constants.COPYFILE_EXCL);
    }
    rows.push({ file: name, token, url: `${SITE}/s/${token}/${name}` });
  }
  return rows;
}

export function toCsv(rows) {
  // organisation is left blank: filled in by hand, outside the repo.
  return ['file,token,url,organisation', ...rows.map((r) => `${r.file},${r.token},${r.url},`)].join(
    '\n'
  );
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const [source] = args.filter((a) => a !== '--dry-run');
  if (!source) {
    console.error('Usage: node scripts/snapshots/add.mjs <folder-of-pdfs> [--dry-run]');
    process.exit(1);
  }
  try {
    console.log(toCsv(addSnapshots(path.resolve(source), { dryRun })));
    if (dryRun) console.error('(dry run: nothing copied)');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
