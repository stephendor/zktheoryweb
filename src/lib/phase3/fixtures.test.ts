import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { phase3ExportSchema } from './contracts';

const fixtureRoot = join(process.cwd(), 'src/data/generated/phase3/fixtures');

function readFixture(group: 'valid' | 'invalid', filename: string): unknown {
  return JSON.parse(
    readFileSync(join(fixtureRoot, group, filename), 'utf-8'),
  ) as unknown;
}

describe('Phase 3 fixture files', () => {
  it.each([
    'valid-minimal.json',
    'pending-reference.json',
    'proposed-link.json',
    'local-junction-path.json',
  ])('valid fixture %s parses with the base schema', (filename) => {
    const parsed = phase3ExportSchema.parse(readFixture('valid', filename));
    expect(parsed.manifest.schemaVersion).toBe('1.0.0');
  });

  it('valid-minimal fixture captures the baseline two-lenses export shape', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('valid', 'valid-minimal.json'),
    );

    expect(parsed.twoLenses).toHaveLength(1);
    expect(parsed.twoLenses[0]?.id).toBe('fairness-and-measurement-ethics');
    expect(parsed.derivedConnections).toHaveLength(1);
    expect(parsed.derivedConnections[0]?.id).toBe('ch17-paper10-two-lenses');
    expect(parsed.learningPaths).toHaveLength(1);
    expect(parsed.learningPaths[0]?.pathSlug).toBe('data-justice');
  });

  it('pending-reference fixture preserves a pending learn-module target', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('valid', 'pending-reference.json'),
    );

    expect(parsed.derivedConnections).toHaveLength(1);
    expect(parsed.derivedConnections[0]?.target).toMatchObject({
      id: 'topology-and-justice',
      status: 'pending',
    });
  });

  it('proposed-link fixture preserves cross-vault proposal metadata', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('valid', 'proposed-link.json'),
    );

    expect(parsed.derivedConnections).toHaveLength(1);
    expect(parsed.derivedConnections[0]).toMatchObject({
      confidence: 'proposed',
      origin: 'cross-vault-linker',
    });
  });

  it('local-junction-path fixture keeps local vault paths out of links', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('valid', 'local-junction-path.json'),
    );

    expect(parsed.manifest.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'obsidian-vault',
          localPath: 'C:\\Users\\steph\\TDL\\TDA-Research',
        }),
      ]),
    );
    expect(parsed.derivedConnections).toHaveLength(0);
  });

  it('invalid broken-reference fixture still has the base export shape', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('invalid', 'broken-reference.json'),
    );
    expect(parsed.derivedConnections[0]?.target.id).toBe('paper-99');
  });

  it('invalid duplicate-ids fixture still has the base export shape', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('invalid', 'duplicate-ids.json'),
    );
    expect(parsed.twoLenses.map((entry) => entry.id)).toEqual([
      'duplicate-two-lenses',
      'duplicate-two-lenses',
    ]);
  });
});
