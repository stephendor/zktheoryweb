# Phase 3 Source-To-Site Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build website-owned Phase 3 exporter commands that inventory read-only vault inputs, scan markdown metadata, produce staged candidate JSON, report route resolution, and promote only validated output.

**Architecture:** Exporter code lives under `src/lib/phase3/exporter/` and is pure enough to test with temporary fixture vaults. CLI scripts under `scripts/phase3/` pass explicit vault paths into the exporter and write candidate/report files inside the website repo. Astro build remains unchanged and reads only checked-in direct JSON files from `src/data/generated/phase3/`.

**Tech Stack:** Astro project TypeScript, Node `fs`/`path`, Vitest, `tsx`, `zod`, `yaml`, existing Phase 3 contracts and validation helpers.

---

## Execution Mode

Use subagent-driven execution if possible. Run tasks in order. Do not dispatch
two workers that edit the same file set at the same time.

## File Structure

- Create `src/lib/phase3/siteRouteRegistry.ts`
  - Shared helper that builds a `SiteRouteRegistry` from website content files.
- Test `src/lib/phase3/siteRouteRegistry.test.ts`
  - Temporary workspace tests for the registry helper.
- Modify `scripts/validate-phase3-data.ts`
  - Reuse `buildSiteRouteRegistryFromWorkspace`.
- Create `src/lib/phase3/exporter/sourceInventory.ts`
  - Read-only source availability, vault-map, markdown-count, and junction audit.
- Test `src/lib/phase3/exporter/sourceInventory.test.ts`
  - Temp directory and mocked provider tests.
- Create `src/lib/phase3/exporter/vaultScanner.ts`
  - Markdown recursion, frontmatter parsing, citekey extraction, site reference
    extraction, and Two Lenses metadata extraction.
- Test `src/lib/phase3/exporter/vaultScanner.test.ts`
  - Fixture markdown tests including malformed frontmatter.
- Modify `package.json` and `package-lock.json`
  - Add `yaml` as a direct dependency for scanner frontmatter parsing.
- Create `src/lib/phase3/exporter/candidateBuilder.ts`
  - Convert inventory and scanned notes into the existing `Phase3Export` shape.
- Test `src/lib/phase3/exporter/candidateBuilder.test.ts`
  - Empty export, explicit Two Lenses, and shared-citekey proposed connection tests.
- Create `src/lib/phase3/exporter/routeFeedback.ts`
  - Report resolved, pending, external, and broken references for candidate data.
- Test `src/lib/phase3/exporter/routeFeedback.test.ts`
  - Route classification tests.
- Create `src/lib/phase3/exporter/promotion.ts`
  - Validate and copy a candidate export into public generated data.
- Test `src/lib/phase3/exporter/promotion.test.ts`
  - Refuse invalid candidates; write valid promoted JSON.
- Create `scripts/phase3/cli.ts`
  - Shared argument parsing and JSON writing helpers.
- Test `scripts/phase3/cli.test.ts`
  - Flag, env fallback, and missing-value tests.
- Create `scripts/phase3/source-inventory.ts`
  - `npm run phase3:inventory` entry point.
- Create `scripts/phase3/export-candidate.ts`
  - `npm run phase3:export:candidate` entry point.
- Create `scripts/phase3/promote.ts`
  - `npm run phase3:promote` entry point.
- Modify `package.json`
  - Add the three Phase 3 exporter scripts.

## Task 1: Shared Site Route Registry Helper

**Files:**
- Create: `src/lib/phase3/siteRouteRegistry.ts`
- Test: `src/lib/phase3/siteRouteRegistry.test.ts`
- Modify: `scripts/validate-phase3-data.ts`

- [ ] **Step 1: Write failing registry tests**

Create `src/lib/phase3/siteRouteRegistry.test.ts`:

```ts
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSiteRouteRegistryFromWorkspace } from './siteRouteRegistry';

function tempWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-registry-'));
}

function touch(root: string, relativePath: string): void {
  const filePath = join(root, relativePath);
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, '---\ntitle: Test\n---\n', 'utf-8');
}

describe('buildSiteRouteRegistryFromWorkspace', () => {
  it('collects markdown and mdx ids from the website content directories', () => {
    const root = tempWorkspace();
    touch(root, 'src/content/counting-lives/chapters/ch-17.mdx');
    touch(root, 'src/content/tda/papers/paper-10.md');
    touch(root, 'src/content/tda/methods/persistent-homology.mdx');
    touch(root, 'src/content/counting-lives/interludes/mm3-logistic-regression.md');
    touch(root, 'src/content/learn/path3-module-6.mdx');
    touch(root, 'src/content/interactives/mapper-lab.md');
    touch(root, 'src/content/writing/notes/measurement-ethics.md');
    touch(root, 'src/content/writing/essays/two-lenses.mdx');
    writeFileSync(
      join(root, 'src/content/tda/papers/not-content.txt'),
      'ignore me',
      'utf-8',
    );

    const registry = buildSiteRouteRegistryFromWorkspace(root);

    expect(registry.chapters.has('ch-17')).toBe(true);
    expect(registry.papers.has('paper-10')).toBe(true);
    expect(registry.methods.has('persistent-homology')).toBe(true);
    expect(registry.interludes.has('mm3-logistic-regression')).toBe(true);
    expect(registry.learnModules.has('path3-module-6')).toBe(true);
    expect(registry.interactives.has('mapper-lab')).toBe(true);
    expect(registry.writingNotes.has('measurement-ethics')).toBe(true);
    expect(registry.writingEssays.has('two-lenses')).toBe(true);
    expect(registry.papers.has('not-content')).toBe(false);
  });

  it('returns empty sets when content directories do not exist', () => {
    const registry = buildSiteRouteRegistryFromWorkspace(tempWorkspace());

    expect(registry.chapters.size).toBe(0);
    expect(registry.papers.size).toBe(0);
    expect(registry.learnModules.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/siteRouteRegistry.test.ts
```

Expected: fail because `./siteRouteRegistry` does not exist.

- [ ] **Step 3: Implement the registry helper**

Create `src/lib/phase3/siteRouteRegistry.ts`:

```ts
import { existsSync, readdirSync } from 'node:fs';
import { extname, join, parse } from 'node:path';
import {
  createSiteRouteRegistry,
  type SiteRouteRegistry,
} from './resolveSiteReferences';

function mdIdsFromDirectory(workspaceRoot: string, relativeDir: string): string[] {
  const directory = join(workspaceRoot, relativeDir);
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => ['.md', '.mdx'].includes(extname(entry.name)))
    .map((entry) => parse(entry.name).name)
    .sort();
}

export function buildSiteRouteRegistryFromWorkspace(
  workspaceRoot = process.cwd(),
): SiteRouteRegistry {
  return createSiteRouteRegistry({
    chapters: mdIdsFromDirectory(workspaceRoot, 'src/content/counting-lives/chapters'),
    papers: mdIdsFromDirectory(workspaceRoot, 'src/content/tda/papers'),
    methods: mdIdsFromDirectory(workspaceRoot, 'src/content/tda/methods'),
    interludes: mdIdsFromDirectory(
      workspaceRoot,
      'src/content/counting-lives/interludes',
    ),
    learnModules: mdIdsFromDirectory(workspaceRoot, 'src/content/learn'),
    interactives: mdIdsFromDirectory(workspaceRoot, 'src/content/interactives'),
    writingNotes: mdIdsFromDirectory(workspaceRoot, 'src/content/writing/notes'),
    writingEssays: mdIdsFromDirectory(workspaceRoot, 'src/content/writing/essays'),
  });
}
```

- [ ] **Step 4: Reuse the helper in Phase 3 validation**

Modify `scripts/validate-phase3-data.ts` so the imports include the new helper:

