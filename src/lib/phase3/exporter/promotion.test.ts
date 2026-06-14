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
    const destinationPath = join(
      root,
      'src/data/generated/phase3/site-connections.json',
    );
    writeFileSync(candidatePath, JSON.stringify(validExport()), 'utf-8');

    promotePhase3Candidate({ candidatePath, destinationPath, registry });

    const promoted = JSON.parse(
      readFileSync(destinationPath, 'utf-8'),
    ) as Phase3Export;
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
