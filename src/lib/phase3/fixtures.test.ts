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