```ts
import { buildSiteRouteRegistryFromWorkspace } from '../src/lib/phase3/siteRouteRegistry';
```

Remove the local `mdIdsFromDirectory` and `buildRegistryFromWorkspace`
functions, then replace:

```ts
const registry = buildRegistryFromWorkspace();
```

with:

```ts
const registry = buildSiteRouteRegistryFromWorkspace(workspaceRoot);
```

The remaining local helpers in `scripts/validate-phase3-data.ts` should be
`jsonFilesInDirectory`, `validationFiles`, `relativeDisplayPath`,
`printResult`, and `main`.

- [ ] **Step 5: Verify the registry change**

Run:

```bash
npm run test -- src/lib/phase3/siteRouteRegistry.test.ts
npm run validate:phase3
```

Expected: focused tests pass; validation reports zero errors. The existing
pending-reference fixture warning may remain.

- [ ] **Step 6: Commit**

```bash
git add src/lib/phase3/siteRouteRegistry.ts src/lib/phase3/siteRouteRegistry.test.ts scripts/validate-phase3-data.ts
git commit -m "feat: share phase 3 route registry"
```

## Task 2: Source Inventory And Junction Audit

**Files:**
- Create: `src/lib/phase3/exporter/sourceInventory.ts`
- Test: `src/lib/phase3/exporter/sourceInventory.test.ts`

- [ ] **Step 1: Write failing inventory tests**

Create `src/lib/phase3/exporter/sourceInventory.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  inspectVaultSource,
  inspectVaultSources,
  type SourceInventoryDeps,
} from './sourceInventory';

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-source-inventory-'));
}

describe('inspectVaultSource', () => {
  it('reports available roots, vault maps, and markdown counts', () => {
    const root = tempRoot();
    mkdirSync(join(root, '04-Methods'), { recursive: true });
    writeFileSync(join(root, 'VAULT-MAP.md'), '# Vault Map\n', 'utf-8');
    writeFileSync(join(root, '04-Methods', 'Persistent-Homology.md'), '# PH\n', 'utf-8');
    writeFileSync(join(root, '04-Methods', 'ignore.txt'), 'no', 'utf-8');

    const entry = inspectVaultSource({
      sourceId: 'tda-research',
      sourceType: 'obsidian-vault',
      label: 'TDA Research vault',
      root,
    });

    expect(entry.available).toBe(true);
    expect(entry.vaultMapFound).toBe(true);
    expect(entry.markdownFiles).toBe(2);
    expect(entry.localPath).toBe(root);
    expect(entry.warnings).toEqual([]);
  });

  it('reports unavailable roots without throwing', () => {
    const entry = inspectVaultSource({
      sourceId: 'counting-lives',
      sourceType: 'obsidian-vault',
      label: 'Counting Lives vault',
      root: join(tempRoot(), 'missing'),
    });

    expect(entry.available).toBe(false);
    expect(entry.markdownFiles).toBe(0);
    expect(entry.warnings[0]).toMatchObject({
      code: 'source-root-missing',
      sourceId: 'counting-lives',
    });
  });

  it('records realpath differences for junction-like paths', () => {
    const deps: SourceInventoryDeps = {
      exists: () => true,
      isDirectory: () => true,
      isSymbolicLink: () => false,
      realpath: () => 'C:/Users/steph/Documents/TDA-Research',
      countMarkdownFiles: () => 12,
    };

    const entry = inspectVaultSource(
      {
        sourceId: 'tda-research',
        sourceType: 'obsidian-vault',
        label: 'TDA Research vault',
        root: 'C:/Users/steph/TDL/vault',
      },
      deps,
    );

    expect(entry.realPath).toBe('C:/Users/steph/Documents/TDA-Research');
    expect(entry.realPathDiffers).toBe(true);
    expect(entry.linkKind).toBe('junction-or-reparse-point');
  });
});

describe('inspectVaultSources', () => {
  it('combines source entries and warnings', () => {
    const root = tempRoot();
    writeFileSync(join(root, 'VAULT-MAP.md'), '# Vault Map\n', 'utf-8');

    const report = inspectVaultSources([
      {
        sourceId: 'tda-research',
        sourceType: 'obsidian-vault',
        label: 'TDA Research vault',
        root,
      },
      {
        sourceId: 'counting-lives',
        sourceType: 'obsidian-vault',
        label: 'Counting Lives vault',
        root: join(root, 'missing'),
      },
    ]);

    expect(report.sources).toHaveLength(2);
    expect(report.warnings.map((warning) => warning.code)).toContain(
      'source-root-missing',
    );
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/exporter/sourceInventory.test.ts
```

Expected: fail because `./sourceInventory` does not exist.

- [ ] **Step 3: Implement source inventory**

Create `src/lib/phase3/exporter/sourceInventory.ts`:

```ts
import {
  existsSync,
  lstatSync,
  readdirSync,
  realpathSync,
} from 'node:fs';
import { extname, join, relative } from 'node:path';
import type { ExportManifest } from '../contracts';

type SourceType = ExportManifest['sources'][number]['sourceType'];
type ManifestWarning = ExportManifest['warnings'][number];

export interface VaultSourceConfig {
  sourceId: string;
  sourceType: SourceType;
  label: string;
  root: string;
  vaultMapRelativePath?: string;
}

export interface SourceInventoryDeps {
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
  isSymbolicLink(path: string): boolean;
  realpath(path: string): string;
  countMarkdownFiles(path: string): number;
}

export interface SourceInventoryEntry {
  sourceId: string;
  sourceType: SourceType;
  label: string;
  localPath: string;
  realPath: string | null;
  realPathDiffers: boolean;
  linkKind: 'none' | 'symbolic-link' | 'junction-or-reparse-point';
  available: boolean;
  vaultMapPath: string;
  vaultMapFound: boolean;
  markdownFiles: number;
  warnings: ManifestWarning[];
}

export interface SourceInventoryReport {
  generatedAt: string;
  sources: SourceInventoryEntry[];
  warnings: ManifestWarning[];
}

function defaultIsDirectory(path: string): boolean {
  try {
    return lstatSync(path).isDirectory();
  } catch {
    return false;
  }
}

function defaultIsSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function countMarkdownFiles(root: string): number {
  let count = 0;

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', '.obsidian', '.trash', 'node_modules'].includes(entry.name)) {
          visit(path);
        }
        continue;
      }

      if (entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name))) {
        count += 1;
      }
    }
  }

  visit(root);
  return count;
}

const defaultDeps: SourceInventoryDeps = {
  exists: existsSync,
  isDirectory: defaultIsDirectory,
  isSymbolicLink: defaultIsSymbolicLink,
  realpath: (path) => realpathSync.native(path),
  countMarkdownFiles,
};

function warning(
  code: string,
  message: string,
  sourceId: string,
): ManifestWarning {
  return { code, message, sourceId };
}

function samePath(left: string, right: string): boolean {
  return left.replaceAll('\\', '/').toLowerCase() === right.replaceAll('\\', '/').toLowerCase();
}

export function inspectVaultSource(
  config: VaultSourceConfig,
  deps: SourceInventoryDeps = defaultDeps,
): SourceInventoryEntry {
  const vaultMapRelativePath = config.vaultMapRelativePath ?? 'VAULT-MAP.md';
  const vaultMapPath = join(config.root, vaultMapRelativePath);
  const warnings: ManifestWarning[] = [];

  if (!deps.exists(config.root) || !deps.isDirectory(config.root)) {
    warnings.push(
      warning(
        'source-root-missing',
        `Source root does not exist or is not a directory: ${config.root}`,
        config.sourceId,
      ),
    );
    return {
      sourceId: config.sourceId,
      sourceType: config.sourceType,
      label: config.label,
      localPath: config.root,
      realPath: null,
      realPathDiffers: false,
      linkKind: 'none',
      available: false,
      vaultMapPath,
      vaultMapFound: false,
      markdownFiles: 0,
      warnings,
    };
  }

  const realPath = deps.realpath(config.root);
  const realPathDiffers = !samePath(config.root, realPath);
  const isSymbolicLink = deps.isSymbolicLink(config.root);
  const linkKind = isSymbolicLink
    ? 'symbolic-link'
    : realPathDiffers
      ? 'junction-or-reparse-point'
      : 'none';
  const vaultMapFound = deps.exists(vaultMapPath);

  if (!vaultMapFound) {
    warnings.push(
      warning(
        'vault-map-missing',
        `VAULT-MAP.md was not found at ${vaultMapPath}`,
        config.sourceId,
      ),
    );
  }

  return {
    sourceId: config.sourceId,
    sourceType: config.sourceType,
    label: config.label,
    localPath: config.root,
    realPath,
    realPathDiffers,
    linkKind,
    available: true,
    vaultMapPath,
    vaultMapFound,
    markdownFiles: deps.countMarkdownFiles(config.root),
    warnings,
  };
}

export function inspectVaultSources(
  configs: VaultSourceConfig[],
  deps: SourceInventoryDeps = defaultDeps,
  generatedAt = new Date().toISOString(),
): SourceInventoryReport {
  const sources = configs.map((config) => inspectVaultSource(config, deps));
  return {
    generatedAt,
    sources,
    warnings: sources.flatMap((source) => source.warnings),
  };
}

export function relativeSourcePath(root: string, path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}
```

