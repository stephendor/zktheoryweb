import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Phase3Export } from './contracts';
import { loadPhase3RenderingData } from './renderingData';
import { createSiteRouteRegistry } from './resolveSiteReferences';

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  papers: ['paper-10'],
  methods: ['persistent-homology'],
  interludes: ['mm3-logistic-regression'],
  learnModules: ['path3-module-6'],
  interactives: [],
  writingNotes: [],
  writingEssays: [],
});

const chapterRef = {
  kind: 'chapter',
  id: 'ch-17',
  status: 'resolved',
  label: 'Chapter 17',
  title: 'Toward an Ethics of Measurement',
} as const;

const paperRef = {
  kind: 'paper',
  id: 'paper-10',
  status: 'resolved',
  label: 'Paper 10',
  title: 'Topological Fairness Analysis',
} as const;

const methodRef = {
  kind: 'method',
  id: 'persistent-homology',
  status: 'resolved',
  label: 'Persistent Homology',
  title: 'Persistent Homology',
} as const;

const tempRoots: string[] = [];

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'phase3-rendering-'));
  tempRoots.push(root);
  return root;
}

function phase3ExportFixture(
  options: {
    generatedAt?: string;
    sourceId?: string;
    warningCode?: string;
    twoLenses?: Phase3Export['twoLenses'];
    derivedConnections?: Phase3Export['derivedConnections'];
    learningPaths?: Phase3Export['learningPaths'];
  } = {},
): Phase3Export {
  const sourceId = options.sourceId ?? 'manual-source';

  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt: options.generatedAt ?? '2026-06-13T12:00:00.000Z',
      exporter: { name: 'manual-fixture', version: '1.0.0' },
      sources: [
        {
          sourceId,
          sourceType: 'manual-fixture',
          label: `Manual source ${sourceId}`,
        },
      ],
      warnings: options.warningCode
        ? [
            {
              code: options.warningCode,
              message: `Warning ${options.warningCode}`,
              sourceId,
            },
          ]
        : [],
    },
    twoLenses: options.twoLenses ?? [],
    derivedConnections: options.derivedConnections ?? [],
    learningPaths: options.learningPaths ?? [],
  };
}

function twoLensesLink(id = 'two-lenses-ch17-paper10'): Phase3Export['twoLenses'][number] {
  return {
    id,
    title: 'Paper 10 and Chapter 17',
    status: 'confirmed',
    mathematical: paperRef,
    political: chapterRef,
    rationale:
      'Paper 10 formalises fairness diagnostics while Chapter 17 frames measurement as a political obligation.',
    websitePath: '/learn/paper-10-chapter-17/',
    concepts: ['fairness', 'measurement ethics'],
    sourceNoteRefs: [],
    zoteroKeys: [],
  };
}

function methodConnection(
  id = 'ch17-persistent-homology',
): Phase3Export['derivedConnections'][number] {
  return {
    id,
    source: chapterRef,
    target: methodRef,
    connectionType: 'method-used',
    confidence: 'reviewed',
    rationale: 'Chapter 17 uses persistent homology as part of its measurement argument.',
    origin: 'manual-curation',
  };
}

function dataJusticePath(
  connectionId = 'ch17-persistent-homology',
): Phase3Export['learningPaths'][number] {
  return {
    pathSlug: 'data-justice',
    generatedModules: [
      {
        moduleId: 'path3-module-6',
        concepts: ['data justice'],
        sourceNoteRefs: [],
        status: 'aligned',
      },
    ],
    recommendedConnections: [connectionId],
    twoLensesIds: ['two-lenses-ch17-paper10'],
  };
}

function writeExport(directory: string, filename: string, data: Phase3Export): void {
  writeFileSync(join(directory, filename), JSON.stringify(data, null, 2));
}

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

describe('loadPhase3RenderingData', () => {
  it('ignores fixture subdirectories and returns empty arrays when no direct JSON exists', () => {
    const root = createTempRoot();
    const fixtureDirectory = join(root, 'fixtures', 'valid');
    mkdirSync(fixtureDirectory, { recursive: true });
    writeExport(
      fixtureDirectory,
      'ignored.json',
      phase3ExportFixture({ twoLenses: [twoLensesLink()] }),
    );

    const data = loadPhase3RenderingData({ root, registry });

    expect(data).toMatchObject({
      manifest: {
        schemaVersion: '1.0.0',
        generatedAt: '1970-01-01T00:00:00.000Z',
        exporter: { name: 'phase3-rendering-reader', version: '1.0.0' },
        sources: [],
        warnings: [],
      },
      twoLenses: [],
      derivedConnections: [],
      learningPaths: [],
    });
  });

  it('loads and combines direct generated JSON files', () => {
    const root = createTempRoot();
    writeFileSync(join(root, 'notes.txt'), 'not generated data');
    writeExport(
      root,
      'b.json',
      phase3ExportFixture({
        generatedAt: '2026-06-13T13:00:00.000Z',
        sourceId: 'source-b',
        warningCode: 'warn-b',
        derivedConnections: [methodConnection()],
        learningPaths: [dataJusticePath()],
      }),
    );
    writeExport(
      root,
      'a.json',
      phase3ExportFixture({
        generatedAt: '2026-06-13T12:00:00.000Z',
        sourceId: 'source-a',
        warningCode: 'warn-a',
        twoLenses: [twoLensesLink()],
      }),
    );

    const data = loadPhase3RenderingData({ root, registry });

    expect(data.manifest).toMatchObject({
      schemaVersion: '1.0.0',
      generatedAt: '2026-06-13T12:00:00.000Z',
      exporter: { name: 'phase3-rendering-reader', version: '1.0.0' },
    });
    expect(data.manifest.sources.map((source) => source.sourceId)).toEqual([
      'source-a',
      'source-b',
    ]);
    expect(data.manifest.warnings.map((warning) => warning.code)).toEqual([
      'warn-a',
      'warn-b',
    ]);
    expect(data.twoLenses.map((link) => link.id)).toEqual([
      'two-lenses-ch17-paper10',
    ]);
    expect(data.derivedConnections.map((connection) => connection.id)).toEqual([
      'ch17-persistent-homology',
    ]);
    expect(data.learningPaths.map((path) => path.pathSlug)).toEqual(['data-justice']);
  });

  it('throws with file and issue details for invalid direct JSON', () => {
    const root = createTempRoot();
    writeExport(
      root,
      'broken.json',
      phase3ExportFixture({
        derivedConnections: [
          {
            ...methodConnection(),
            target: {
              kind: 'paper',
              id: 'paper-99',
              status: 'resolved',
              label: 'Paper 99',
              title: 'Missing Paper',
            },
          },
        ],
      }),
    );

    expect(() => loadPhase3RenderingData({ root, registry })).toThrow(
      /Invalid Phase 3 generated data.*broken\.json.*unresolved-reference/s,
    );
  });
});
