import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSiteRouteRegistry } from './resolveSiteReferences';
import { readPhase3ExportFile, validatePhase3Export } from './loadGeneratedData';

const fixtureRoot = join(process.cwd(), 'src/data/generated/phase3/fixtures');

function fixturePath(group: 'valid' | 'invalid', filename: string): string {
  return join(fixtureRoot, group, filename);
}

function readFixture(group: 'valid' | 'invalid', filename: string): unknown {
  return JSON.parse(readFileSync(fixturePath(group, filename), 'utf-8')) as unknown;
}

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

describe('validatePhase3Export', () => {
  it('accepts valid-minimal without errors', () => {
    const result = validatePhase3Export(readFixture('valid', 'valid-minimal.json'), {
      registry,
    });

    expect(result.ok).toBe(true);
    expect(result.summary.errors).toBe(0);
    expect(result.summary.twoLenses).toBe(1);
    expect(result.summary.derivedConnections).toBe(1);
  });

  it('emits a warning for pending references', () => {
    const result = validatePhase3Export(readFixture('valid', 'pending-reference.json'), {
      registry,
    });

    expect(result.ok).toBe(true);
    expect(result.summary.warnings).toBe(1);
    expect(result.issues[0]).toMatchObject({
      severity: 'warning',
      code: 'pending-reference',
    });
  });

  it('does not require localPath to exist', () => {
    const result = validatePhase3Export(readFixture('valid', 'local-junction-path.json'), {
      registry,
    });

    expect(result.ok).toBe(true);
    expect(result.summary.errors).toBe(0);
  });

  it('reports missing resolved internal references', () => {
    const result = validatePhase3Export(readFixture('invalid', 'broken-reference.json'), {
      registry,
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unresolved-reference')).toBe(true);
  });

  it('reports duplicate record IDs', () => {
    const result = validatePhase3Export(readFixture('invalid', 'duplicate-ids.json'), { registry });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'duplicate-id')).toBe(true);
  });
});

describe('readPhase3ExportFile', () => {
  it('reads and parses a JSON export file', () => {
    const parsed = readPhase3ExportFile(fixturePath('valid', 'valid-minimal.json'));

    expect(parsed.manifest.exporter.name).toBe('manual-fixture');
  });
});