- [ ] **Step 4: Run inventory tests**

Run:

```bash
npm run test -- src/lib/phase3/exporter/sourceInventory.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phase3/exporter/sourceInventory.ts src/lib/phase3/exporter/sourceInventory.test.ts
git commit -m "feat: audit phase 3 source roots"
```

## Task 3: Vault Scanner

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/phase3/exporter/vaultScanner.ts`
- Test: `src/lib/phase3/exporter/vaultScanner.test.ts`

- [ ] **Step 1: Add `yaml` as a direct dependency**

Run:

```bash
npm install yaml@^2.8.3 --save
```

Expected: `package.json` lists `"yaml": "^2.8.3"` in dependencies and
`package-lock.json` root package metadata includes the same dependency.

- [ ] **Step 2: Write failing scanner tests**

Create `src/lib/phase3/exporter/vaultScanner.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanVaultNotes } from './vaultScanner';

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-vault-scanner-'));
}

function write(root: string, relativePath: string, text: string): void {
  const filePath = join(root, relativePath);
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, text, 'utf-8');
}

describe('scanVaultNotes', () => {
  it('extracts frontmatter, title, citekeys, site refs, and two lenses metadata', () => {
    const root = tempRoot();
    write(
      root,
      '04-Methods/Persistent-Homology.md',
      `---
title: "Persistent Homology"
citekey: "bauer2021ripser"
site:
  kind: "method"
  id: "persistent-homology"
  status: "resolved"
  label: "Method"
  title: "Persistent Homology"
two-lenses:
  id: "ph-ethics"
  title: "Persistence and measurement ethics"
  status: "confirmed"
  mathematical: "04-Methods/Persistent-Homology.md"
  political: "01 - Manuscript/Part IV/Ch17/sections/Ethics.md"
  website-path: "/learn/"
  rationale: "Both notes treat durable measurement categories."
  concepts: ["measurement ethics", "persistent homology"]
---

# Body Heading

This note cites @carlsson2009topology and @bauer2021ripser.
`,
    );

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.warnings).toEqual([]);
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toMatchObject({
      sourceId: 'tda-research',
      relativePath: '04-Methods/Persistent-Homology.md',
      title: 'Persistent Homology',
      citekeys: ['bauer2021ripser', 'carlsson2009topology'],
      siteReference: {
        kind: 'method',
        id: 'persistent-homology',
      },
      twoLenses: {
        id: 'ph-ethics',
        status: 'confirmed',
        websitePath: '/learn/',
      },
    });
  });

  it('uses the first markdown heading when frontmatter title is absent', () => {
    const root = tempRoot();
    write(root, '02-Notes/Permanent/Shape.md', '# Shape Difference\n\nText');

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes[0]?.title).toBe('Shape Difference');
  });

  it('skips non-content directories', () => {
    const root = tempRoot();
    write(root, '.obsidian/workspace.md', '# Ignore\n');
    write(root, '02-Notes/Permanent/Keep.md', '# Keep\n');

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes.map((note) => note.relativePath)).toEqual([
      '02-Notes/Permanent/Keep.md',
    ]);
  });

  it('records malformed frontmatter warnings and keeps scanning', () => {
    const root = tempRoot();
    write(root, 'bad.md', '---\ntitle: [broken\n---\n# Bad\n');

    const result = scanVaultNotes({ root, sourceId: 'counting-lives' });

    expect(result.notes).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      code: 'frontmatter-parse-error',
      sourceId: 'counting-lives',
    });
  });
});
```

- [ ] **Step 3: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/exporter/vaultScanner.test.ts
```

Expected: fail because `./vaultScanner` does not exist.

- [ ] **Step 4: Implement the scanner**

