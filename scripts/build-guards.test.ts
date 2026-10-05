/**
 * Negative controls for the three build guards (override range, CSP hashes,
 * client bundle). Each guard is exercised on a passing fixture and on a
 * fixture that must fail, so a guard that can no longer fire is itself a
 * test failure.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';

// @ts-expect-error plain .mjs module without type declarations
import { checkOverrides } from './check-overrides.mjs';
// @ts-expect-error plain .mjs module without type declarations
import { checkCspHashes } from './check-csp-hashes.mjs';
// @ts-expect-error plain .mjs module without type declarations
import { checkClientBundle, NON_VENDOR_BUDGET_BYTES } from './check-client-bundle.mjs';

const REPO = path.resolve(__dirname, '..');
const tmpRoots: string[] = [];

function tmp(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  tmpRoots.push(dir);
  return dir;
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

afterAll(() => {
  for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true });
});

// ─── 1. override range ───────────────────────────────────────────────────────

function overrideFixture(installedVite: string): string {
  const root = tmp('overrides');
  writeJson(path.join(root, 'package.json'), {
    name: 'fixture',
    dependencies: { astro: '^7.0.0' },
    overrides: { vite: '>=5.0.0' },
  });
  writeJson(path.join(root, 'node_modules/astro/package.json'), {
    name: 'astro',
    version: '7.0.0',
    dependencies: { vite: '^8.0.13' },
  });
  writeJson(path.join(root, 'node_modules/vite/package.json'), {
    name: 'vite',
    version: installedVite,
  });
  return root;
}

describe('check-overrides', () => {
  it('passes when the installed version satisfies the owner range', () => {
    expect(checkOverrides(overrideFixture('8.3.1'))).toEqual([]);
  });

  it('NEGATIVE CONTROL: fails when the installed version is outside the owner range', () => {
    const violations = checkOverrides(overrideFixture('9.0.0'));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      override: 'vite',
      owner: 'astro',
      range: '^8.0.13',
      installed: '9.0.0',
    });
  });

  it('resolves "$name" overrides and fails on an out-of-range nested install', () => {
    const root = tmp('overrides-nested');
    writeJson(path.join(root, 'package.json'), {
      name: 'fixture',
      dependencies: { yaml: '^2.8.3', consumer: '^1.0.0' },
      overrides: { yaml: '$yaml' },
    });
    writeJson(path.join(root, 'node_modules/yaml/package.json'), {
      name: 'yaml',
      version: '2.8.3',
    });
    writeJson(path.join(root, 'node_modules/consumer/package.json'), {
      name: 'consumer',
      version: '1.0.0',
      dependencies: { yaml: '^1.10.0' },
    });
    const violations = checkOverrides(root);
    expect(violations.map((v: { owner: string }) => v.owner)).toEqual(['consumer']);
  });

  it('a reviewed exception waives exactly one pair at exactly one version', () => {
    const root = overrideFixture('9.0.0');
    const pkgFile = path.join(root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    pkg.overrideRangeExceptions = [
      { override: 'vite', owner: 'astro', installed: '9.0.0', reason: 'reviewed' },
    ];
    writeJson(pkgFile, pkg);
    expect(checkOverrides(root)).toEqual([]);
    // the installed version moves: the waiver no longer applies
    writeJson(path.join(root, 'node_modules/vite/package.json'), {
      name: 'vite',
      version: '9.1.0',
    });
    expect(checkOverrides(root).some((v: { stale?: boolean }) => !v.stale)).toBe(true);
  });

  it('NEGATIVE CONTROL: a stale exception (no violation left) is reported', () => {
    const root = overrideFixture('8.3.1');
    const pkgFile = path.join(root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    pkg.overrideRangeExceptions = [
      { override: 'vite', owner: 'astro', installed: '9.0.0', reason: 'reviewed' },
    ];
    writeJson(pkgFile, pkg);
    expect(checkOverrides(root)).toEqual([expect.objectContaining({ stale: true })]);
  });

  it('passes on this repository today', () => {
    expect(checkOverrides(REPO)).toEqual([]);
  });

  it('CLI exits non-zero on the failing fixture and zero on the passing one', () => {
    const script = path.join(REPO, 'scripts/check-overrides.mjs');
    const bad = spawnSync(process.execPath, [script, overrideFixture('9.0.0')], {
      encoding: 'utf8',
    });
    expect(bad.status).toBe(1);
    const good = spawnSync(process.execPath, [script, overrideFixture('8.3.1')], {
      encoding: 'utf8',
    });
    expect(good.status).toBe(0);
  });
});

// ─── 2. CSP hashes ───────────────────────────────────────────────────────────

const SCRIPT_A = 'window.a=1;if(1<2){window.b=2}';
const SCRIPT_B = 'document.title="x"';
const sha = (body: string) => crypto.createHash('sha256').update(body).digest('base64');

function cspFixture(hashesInToml: string[]): { dist: string; toml: string } {
  const root = tmp('csp');
  const dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(dist, 'sub'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), `<html><script>${SCRIPT_A}</script></html>`);
  fs.writeFileSync(
    path.join(dist, 'sub/index.html'),
    `<html><script>${SCRIPT_B}</script><script type="application/ld+json">{"a":1}</script></html>`
  );
  const toml = path.join(root, 'netlify.toml');
  const values = hashesInToml.map((h) => `'sha256-${h}'`).join(' ');
  fs.writeFileSync(
    toml,
    `[[headers]]\n  for = "/*"\n  [headers.values]\n    Content-Security-Policy = "default-src 'self'; script-src 'self' ${values}; style-src 'self'"\n`
  );
  return { dist, toml };
}

describe('check-csp-hashes', () => {
  it('passes when every emitted inline-script hash is in netlify.toml', () => {
    const { dist, toml } = cspFixture([sha(SCRIPT_A), sha(SCRIPT_B)]);
    const result = checkCspHashes(dist, toml);
    expect(result.missing).toEqual([]);
    expect(result.emitted).toBe(2);
  });

  it('NEGATIVE CONTROL: fails when one emitted hash is absent from netlify.toml', () => {
    const { dist, toml } = cspFixture([sha(SCRIPT_A)]);
    const result = checkCspHashes(dist, toml);
    expect(result.missing).toEqual([
      { hash: `sha256-${sha(SCRIPT_B)}`, file: path.join('sub', 'index.html') },
    ]);
  });

  it('CLI exits non-zero when a hash is missing', () => {
    const { dist, toml } = cspFixture([sha(SCRIPT_A)]);
    const run = spawnSync(
      process.execPath,
      [path.join(REPO, 'scripts/check-csp-hashes.mjs'), dist, toml],
      {
        encoding: 'utf8',
      }
    );
    expect(run.status).toBe(1);
  });

  it('JSON-LD blocks are exempt (not demanded in the policy)', () => {
    const { dist, toml } = cspFixture([sha(SCRIPT_A), sha(SCRIPT_B)]);
    expect(checkCspHashes(dist, toml).missing).toEqual([]);
  });
});

// ─── 3. client bundle ────────────────────────────────────────────────────────

function bundleFixture(files: Record<string, string>): string {
  const dist = tmp('bundle');
  for (const [name, body] of Object.entries(files)) {
    const file = path.join(dist, '_astro', name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
  return dist;
}

describe('check-client-bundle', () => {
  it('passes for small chunks without Zotero content', () => {
    expect(
      checkClientBundle(bundleFixture({ 'Island.abc.js': 'export default 1;' }), REPO)
    ).toEqual([]);
  });

  it('flags a Zotero item key as a string literal', () => {
    const findings = checkClientBundle(
      bundleFixture({ 'Island.abc.js': 'const k="692VLFHW";' }),
      REPO
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'zotero-key', file: 'Island.abc.js' });
  });

  it('flags bibliography note content', () => {
    const library = JSON.parse(
      fs.readFileSync(path.join(REPO, 'src/data/zotero-library.json'), 'utf8')
    );
    const note = library.items.find(
      (i: { itemType: string; note?: string }) =>
        i.itemType === 'note' && (i.note?.length ?? 0) > 80
    );
    const findings = checkClientBundle(
      bundleFixture({ 'Island.abc.js': `const n=${JSON.stringify(note.note)};` }),
      REPO
    );
    expect(findings.some((f: { kind: string }) => f.kind === 'zotero-note')).toBe(true);
  });

  it('flags a non-vendor chunk over the budget but not an oversized vendor chunk', () => {
    const big = 'a'.repeat(NON_VENDOR_BUDGET_BYTES + 1);
    const findings = checkClientBundle(
      bundleFixture({ 'Island.abc.js': big, 'vendor-three.abc.js': big }),
      REPO
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ kind: 'size', file: 'Island.abc.js' });
  });

  it('NEGATIVE CONTROL: a real bundle of an island importing src/lib/bibliography.ts fails the check', async () => {
    const root = tmp('island');
    const entry = path.join(root, 'FixtureIsland.ts');
    fs.writeFileSync(
      entry,
      `import { getBibliographyItems } from ${JSON.stringify(path.join(REPO, 'src/lib/bibliography.ts').replace(/\\/g, '/'))};\n` +
        `export default function FixtureIsland() { return getBibliographyItems().length; }\n` +
        `console.log(FixtureIsland());\n`
    );
    const outDir = path.join(root, 'dist');
    await build({
      root,
      logLevel: 'silent',
      configFile: false,
      resolve: { alias: { '@data': path.join(REPO, 'src/data') } },
      build: {
        outDir,
        emptyOutDir: true,
        minify: true,
        lib: { entry, formats: ['es'], fileName: () => '_astro/FixtureIsland.js' },
      },
    });
    const findings = checkClientBundle(outDir, REPO);
    const kinds = new Set(findings.map((f: { kind: string }) => f.kind));
    expect(kinds.has('zotero-key')).toBe(true);
    expect(kinds.has('zotero-note')).toBe(true);
    expect(kinds.has('size')).toBe(true);
  }, 120_000);

  it('CLI exits non-zero on a violating dist', () => {
    const dist = bundleFixture({ 'Island.abc.js': 'const k="692VLFHW";' });
    const run = spawnSync(
      process.execPath,
      [path.join(REPO, 'scripts/check-client-bundle.mjs'), dist],
      {
        encoding: 'utf8',
      }
    );
    expect(run.status).toBe(1);
  });
});
