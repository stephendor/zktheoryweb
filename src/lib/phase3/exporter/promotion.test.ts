import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Phase3Export } from '../contracts';
import { createSiteRouteRegistry } from '../resolveSiteReferences';
import {
  promotePhase3Candidate,
  writeFileAtomically,
} from './promotion';

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  papers: ['paper-10'],
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

function emptyExport(): Phase3Export {
  return { ...validExport(), derivedConnections: [] };
}

function exportWithConfirmedPair(): Phase3Export {
  return {
    ...emptyExport(),
    twoLenses: [
      {
        id: 'two-lenses-ch17-paper10',
        title: 'Paper 10 and Chapter 17',
        status: 'confirmed',
        mathematical: {
          kind: 'paper',
          id: 'paper-10',
          status: 'resolved',
          label: 'Paper 10',
          title: 'Topological Fairness Analysis',
        },
        political: {
          kind: 'chapter',
          id: 'ch-17',
          status: 'resolved',
          label: 'Chapter 17',
          title: 'Toward an Ethics of Measurement',
        },
        rationale: 'Test pair.',
        websitePath: '/learn/',
        concepts: ['fairness'],
        sourceNoteRefs: [],
        zoteroKeys: [],
      },
    ],
  };
}

function writePromotionFiles(
  current: Phase3Export,
  candidate: Phase3Export,
): { candidatePath: string; destinationPath: string; before: string } {
  const root = tempRoot();
  const candidatePath = join(root, 'candidate.json');
  const destinationPath = join(root, 'site-connections.json');
  const before = `${JSON.stringify(current, null, 2)}\n`;
  writeFileSync(candidatePath, JSON.stringify(candidate), 'utf-8');
  writeFileSync(destinationPath, before, 'utf-8');
  return { candidatePath, destinationPath, before };
}

describe('promotePhase3Candidate', () => {
  it('writes formatted JSON when candidate validation succeeds', () => {
    const root = tempRoot();
    const candidatePath = join(root, 'candidate.json');
    const destinationPath = join(
      root,
      'src/data/generated/phase3/site-connections.json',
    );
    writeFileSync(candidatePath, JSON.stringify(validExport()), 'utf-8');

    promotePhase3Candidate({ candidatePath, destinationPath, registry });

    const rawPromoted = readFileSync(destinationPath, 'utf-8');
    expect(rawPromoted).toContain('\n  "manifest": {');
    expect(rawPromoted.endsWith('\n')).toBe(true);

    const promoted = JSON.parse(rawPromoted) as Phase3Export;
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
    expect(existsSync(destinationPath)).toBe(false);
  });

  it('does not overwrite an existing destination when route validation fails', () => {
    const root = tempRoot();
    const candidate = validExport();
    candidate.derivedConnections[0]!.target.id = 'missing-method';
    const candidatePath = join(root, 'candidate.json');
    const destinationPath = join(root, 'site-connections.json');
    const existingDestination = '{"existing":true}\n';
    writeFileSync(candidatePath, JSON.stringify(candidate), 'utf-8');
    writeFileSync(destinationPath, existingDestination, 'utf-8');

    expect(() =>
      promotePhase3Candidate({ candidatePath, destinationPath, registry }),
    ).toThrow(/Cannot promote Phase 3 candidate/);
    expect(readFileSync(destinationPath, 'utf-8')).toBe(existingDestination);
  });

  it('writes through a same-directory temp file before renaming into place', () => {
    const root = tempRoot();
    const destinationPath = join(root, 'site-connections.json');

    const tempPath = writeFileAtomically(destinationPath, '{"ok":true}\n');

    expect(dirname(tempPath)).toBe(dirname(destinationPath));
    expect(basename(tempPath)).toContain('.site-connections.json.');
    expect(readFileSync(destinationPath, 'utf-8')).toBe('{"ok":true}\n');
    expect(
      readdirSync(root).filter((entry) =>
        entry.includes('.site-connections.json.'),
      ),
    ).toEqual([]);
  });
});

describe('promotePhase3Candidate drop guard', () => {
  it('refuses to overwrite a confirmed Two Lenses pair with an empty candidate', () => {
    const { candidatePath, destinationPath, before } = writePromotionFiles(
      exportWithConfirmedPair(),
      emptyExport(),
    );

    expect(() =>
      promotePhase3Candidate({ candidatePath, destinationPath, registry }),
    ).toThrow(/twoLenses: two-lenses-ch17-paper10/);
    expect(readFileSync(destinationPath, 'utf-8')).toBe(before);
  });

  it('refuses when a derived connection would be dropped', () => {
    const { candidatePath, destinationPath, before } = writePromotionFiles(
      validExport(),
      emptyExport(),
    );

    expect(() =>
      promotePhase3Candidate({ candidatePath, destinationPath, registry }),
    ).toThrow(/derivedConnections: ch17-ph/);
    expect(readFileSync(destinationPath, 'utf-8')).toBe(before);
  });

  it('refuses when the current manual-curation source is absent from the candidate', () => {
    const current = validExport();
    current.manifest.sources = [
      {
        sourceId: 'phase3-site-connections',
        sourceType: 'manual-curation',
        label: 'Phase 3 site connections',
      },
    ];
    const { candidatePath, destinationPath, before } = writePromotionFiles(
      current,
      validExport(),
    );

    expect(() =>
      promotePhase3Candidate({ candidatePath, destinationPath, registry }),
    ).toThrow(/manual-curation sources: phase3-site-connections/);
    expect(readFileSync(destinationPath, 'utf-8')).toBe(before);
  });

  it('refuses when the current file is not a valid export', () => {
    const root = tempRoot();
    const candidatePath = join(root, 'candidate.json');
    const destinationPath = join(root, 'site-connections.json');
    writeFileSync(candidatePath, JSON.stringify(emptyExport()), 'utf-8');
    writeFileSync(destinationPath, '{"existing":true}\n', 'utf-8');

    expect(() =>
      promotePhase3Candidate({ candidatePath, destinationPath, registry }),
    ).toThrow(/not a valid Phase 3 export/);
    expect(readFileSync(destinationPath, 'utf-8')).toBe('{"existing":true}\n');
  });

  it('promotes a candidate that is a superset of the current file', () => {
    const candidate = exportWithConfirmedPair();
    candidate.derivedConnections = validExport().derivedConnections;
    const { candidatePath, destinationPath } = writePromotionFiles(
      exportWithConfirmedPair(),
      candidate,
    );

    const promoted = promotePhase3Candidate({
      candidatePath,
      destinationPath,
      registry,
    });

    expect(promoted.twoLenses.map((link) => link.id)).toEqual([
      'two-lenses-ch17-paper10',
    ]);
    const written = JSON.parse(
      readFileSync(destinationPath, 'utf-8'),
    ) as Phase3Export;
    expect(written.derivedConnections.map((c) => c.id)).toEqual(['ch17-ph']);
  });

  it('overwrites with allowDrop even when entries would be dropped', () => {
    const { candidatePath, destinationPath } = writePromotionFiles(
      exportWithConfirmedPair(),
      emptyExport(),
    );

    promotePhase3Candidate({
      candidatePath,
      destinationPath,
      registry,
      allowDrop: true,
    });

    const written = JSON.parse(
      readFileSync(destinationPath, 'utf-8'),
    ) as Phase3Export;
    expect(written.twoLenses).toEqual([]);
  });
});