Create `src/lib/phase3/exporter/vaultScanner.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, parse, relative } from 'node:path';
import { parseDocument } from 'yaml';
import {
  siteReferenceSchema,
  type ExportManifest,
  type SiteReference,
} from '../contracts';

type ManifestWarning = ExportManifest['warnings'][number];

export interface TwoLensesEndpointMetadata {
  note?: string;
  path?: string;
  sourceId?: string;
  site?: SiteReference;
}

export interface TwoLensesMetadata {
  id?: string;
  title?: string;
  status?: 'confirmed' | 'draft';
  mathematical?: string | TwoLensesEndpointMetadata;
  political?: string | TwoLensesEndpointMetadata;
  websitePath?: string;
  rationale?: string;
  concepts: string[];
}

export interface ScannedVaultNote {
  sourceId: string;
  relativePath: string;
  title: string;
  frontmatter: Record<string, unknown>;
  citekeys: string[];
  siteReference: SiteReference | null;
  twoLenses: TwoLensesMetadata | null;
}

export interface ScanVaultOptions {
  root: string;
  sourceId: string;
}

export interface ScanVaultResult {
  sourceId: string;
  root: string;
  notes: ScannedVaultNote[];
  warnings: ManifestWarning[];
}

const skippedDirectories = new Set(['.git', '.obsidian', '.trash', 'node_modules']);

function warning(
  code: string,
  message: string,
  sourceId: string,
): ManifestWarning {
  return { code, message, sourceId };
}

function markdownFiles(root: string): string[] {
  const files: string[] = [];

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) visit(path);
        continue;
      }
      if (entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name))) {
        files.push(path);
      }
    }
  }

  visit(root);
  return files.sort();
}

function normalizeRelativePath(root: string, path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}

function splitFrontmatter(text: string): { yaml: string | null; body: string } {
  if (!text.startsWith('---')) return { yaml: null, body: text };

  const newline = text.indexOf('\n');
  if (newline === -1) return { yaml: null, body: text };

  const end = text.indexOf('\n---', newline + 1);
  if (end === -1) return { yaml: null, body: text };

  const afterEnd = text.indexOf('\n', end + 4);
  return {
    yaml: text.slice(newline + 1, end),
    body: afterEnd === -1 ? '' : text.slice(afterEnd + 1),
  };
}

function parseFrontmatter(
  yamlText: string | null,
  sourceId: string,
  relativePath: string,
  warnings: ManifestWarning[],
): Record<string, unknown> {
  if (!yamlText) return {};

  const document = parseDocument(yamlText);
  if (document.errors.length > 0) {
    warnings.push(
      warning(
        'frontmatter-parse-error',
        `Could not parse frontmatter in ${relativePath}: ${document.errors[0]?.message}`,
        sourceId,
      ),
    );
    return {};
  }

  const parsed = document.toJSON();
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function titleFrom(frontmatter: Record<string, unknown>, body: string, filePath: string): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  return parse(basename(filePath)).name;
}

function citekeysFromValue(value: unknown): string[] {
  if (typeof value === 'string') return [value.replace(/^@/, '')];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => citekeysFromValue(entry));
  }
  return [];
}

function collectCitekeys(frontmatter: Record<string, unknown>, body: string): string[] {
  const keys = new Set<string>();
  for (const field of ['citekey', 'citekeys', 'zoteroKeys', 'zotero-keys']) {
    for (const key of citekeysFromValue(frontmatter[field])) {
      if (key) keys.add(key);
    }
  }

  for (const match of body.matchAll(/@([A-Za-z0-9][A-Za-z0-9_:.+-]*)/g)) {
    keys.add(match[1]);
  }

  return [...keys].sort();
}

function parseSiteReference(value: unknown): SiteReference | null {
  const parsed = siteReferenceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function endpointMetadata(value: unknown): string | TwoLensesEndpointMetadata | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const record = value as Record<string, unknown>;
  const site = parseSiteReference(record.site);
  return {
    note: typeof record.note === 'string' ? record.note : undefined,
    path: typeof record.path === 'string' ? record.path : undefined,
    sourceId: typeof record.sourceId === 'string' ? record.sourceId : undefined,
    ...(site ? { site } : {}),
  };
}

function parseTwoLenses(frontmatter: Record<string, unknown>): TwoLensesMetadata | null {
  const raw = frontmatter['two-lenses'] ?? frontmatter.twoLenses;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const websitePath =
    typeof record['website-path'] === 'string'
      ? record['website-path']
      : typeof record.websitePath === 'string'
        ? record.websitePath
        : undefined;

  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    title: typeof record.title === 'string' ? record.title : undefined,
    status:
      record.status === 'confirmed' || record.status === 'draft'
        ? record.status
        : undefined,
    mathematical: endpointMetadata(record.mathematical),
    political: endpointMetadata(record.political),
    websitePath,
    rationale: typeof record.rationale === 'string' ? record.rationale : undefined,
    concepts: stringArray(record.concepts),
  };
}

export function scanVaultNotes(options: ScanVaultOptions): ScanVaultResult {
  const warnings: ManifestWarning[] = [];
  const notes = markdownFiles(options.root).map((filePath) => {
    const text = readFileSync(filePath, 'utf-8');
    const relativePath = normalizeRelativePath(options.root, filePath);
    const split = splitFrontmatter(text);
    const frontmatter = parseFrontmatter(
      split.yaml,
      options.sourceId,
      relativePath,
      warnings,
    );

    return {
      sourceId: options.sourceId,
      relativePath,
      title: titleFrom(frontmatter, split.body, filePath),
      frontmatter,
      citekeys: collectCitekeys(frontmatter, split.body),
      siteReference: parseSiteReference(frontmatter.site),
      twoLenses: parseTwoLenses(frontmatter),
    };
  });

  return {
    sourceId: options.sourceId,
    root: options.root,
    notes,
    warnings,
  };
}
```

- [ ] **Step 5: Run scanner tests**

Run:

```bash
npm run test -- src/lib/phase3/exporter/vaultScanner.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/phase3/exporter/vaultScanner.ts src/lib/phase3/exporter/vaultScanner.test.ts
git commit -m "feat: scan phase 3 vault notes"
```

## Task 4: Candidate Export Builder

**Files:**
- Create: `src/lib/phase3/exporter/candidateBuilder.ts`
- Test: `src/lib/phase3/exporter/candidateBuilder.test.ts`

- [ ] **Step 1: Write failing candidate builder tests**

Create `src/lib/phase3/exporter/candidateBuilder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { phase3ExportSchema } from '../contracts';
import { buildPhase3Candidate } from './candidateBuilder';
import type { SourceInventoryReport } from './sourceInventory';
import type { ScanVaultResult, ScannedVaultNote } from './vaultScanner';

const generatedAt = '2026-06-14T00:00:00.000Z';

const inventory: SourceInventoryReport = {
  generatedAt,
  warnings: [],
  sources: [
    {
      sourceId: 'tda-research',
      sourceType: 'obsidian-vault',
      label: 'TDA Research vault',
      localPath: 'C:/Users/steph/TDL/vault',
      realPath: 'C:/Users/steph/Documents/TDA-Research',
      realPathDiffers: true,
      linkKind: 'junction-or-reparse-point',
      available: true,
      vaultMapPath: 'C:/Users/steph/TDL/vault/VAULT-MAP.md',
      vaultMapFound: true,
      markdownFiles: 1,
      warnings: [],
    },
    {
      sourceId: 'counting-lives',
      sourceType: 'obsidian-vault',
      label: 'Counting Lives vault',
      localPath: 'C:/Users/steph/Documents/Counting Lives/Counting Lives',
      realPath: 'C:/Users/steph/Documents/Counting Lives/Counting Lives',
      realPathDiffers: false,
      linkKind: 'none',
      available: true,
      vaultMapPath: 'C:/Users/steph/Documents/Counting Lives/Counting Lives/VAULT-MAP.md',
      vaultMapFound: true,
      markdownFiles: 1,
      warnings: [],
    },
  ],
};

function note(
  sourceId: string,
  relativePath: string,
  title: string,
  siteReference: ScannedVaultNote['siteReference'],
  extra: Partial<ScannedVaultNote> = {},
): ScannedVaultNote {
  return {
    sourceId,
    relativePath,
    title,
    frontmatter: {},
    citekeys: [],
    siteReference,
    twoLenses: null,
    ...extra,
  };
}

function scan(sourceId: string, notes: ScannedVaultNote[]): ScanVaultResult {
  return {
    sourceId,
    root: `C:/${sourceId}`,
    notes,
    warnings: [],
  };
}

describe('buildPhase3Candidate', () => {
  it('emits a valid empty export when there are no confirmed tags', () => {
    const data = buildPhase3Candidate({
      inventory,
      scans: [scan('tda-research', []), scan('counting-lives', [])],
      generatedAt,
    });

    expect(phase3ExportSchema.safeParse(data).success).toBe(true);
    expect(data.twoLenses).toEqual([]);
    expect(data.derivedConnections).toEqual([]);
    expect(data.manifest.warnings.map((entry) => entry.code)).toContain(
      'no-confirmed-two-lenses',
    );
  });

  it('builds confirmed Two Lenses links from explicit note metadata', () => {
    const mathematical = note(
      'tda-research',
      '04-Methods/Persistent-Homology.md',
      'Persistent Homology',
      {
        kind: 'method',
        id: 'persistent-homology',
        status: 'resolved',
        label: 'Method',
        title: 'Persistent Homology',
      },
      {
        citekeys: ['bauer2021ripser'],
        twoLenses: {
          id: 'ph-ethics',
          title: 'Persistence and measurement ethics',
          status: 'confirmed',
          mathematical: '04-Methods/Persistent-Homology.md',
          political: '01 - Manuscript/Part IV/Ch17/sections/Ethics.md',
          websitePath: '/learn/',
          rationale: 'Both notes treat durable measurement categories.',
          concepts: ['measurement ethics'],
        },
      },
    );
    const political = note(
      'counting-lives',
      '01 - Manuscript/Part IV/Ch17/sections/Ethics.md',
      'Toward an Ethics of Measurement',
      {
        kind: 'chapter',
        id: 'ch-17',
        status: 'resolved',
        label: 'Chapter 17',
        title: 'Toward an Ethics of Measurement',
      },
      { citekeys: ['bauer2021ripser'] },
    );

    const data = buildPhase3Candidate({
      inventory,
      scans: [scan('tda-research', [mathematical]), scan('counting-lives', [political])],
      generatedAt,
    });

    expect(data.twoLenses).toHaveLength(1);
    expect(data.twoLenses[0]).toMatchObject({
      id: 'ph-ethics',
      status: 'confirmed',
      websitePath: '/learn/',
      mathematical: { kind: 'method', id: 'persistent-homology' },
      political: { kind: 'chapter', id: 'ch-17' },
      zoteroKeys: ['bauer2021ripser'],
    });
  });

  it('emits proposed shared-citation derived connections when both notes have site refs', () => {
    const tda = note('tda-research', '04-Methods/Persistent-Homology.md', 'PH', {
      kind: 'method',
      id: 'persistent-homology',
      status: 'resolved',
      label: 'Method',
      title: 'Persistent Homology',
    }, { citekeys: ['bauer2021ripser'] });
    const cl = note('counting-lives', 'sections/Ethics.md', 'Ethics', {
      kind: 'chapter',
      id: 'ch-17',
      status: 'resolved',
      label: 'Chapter 17',
      title: 'Toward an Ethics of Measurement',
    }, { citekeys: ['bauer2021ripser'] });

    const data = buildPhase3Candidate({
      inventory,
      scans: [scan('tda-research', [tda]), scan('counting-lives', [cl])],
      generatedAt,
    });

    expect(data.derivedConnections).toHaveLength(1);
    expect(data.derivedConnections[0]).toMatchObject({
      connectionType: 'shared-citation',
      confidence: 'proposed',
      origin: 'cross-vault-linker',
    });
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/exporter/candidateBuilder.test.ts
```

