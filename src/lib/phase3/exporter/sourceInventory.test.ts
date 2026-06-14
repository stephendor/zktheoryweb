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

  it('treats symbolic-link directory roots as available sources', () => {
    const deps: SourceInventoryDeps = {
      exists: () => true,
      isDirectory: () => true,
      isSymbolicLink: () => true,
      realpath: () => 'C:/Users/steph/Documents/TDA-Research',
      countMarkdownFiles: () => 3,
    };

    const entry = inspectVaultSource(
      {
        sourceId: 'tda-research',
        sourceType: 'obsidian-vault',
        label: 'TDA Research vault',
        root: 'C:/Users/steph/TDL/vault-link',
      },
      deps,
    );

    expect(entry.available).toBe(true);
    expect(entry.linkKind).toBe('symbolic-link');
    expect(entry.markdownFiles).toBe(3);
  });

  it('records a warning when markdown counting throws', () => {
    const deps: SourceInventoryDeps = {
      exists: () => true,
      isDirectory: () => true,
      isSymbolicLink: () => false,
      realpath: (path) => path,
      countMarkdownFiles: () => {
        throw new Error('EACCES: permission denied');
      },
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

    expect(entry.available).toBe(true);
    expect(entry.markdownFiles).toBe(0);
    expect(entry.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'markdown-count-failed',
          sourceId: 'tda-research',
        }),
      ]),
    );
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
