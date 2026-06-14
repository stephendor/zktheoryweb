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
      vaultMapPath:
        'C:/Users/steph/Documents/Counting Lives/Counting Lives/VAULT-MAP.md',
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
    ...(siteReference ? { siteReference } : {}),
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
      scans: [
        scan('tda-research', [mathematical]),
        scan('counting-lives', [political]),
      ],
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
    const tda = note(
      'tda-research',
      '04-Methods/Persistent-Homology.md',
      'PH',
      {
        kind: 'method',
        id: 'persistent-homology',
        status: 'resolved',
        label: 'Method',
        title: 'Persistent Homology',
      },
      { citekeys: ['bauer2021ripser'] },
    );
    const cl = note(
      'counting-lives',
      'sections/Ethics.md',
      'Ethics',
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