Expected: fail because `./candidateBuilder` does not exist.

- [ ] **Step 3: Implement candidate building**

Create `src/lib/phase3/exporter/candidateBuilder.ts`:

```ts
import type {
  DerivedConnection,
  ExportManifest,
  Phase3Export,
  SiteReference,
  TwoLensesLink,
} from '../contracts';
import type { SourceInventoryReport } from './sourceInventory';
import type {
  ScanVaultResult,
  ScannedVaultNote,
  TwoLensesEndpointMetadata,
} from './vaultScanner';

type ManifestWarning = ExportManifest['warnings'][number];

export interface BuildPhase3CandidateOptions {
  inventory: SourceInventoryReport;
  scans: ScanVaultResult[];
  generatedAt?: string;
}

function warning(code: string, message: string, sourceId?: string): ManifestWarning {
  return { code, message, ...(sourceId ? { sourceId } : {}) };
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/');
}

function slugPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function noteKey(sourceId: string, relativePath: string): string {
  return `${sourceId}:${normalizePath(relativePath)}`;
}

function allNotes(scans: ScanVaultResult[]): ScannedVaultNote[] {
  return scans.flatMap((scan) => scan.notes);
}

function noteIndex(notes: ScannedVaultNote[]): Map<string, ScannedVaultNote> {
  const index = new Map<string, ScannedVaultNote>();
  for (const note of notes) {
    index.set(noteKey(note.sourceId, note.relativePath), note);
    if (!index.has(normalizePath(note.relativePath))) {
      index.set(normalizePath(note.relativePath), note);
    }
  }
  return index;
}

function endpointPath(endpoint: string | TwoLensesEndpointMetadata | undefined): string | null {
  if (typeof endpoint === 'string') return normalizePath(endpoint);
  if (!endpoint) return null;
  return normalizePath(endpoint.note ?? endpoint.path ?? '');
}

function endpointSiteReference(
  endpoint: string | TwoLensesEndpointMetadata | undefined,
  notesByPath: Map<string, ScannedVaultNote>,
): SiteReference | null {
  if (typeof endpoint === 'object' && endpoint?.site) return endpoint.site;

  const path = endpointPath(endpoint);
  if (!path) return null;

  const sourceId = typeof endpoint === 'object' ? endpoint.sourceId : undefined;
  const note = sourceId ? notesByPath.get(noteKey(sourceId, path)) : notesByPath.get(path);
  return note?.siteReference ?? null;
}

function sourceNoteRef(note: ScannedVaultNote) {
  return {
    sourceId: note.sourceId,
    path: note.relativePath,
    title: note.title,
  };
}

function noteForEndpoint(
  endpoint: string | TwoLensesEndpointMetadata | undefined,
  notesByPath: Map<string, ScannedVaultNote>,
): ScannedVaultNote | null {
  const path = endpointPath(endpoint);
  if (!path) return null;
  const sourceId = typeof endpoint === 'object' ? endpoint.sourceId : undefined;
  return sourceId ? notesByPath.get(noteKey(sourceId, path)) ?? null : notesByPath.get(path) ?? null;
}

function buildTwoLensesLinks(
  notes: ScannedVaultNote[],
  warnings: ManifestWarning[],
): TwoLensesLink[] {
  const notesByPath = noteIndex(notes);
  const links: TwoLensesLink[] = [];

  for (const note of notes) {
    const metadata = note.twoLenses;
    if (!metadata) continue;

    const mathematical = endpointSiteReference(metadata.mathematical, notesByPath);
    const political = endpointSiteReference(metadata.political, notesByPath);
    const mathematicalNote = noteForEndpoint(metadata.mathematical, notesByPath);
    const politicalNote = noteForEndpoint(metadata.political, notesByPath);

    if (!mathematical || !political || !metadata.websitePath || !metadata.rationale) {
      warnings.push(
        warning(
          'two-lenses-metadata-incomplete',
          `Two Lenses metadata in ${note.relativePath} is missing a site reference, website path, or rationale.`,
          note.sourceId,
        ),
      );
      continue;
    }

    const zoteroKeys = new Set<string>([
      ...(mathematicalNote?.citekeys ?? []),
      ...(politicalNote?.citekeys ?? []),
    ]);

    links.push({
      id:
        metadata.id ??
        `two-lenses-${slugPart(mathematical.id)}-${slugPart(political.id)}`,
      title: metadata.title ?? `${mathematical.title} and ${political.title}`,
      status: metadata.status ?? 'draft',
      mathematical,
      political,
      rationale: metadata.rationale,
      websitePath: metadata.websitePath,
      concepts: metadata.concepts,
      sourceNoteRefs: [mathematicalNote, politicalNote].filter(
        (entry): entry is ScannedVaultNote => Boolean(entry),
      ).map(sourceNoteRef),
      zoteroKeys: [...zoteroKeys].sort(),
    });
  }

  return links;
}

function sharedCitationConnections(notes: ScannedVaultNote[]): DerivedConnection[] {
  const byCitekey = new Map<string, ScannedVaultNote[]>();
  for (const note of notes) {
    if (!note.siteReference) continue;
    for (const citekey of note.citekeys) {
      byCitekey.set(citekey, [...(byCitekey.get(citekey) ?? []), note]);
    }
  }

  const connections: DerivedConnection[] = [];
  const seen = new Set<string>();
  for (const [citekey, citedNotes] of byCitekey) {
    const tdaNotes = citedNotes.filter((note) => note.sourceId === 'tda-research');
    const clNotes = citedNotes.filter((note) => note.sourceId === 'counting-lives');

    for (const tda of tdaNotes) {
      for (const cl of clNotes) {
        if (!tda.siteReference || !cl.siteReference) continue;
        const id = `shared-citation-${slugPart(citekey)}-${slugPart(tda.siteReference.id)}-${slugPart(cl.siteReference.id)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        connections.push({
          id,
          source: tda.siteReference,
          target: cl.siteReference,
          connectionType: 'shared-citation',
          confidence: 'proposed',
          rationale: `Both notes cite @${citekey}.`,
          origin: 'cross-vault-linker',
        });
      }
    }
  }

  return connections;
}

