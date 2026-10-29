/**
 * Guards for the unlisted snapshot links under /s/ (see docs/snapshots.md):
 *  - netlify.toml keeps the /s/* noindex header block;
 *  - nothing in src/ links to /s/;
 *  - /s/ stays out of the sitemap, and there is no Astro route under /s/
 *    (Pagefind indexes built HTML only, so no HTML may ever live there);
 *  - every file under public/s/ is a PDF in a token folder;
 *  - add.mjs and retire.mjs behave, including their refusal paths.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// @ts-expect-error plain .mjs module without type declarations
import { addSnapshots, newToken, toCsv, TOKEN_RE } from './add.mjs';
// @ts-expect-error plain .mjs module without type declarations
import { retireSnapshots, tokensFromCsv } from './retire.mjs';

const REPO = path.resolve(__dirname, '../..');
const SNAPSHOTS = path.join(REPO, 'public', 's');
const tmpRoots: string[] = [];

function tmp(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  tmpRoots.push(dir);
  return dir;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const PDF = Buffer.from('%PDF-1.7\n%test\n');

afterAll(() => {
  for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true });
});

describe('/s/ snapshot guards', () => {
  it('netlify.toml keeps the /s/* block with X-Robots-Tag noindex, nofollow, noarchive', () => {
    const toml = fs.readFileSync(path.join(REPO, 'netlify.toml'), 'utf8');
    const block = toml.match(
      /\[\[headers\]\]\s*\n\s*for = "\/s\/\*"\s*\n\s*\[headers\.values\]([\s\S]*?)(?=\n\[\[|\n# ─|$)/
    );
    expect(block, 'no [[headers]] block for "/s/*"').not.toBeNull();
    expect(block![1]).toMatch(/X-Robots-Tag\s*=\s*"noindex, nofollow, noarchive"/);
  });

  it('nothing in src/ links to /s/', () => {
    const linkRe = /(?:zktheory\.org\/s\/|["'(=`]\/s\/)/;
    const offenders = walk(path.join(REPO, 'src'))
      .filter((f) => /\.(astro|mdx?|tsx?|jsx?|json|css)$/.test(f))
      .filter((f) => linkRe.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(REPO, f));
    expect(offenders).toEqual([]);
  });

  it('the sitemap filter excludes /s/', () => {
    const config = fs.readFileSync(path.join(REPO, 'astro.config.mjs'), 'utf8');
    expect(config).toMatch(/sitemap\(\{\s*filter:.*startsWith\('\/s\/'\)/);
  });

  it('there is no Astro route under /s/', () => {
    expect(fs.existsSync(path.join(REPO, 'src', 'pages', 's'))).toBe(false);
    expect(fs.existsSync(path.join(REPO, 'src', 'pages', 's.astro'))).toBe(false);
  });

  it('every file under public/s/ is a PDF directly inside a token folder', () => {
    const problems = walk(SNAPSHOTS)
      .map((f) => path.relative(SNAPSHOTS, f))
      .filter((rel) => {
        const parts = rel.split(path.sep);
        if (parts.length !== 2 || !TOKEN_RE.test(parts[0]) || !parts[1].endsWith('.pdf'))
          return true;
        const head = fs.readFileSync(path.join(SNAPSHOTS, rel)).subarray(0, 5).toString('latin1');
        return head !== '%PDF-';
      });
    expect(problems).toEqual([]);
  });
});

describe('add.mjs', () => {
  it('makes 10-character [a-z0-9] tokens and never reuses a taken one', () => {
    const taken = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const t = newToken(taken);
      expect(t).toMatch(TOKEN_RE);
      expect(taken.has(t)).toBe(false);
      taken.add(t);
    }
  });

  it('copies each PDF to its own token folder and prints a CSV', () => {
    const src = tmp('snap-src');
    const out = tmp('snap-out');
    fs.mkdirSync(path.join(out, 'aaaaaaaaaa'));
    fs.writeFileSync(path.join(src, 'snapshot-one.pdf'), PDF);
    fs.writeFileSync(path.join(src, 'snapshot-two.pdf'), PDF);

    const rows = addSnapshots(src, { snapshotDir: out });
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r: { token: string }) => r.token)).size).toBe(2);
    for (const r of rows) {
      expect(r.token).not.toBe('aaaaaaaaaa');
      expect(fs.existsSync(path.join(out, r.token, r.file))).toBe(true);
      expect(r.url).toBe(`https://zktheory.org/s/${r.token}/${r.file}`);
    }
    expect(toCsv(rows).split('\n')[0]).toBe('file,token,url');
  });

  it('NEGATIVE CONTROL: refuses a non-PDF and copies nothing', () => {
    const src = tmp('snap-src');
    const out = tmp('snap-out');
    fs.writeFileSync(path.join(src, 'good.pdf'), PDF);
    fs.writeFileSync(path.join(src, 'fake.pdf'), '<html></html>');
    expect(() => addSnapshots(src, { snapshotDir: out })).toThrow(/fake\.pdf: not a PDF/);
    expect(fs.readdirSync(out)).toEqual([]);
  });

  it('NEGATIVE CONTROL: refuses HTML or unsafe file names', () => {
    const src = tmp('snap-src');
    fs.writeFileSync(path.join(src, 'index.html'), '<html></html>');
    expect(() => addSnapshots(src, { snapshotDir: tmp('snap-out') })).toThrow(
      /index\.html: name must/
    );
  });

  it('dry run copies nothing', () => {
    const src = tmp('snap-src');
    const out = tmp('snap-out');
    fs.writeFileSync(path.join(src, 'one.pdf'), PDF);
    expect(addSnapshots(src, { snapshotDir: out, dryRun: true })).toHaveLength(1);
    expect(fs.readdirSync(out)).toEqual([]);
  });
});

describe('retire.mjs', () => {
  it('removes the folders for the given tokens, from a list or the add.mjs CSV', () => {
    const src = tmp('snap-src');
    const out = tmp('snap-out');
    fs.writeFileSync(path.join(src, 'one.pdf'), PDF);
    fs.writeFileSync(path.join(src, 'two.pdf'), PDF);
    const rows = addSnapshots(src, { snapshotDir: out });
    const tokens = tokensFromCsv(toCsv(rows));
    expect(tokens).toEqual(rows.map((r: { token: string }) => r.token));

    retireSnapshots([tokens[0]], { snapshotDir: out });
    expect(fs.readdirSync(out)).toEqual([tokens[1]]);
  });

  it('NEGATIVE CONTROL: refuses a bad or unknown token and removes nothing', () => {
    const out = tmp('snap-out');
    fs.mkdirSync(path.join(out, 'abcdefghij'));
    expect(() => retireSnapshots(['abcdefghij', '../etc'], { snapshotDir: out })).toThrow(
      /not a snapshot token/
    );
    expect(() => retireSnapshots(['abcdefghij', 'zzzzzzzzzz'], { snapshotDir: out })).toThrow(
      /no folder/
    );
    expect(fs.readdirSync(out)).toEqual(['abcdefghij']);
  });
});