function manifestSources(inventory: SourceInventoryReport): ExportManifest['sources'] {
  return inventory.sources.map((source) => ({
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    label: source.label,
    localPath: source.localPath,
    vaultMapPath: source.vaultMapPath,
    lastIndexedAt: inventory.generatedAt,
  }));
}

export function buildPhase3Candidate(
  options: BuildPhase3CandidateOptions,
): Phase3Export {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const notes = allNotes(options.scans);
  const warnings: ManifestWarning[] = [
    ...options.inventory.warnings,
    ...options.scans.flatMap((scan) => scan.warnings),
  ];
  const twoLenses = buildTwoLensesLinks(notes, warnings);
  const derivedConnections = sharedCitationConnections(notes);

  if (twoLenses.filter((link) => link.status === 'confirmed').length === 0) {
    warnings.push(
      warning(
        'no-confirmed-two-lenses',
        'No confirmed Two Lenses metadata was found in the scanned vault notes.',
      ),
    );
  }

  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt,
      exporter: {
        name: 'phase3-source-to-site-exporter',
        version: '1.0.0',
      },
      sources: manifestSources(options.inventory),
      warnings,
    },
    twoLenses,
    derivedConnections,
    learningPaths: [],
  };
}
```

- [ ] **Step 4: Run candidate builder tests**

Run:

```bash
npm run test -- src/lib/phase3/exporter/candidateBuilder.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phase3/exporter/candidateBuilder.ts src/lib/phase3/exporter/candidateBuilder.test.ts
git commit -m "feat: build phase 3 candidate exports"
```

## Task 5: Route Feedback And Promotion

**Files:**
- Create: `src/lib/phase3/exporter/routeFeedback.ts`
- Test: `src/lib/phase3/exporter/routeFeedback.test.ts`
- Create: `src/lib/phase3/exporter/promotion.ts`
- Test: `src/lib/phase3/exporter/promotion.test.ts`

- [ ] **Step 1: Write failing route feedback tests**

Create `src/lib/phase3/exporter/routeFeedback.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Phase3Export, SiteReference } from '../contracts';
import { createSiteRouteRegistry } from '../resolveSiteReferences';
import { createRouteFeedback } from './routeFeedback';

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  methods: ['persistent-homology'],
});

function ref(fields: Partial<SiteReference>): SiteReference {
  return {
    kind: 'chapter',
    id: 'ch-17',
    status: 'resolved',
    label: 'Chapter 17',
    title: 'Toward an Ethics of Measurement',
    ...fields,
  } as SiteReference;
}

function exportWithRefs(source: SiteReference, target: SiteReference): Phase3Export {
  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt: '2026-06-14T00:00:00.000Z',
      exporter: { name: 'test', version: '1.0.0' },
      sources: [],
      warnings: [],
    },
    twoLenses: [],
    derivedConnections: [
      {
        id: 'test-connection',
        source,
        target,
        connectionType: 'manual-curation',
        confidence: 'reviewed',
        rationale: 'Test connection.',
        origin: 'manual-curation',
      },
    ],
    learningPaths: [],
  };
}

describe('createRouteFeedback', () => {
  it('counts resolved and pending references', () => {
    const report = createRouteFeedback(
      exportWithRefs(
        ref({ kind: 'chapter', id: 'ch-17' }),
        ref({
          kind: 'method',
          id: 'future-method',
          status: 'pending',
          label: 'Method',
          title: 'Future Method',
        }),
      ),
      registry,
      '2026-06-14T00:00:00.000Z',
    );

    expect(report.ok).toBe(true);
    expect(report.summary.resolvedReferences).toBe(1);
    expect(report.summary.pendingReferences).toBe(1);
    expect(report.summary.brokenReferences).toBe(0);
  });

  it('counts broken resolved references and exposes validation issues', () => {
    const report = createRouteFeedback(
      exportWithRefs(
        ref({ kind: 'chapter', id: 'missing-chapter' }),
        ref({ kind: 'method', id: 'persistent-homology' }),
      ),
      registry,
      '2026-06-14T00:00:00.000Z',
    );

    expect(report.ok).toBe(false);
    expect(report.summary.brokenReferences).toBe(1);
    expect(report.issues.map((issue) => issue.code)).toContain(
      'unresolved-reference',
    );
  });
});
```

- [ ] **Step 2: Write failing promotion tests**

Create `src/lib/phase3/exporter/promotion.test.ts`:

```ts
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Phase3Export } from '../contracts';
import { createSiteRouteRegistry } from '../resolveSiteReferences';
import { promotePhase3Candidate } from './promotion';

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  methods: ['persistent-homology'],
});

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-promotion-'));
}

function validExport(): Phase3Export {
  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt: '2026-06-14T00:00:00.000Z',
      exporter: { name: 'test', version: '1.0.0' },
      sources: [],
      warnings: [],
    },
    twoLenses: [],
    derivedConnections: [
      {
        id: 'ch17-ph',
        source: {
          kind: 'chapter',
          id: 'ch-17',
          status: 'resolved',
          label: 'Chapter 17',
          title: 'Toward an Ethics of Measurement',
        },
        target: {
          kind: 'method',
          id: 'persistent-homology',
          status: 'resolved',
          label: 'Method',
          title: 'Persistent Homology',
        },
        connectionType: 'manual-curation',
        confidence: 'reviewed',
        rationale: 'Test connection.',
        origin: 'manual-curation',
      },
    ],
    learningPaths: [],
  };
}

describe('promotePhase3Candidate', () => {
  it('writes formatted JSON when candidate validation succeeds', () => {
    const root = tempRoot();
    const candidatePath = join(root, 'candidate.json');
    const destinationPath = join(root, 'src/data/generated/phase3/site-connections.json');
    writeFileSync(candidatePath, JSON.stringify(validExport()), 'utf-8');

    promotePhase3Candidate({ candidatePath, destinationPath, registry });

    const promoted = JSON.parse(readFileSync(destinationPath, 'utf-8')) as Phase3Export;
    expect(promoted.derivedConnections[0]?.id).toBe('ch17-ph');
  });

  it('throws without writing when route validation fails', () => {
    const root = tempRoot();
    const candidate = validExport();
    candidate.derivedConnections[0]!.target.id = 'missing-method';
    const candidatePath = join(root, 'candidate.json');
    const destinationPath = join(root, 'site-connections.json');
    writeFileSync(candidatePath, JSON.stringify(candidate), 'utf-8');

    expect(() =>
      promotePhase3Candidate({ candidatePath, destinationPath, registry }),
    ).toThrow(/Cannot promote Phase 3 candidate/);
  });
});
```

- [ ] **Step 3: Run focused failing tests**

Run:

```bash
npm run test -- src/lib/phase3/exporter/routeFeedback.test.ts src/lib/phase3/exporter/promotion.test.ts
```

Expected: fail because `routeFeedback` and `promotion` do not exist.

- [ ] **Step 4: Implement route feedback**

Create `src/lib/phase3/exporter/routeFeedback.ts`:

```ts
import type { Phase3Export, SiteReference } from '../contracts';
import {
  validatePhase3Export,
  type Phase3ValidationIssue,
} from '../loadGeneratedData';
import {
  resolveSiteReference,
  type SiteRouteRegistry,
} from '../resolveSiteReferences';

export interface RouteFeedbackReference {
  path: string;
  id: string;
  kind: SiteReference['kind'];
  status: SiteReference['status'];
  resolution: 'resolved' | 'pending' | 'external' | 'missing' | 'invalid';
}

export interface RouteFeedbackReport {
  generatedAt: string;
  ok: boolean;
  summary: {
    twoLenses: number;
    derivedConnections: number;
    learningPaths: number;
    resolvedReferences: number;
    pendingReferences: number;
    externalReferences: number;
    brokenReferences: number;
    warnings: number;
    errors: number;
  };
  references: RouteFeedbackReference[];
  issues: Phase3ValidationIssue[];
}

function collectReferences(data: Phase3Export): Array<{ path: string; reference: SiteReference }> {
  return [
    ...data.twoLenses.flatMap((link, index) => [
      { path: `twoLenses[${index}].mathematical`, reference: link.mathematical },
      { path: `twoLenses[${index}].political`, reference: link.political },
    ]),
    ...data.derivedConnections.flatMap((connection, index) => [
      { path: `derivedConnections[${index}].source`, reference: connection.source },
      { path: `derivedConnections[${index}].target`, reference: connection.target },
    ]),
  ];
}

export function createRouteFeedback(
  data: Phase3Export,
  registry: SiteRouteRegistry,
  generatedAt = new Date().toISOString(),
): RouteFeedbackReport {
  const validation = validatePhase3Export(data, { registry });
  const references = collectReferences(data).map(({ path, reference }) => {
    const resolution = resolveSiteReference(reference, registry);
    return {
      path,
      id: reference.id,
      kind: reference.kind,
      status: reference.status,
      resolution: resolution.reason,
    };
  });

  const resolvedReferences = references.filter(
    (reference) => reference.resolution === 'resolved',
  ).length;
  const pendingReferences = references.filter(
    (reference) => reference.resolution === 'pending',
  ).length;
  const externalReferences = references.filter(
    (reference) => reference.resolution === 'external',
  ).length;
  const brokenReferences = references.filter((reference) =>
    ['missing', 'invalid'].includes(reference.resolution),
  ).length;

  return {
    generatedAt,
    ok: validation.ok,
    summary: {
      twoLenses: data.twoLenses.length,
      derivedConnections: data.derivedConnections.length,
      learningPaths: data.learningPaths.length,
      resolvedReferences,
      pendingReferences,
      externalReferences,
      brokenReferences,
      warnings: validation.summary.warnings,
      errors: validation.summary.errors,
    },
    references,
    issues: validation.issues,
  };
}
```

- [ ] **Step 5: Implement promotion**

Create `src/lib/phase3/exporter/promotion.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Phase3Export } from '../contracts';
import {
  readPhase3ExportFile,
  validatePhase3Export,
} from '../loadGeneratedData';
import type { SiteRouteRegistry } from '../resolveSiteReferences';

export interface PromotePhase3CandidateOptions {
  candidatePath: string;
  destinationPath: string;
  registry: SiteRouteRegistry;
}

export function promotePhase3Candidate(
  options: PromotePhase3CandidateOptions,
): Phase3Export {
  const candidate = readPhase3ExportFile(options.candidatePath);
  const validation = validatePhase3Export(candidate, { registry: options.registry });

  if (!validation.ok) {
    const details = validation.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => `${issue.code}${issue.path ? ` at ${issue.path}` : ''}`)
      .join(', ');
    throw new Error(`Cannot promote Phase 3 candidate: ${details}`);
  }

  mkdirSync(dirname(options.destinationPath), { recursive: true });
  writeFileSync(
    options.destinationPath,
    `${JSON.stringify(validation.data ?? candidate, null, 2)}\n`,
    'utf-8',
  );

  return validation.data ?? candidate;
}
```

- [ ] **Step 6: Run route feedback and promotion tests**

Run:

```bash
npm run test -- src/lib/phase3/exporter/routeFeedback.test.ts src/lib/phase3/exporter/promotion.test.ts
```

Expected: tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/phase3/exporter/routeFeedback.ts src/lib/phase3/exporter/routeFeedback.test.ts src/lib/phase3/exporter/promotion.ts src/lib/phase3/exporter/promotion.test.ts
git commit -m "feat: report and promote phase 3 candidates"
```

## Task 6: CLI Commands And Package Scripts

**Files:**
- Create: `scripts/phase3/cli.ts`
- Test: `scripts/phase3/cli.test.ts`
- Create: `scripts/phase3/source-inventory.ts`
- Create: `scripts/phase3/export-candidate.ts`
- Create: `scripts/phase3/promote.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing CLI helper tests**

Create `scripts/phase3/cli.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  optionFromArgsOrEnv,
  parsePhase3Args,
  requiredOption,
} from './cli';

describe('parsePhase3Args', () => {
  it('parses --flag value pairs', () => {
    expect(parsePhase3Args(['--tda-vault', 'C:/TDA', '--report', 'report.json'])).toEqual({
      'tda-vault': 'C:/TDA',
      report: 'report.json',
    });
  });

  it('parses boolean flags', () => {
    expect(parsePhase3Args(['--pretty'])).toEqual({ pretty: true });
  });
});

describe('optionFromArgsOrEnv', () => {
  it('prefers args over env values', () => {
    expect(
      optionFromArgsOrEnv(
        { 'tda-vault': 'C:/arg' },
        'tda-vault',
        'PHASE3_TDA_VAULT',
        { PHASE3_TDA_VAULT: 'C:/env' },
      ),
    ).toBe('C:/arg');
  });
});

describe('requiredOption', () => {
  it('throws with an actionable message when no value is present', () => {
    expect(() =>
      requiredOption({}, 'tda-vault', 'PHASE3_TDA_VAULT', {}),
    ).toThrow(/Missing required option --tda-vault/);
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- scripts/phase3/cli.test.ts
```

Expected: fail because `./cli` does not exist.

- [ ] **Step 3: Implement CLI helpers**

Create `scripts/phase3/cli.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type ParsedPhase3Args = Record<string, string | boolean>;

export const defaultCandidatePath = join(
  process.cwd(),
  'src/data/generated/phase3/candidates/site-connections.candidate.json',
);

export const defaultFeedbackReportPath = join(
  process.cwd(),
  'reports/phase3/site-connections.feedback.json',
);

export const defaultInventoryReportPath = join(
  process.cwd(),
  'reports/phase3/source-inventory.json',
);

export const defaultPromotedPath = join(
  process.cwd(),
  'src/data/generated/phase3/site-connections.json',
);

export function parsePhase3Args(argv: string[]): ParsedPhase3Args {
  const parsed: ParsedPhase3Args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

export function optionFromArgsOrEnv(
  args: ParsedPhase3Args,
  key: string,
  envKey: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = args[key];
  if (typeof value === 'string' && value.trim()) return value;
  const envValue = env[envKey];
  return envValue && envValue.trim() ? envValue : undefined;
}

export function requiredOption(
  args: ParsedPhase3Args,
  key: string,
  envKey: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = optionFromArgsOrEnv(args, key, envKey, env);
  if (!value) {
    throw new Error(`Missing required option --${key} or environment variable ${envKey}.`);
  }
  return value;
}

export function stringOption(
  args: ParsedPhase3Args,
  key: string,
  fallback: string,
): string {
  const value = args[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
```

- [ ] **Step 4: Add source inventory command**

Create `scripts/phase3/source-inventory.ts`:

```ts
import { inspectVaultSources } from '../../src/lib/phase3/exporter/sourceInventory';
import {
  defaultInventoryReportPath,
  optionFromArgsOrEnv,
  parsePhase3Args,
  stringOption,
  writeJson,
} from './cli';

function main(): void {
  const args = parsePhase3Args(process.argv.slice(2));
  const tdaVault = optionFromArgsOrEnv(args, 'tda-vault', 'PHASE3_TDA_VAULT');
  const countingLivesVault = optionFromArgsOrEnv(
    args,
    'counting-lives-vault',
    'PHASE3_COUNTING_LIVES_VAULT',
  );
  const reportPath = stringOption(args, 'report', defaultInventoryReportPath);

  const report = inspectVaultSources([
    {
      sourceId: 'tda-research',
      sourceType: 'obsidian-vault',
      label: 'TDA Research vault',
      root: tdaVault ?? '',
    },
    {
      sourceId: 'counting-lives',
      sourceType: 'obsidian-vault',
      label: 'Counting Lives vault',
      root: countingLivesVault ?? '',
    },
  ]);

  writeJson(reportPath, report);
  console.log(
    `[phase3] inventory: sources=${report.sources.length}, warnings=${report.warnings.length}`,
  );
  console.log(`[phase3] wrote ${reportPath}`);
}

main();
```

- [ ] **Step 5: Add candidate export command**

Create `scripts/phase3/export-candidate.ts`:

```ts
import { buildPhase3Candidate } from '../../src/lib/phase3/exporter/candidateBuilder';
import { createRouteFeedback } from '../../src/lib/phase3/exporter/routeFeedback';
import { inspectVaultSources } from '../../src/lib/phase3/exporter/sourceInventory';
import { scanVaultNotes } from '../../src/lib/phase3/exporter/vaultScanner';
import { buildSiteRouteRegistryFromWorkspace } from '../../src/lib/phase3/siteRouteRegistry';
import {
  defaultCandidatePath,
  defaultFeedbackReportPath,
  parsePhase3Args,
  requiredOption,
  stringOption,
  writeJson,
} from './cli';

function main(): void {
  const args = parsePhase3Args(process.argv.slice(2));
  const tdaVault = requiredOption(args, 'tda-vault', 'PHASE3_TDA_VAULT');
  const countingLivesVault = requiredOption(
    args,
    'counting-lives-vault',
    'PHASE3_COUNTING_LIVES_VAULT',
  );
  const outPath = stringOption(args, 'out', defaultCandidatePath);
  const reportPath = stringOption(args, 'report', defaultFeedbackReportPath);

  const inventory = inspectVaultSources([
    {
      sourceId: 'tda-research',
      sourceType: 'obsidian-vault',
      label: 'TDA Research vault',
      root: tdaVault,
    },
    {
      sourceId: 'counting-lives',
      sourceType: 'obsidian-vault',
      label: 'Counting Lives vault',
      root: countingLivesVault,
    },
  ]);
  const scans = [
    scanVaultNotes({ root: tdaVault, sourceId: 'tda-research' }),
    scanVaultNotes({ root: countingLivesVault, sourceId: 'counting-lives' }),
  ];
  const candidate = buildPhase3Candidate({ inventory, scans });
  const feedback = createRouteFeedback(
    candidate,
    buildSiteRouteRegistryFromWorkspace(process.cwd()),
  );

  writeJson(outPath, candidate);
  writeJson(reportPath, feedback);
  console.log(
    `[phase3] candidate: twoLenses=${candidate.twoLenses.length}, derivedConnections=${candidate.derivedConnections.length}`,
  );
  console.log(
    `[phase3] feedback: warnings=${feedback.summary.warnings}, errors=${feedback.summary.errors}, broken=${feedback.summary.brokenReferences}`,
  );
  console.log(`[phase3] wrote ${outPath}`);
  console.log(`[phase3] wrote ${reportPath}`);
}

main();
```

- [ ] **Step 6: Add promotion command**

Create `scripts/phase3/promote.ts`:

```ts
import { promotePhase3Candidate } from '../../src/lib/phase3/exporter/promotion';
import { buildSiteRouteRegistryFromWorkspace } from '../../src/lib/phase3/siteRouteRegistry';
import {
  defaultCandidatePath,
  defaultPromotedPath,
  parsePhase3Args,
  stringOption,
} from './cli';

function main(): void {
  const args = parsePhase3Args(process.argv.slice(2));
  const candidatePath = stringOption(args, 'candidate', defaultCandidatePath);
  const destinationPath = stringOption(args, 'out', defaultPromotedPath);
  const promoted = promotePhase3Candidate({
    candidatePath,
    destinationPath,
    registry: buildSiteRouteRegistryFromWorkspace(process.cwd()),
  });

  console.log(
    `[phase3] promoted: twoLenses=${promoted.twoLenses.length}, derivedConnections=${promoted.derivedConnections.length}`,
  );
  console.log(`[phase3] wrote ${destinationPath}`);
}

main();
```

- [ ] **Step 7: Add package scripts**

Modify `package.json` scripts:

```json
"phase3:inventory": "tsx scripts/phase3/source-inventory.ts",
"phase3:export:candidate": "tsx scripts/phase3/export-candidate.ts",
"phase3:promote": "tsx scripts/phase3/promote.ts",
```

Keep `validate:phase3` and `verify:phase3` unchanged.

- [ ] **Step 8: Run CLI helper tests and TypeScript check**

Run:

```bash
npm run test -- scripts/phase3/cli.test.ts
npm run check
```

Expected: CLI helper tests pass; Astro check has zero errors.

- [ ] **Step 9: Run fixture command smoke tests**

Create two temporary fixture vaults outside the repository and run:

```bash
npm run phase3:inventory -- --tda-vault <temp-tda-vault> --counting-lives-vault <temp-counting-lives-vault> --report <temp-report-json>
npm run phase3:export:candidate -- --tda-vault <temp-tda-vault> --counting-lives-vault <temp-counting-lives-vault> --out <temp-candidate-json> --report <temp-feedback-json>
```

Expected: both commands exit zero, write the requested JSON files, and do not
modify `src/data/generated/phase3/site-connections.json`.

- [ ] **Step 10: Commit**

```bash
git add package.json scripts/phase3/cli.ts scripts/phase3/cli.test.ts scripts/phase3/source-inventory.ts scripts/phase3/export-candidate.ts scripts/phase3/promote.ts
git commit -m "feat: add phase 3 export commands"
```

## Task 7: Final Verification

**Files:**
- No new files unless earlier tasks uncovered a necessary correction.

- [ ] **Step 1: Run targeted Phase 3 exporter tests**

Run:

```bash
npm run test -- src/lib/phase3 scripts/phase3
```

Expected: all Phase 3 and CLI tests pass.

- [ ] **Step 2: Run Phase 3 verification gate**

Run:

```bash
npm run verify:phase3
```

Expected: generated data validation succeeds, Phase 3 tests pass, and Astro
check has zero errors. Existing pending-reference fixture warnings may remain.

- [ ] **Step 3: Run full project verification**

Run:

```bash
npm run test
npm run build
```

Expected: all tests pass and Astro build exits zero. Existing Zotero env-var,
Vite alias, plugin timing, and chunk-size warnings may remain if they match the
current project baseline.

- [ ] **Step 4: Confirm no build-time vault dependency**

Run:

```bash
rg -n "PHASE3_TDA_VAULT|PHASE3_COUNTING_LIVES_VAULT|C:\\\\Users\\\\steph\\\\TDL|Documents\\\\TDA-Research|Documents\\\\Counting Lives|scanVaultNotes|inspectVaultSources" src scripts
```

Expected: live vault paths and scanner calls appear only in exporter scripts,
tests, docs, or exporter library files. They must not appear in Astro pages,
layouts, components, or the rendering reader used by public pages.

- [ ] **Step 5: Confirm worktree state**

Run:

```bash
git status --short
```

Expected: clean worktree after all task commits.

## Final Review Checklist

- [ ] Candidate files are staged under
  `src/data/generated/phase3/candidates/` by default.
- [ ] Public generated JSON changes only through `npm run phase3:promote`.
- [ ] Exporter commands require explicit vault paths or env vars.
- [ ] Unit tests use fixture roots and do not read user-specific live vaults.
- [ ] `npm run build` remains independent of live vault paths.
- [ ] Final response lists commits, verification commands, and any retained
  baseline warnings.
