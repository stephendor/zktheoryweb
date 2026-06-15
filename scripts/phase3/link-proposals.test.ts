import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-linker-cli-'));
}

function write(root: string, relativePath: string, text: string): string {
  const filePath = join(root, relativePath);
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, text, 'utf-8');
  return filePath;
}

function runLinker(args: string[]): string {
  return execFileSync(process.execPath, [
    join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    'scripts/phase3/link-proposals.ts',
    ...args,
  ], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function note(title: string, kind: 'method' | 'chapter', id: string): string {
  return `---
title: "${title}"
citekey: "sen1976"
site:
  kind: "${kind}"
  id: "${id}"
  status: "resolved"
  label: "${kind}"
  title: "${title}"
concepts:
  - "measurement"
---

# ${title}
`;
}

describe('phase3:link:propose command', () => {
  it('writes report and metadata candidates without touching vault notes', () => {
    const root = tempRoot();
    const tdaVault = join(root, 'tda');
    const countingLivesVault = join(root, 'counting-lives');
    write(tdaVault, 'VAULT-MAP.md', '# TDA Research Vault\n');
    write(countingLivesVault, 'VAULT-MAP.md', '# Counting Lives Vault\n');
    const tdaNotePath = write(
      tdaVault,
      'methods/persistent-homology.md',
      note('Persistent Homology', 'method', 'persistent-homology'),
    );
    const countingLivesNotePath = write(
      countingLivesVault,
      'chapters/ch-17.md',
      note('Toward an Ethics of Measurement', 'chapter', 'ch-17'),
    );
    const originalTdaNote = readFileSync(tdaNotePath, 'utf-8');
    const originalCountingLivesNote = readFileSync(countingLivesNotePath, 'utf-8');
    const reportPath = join(root, 'reports', 'cross-vault-linker.report.json');
    const metadataPath = join(root, 'reports', 'cross-vault-linker.metadata-candidates.md');

    const output = runLinker([
      '--tda-vault',
      tdaVault,
      '--counting-lives-vault',
      countingLivesVault,
      '--report',
      reportPath,
      '--metadata-candidates',
      metadataPath,
    ]);

    expect(output).toContain('Phase 3 link proposals: 1 proposals');
    expect(existsSync(reportPath)).toBe(true);
    expect(existsSync(metadataPath)).toBe(true);

    const report = JSON.parse(readFileSync(reportPath, 'utf-8')) as {
      summary: { proposals: number; strong: number };
      proposals: Array<{ id: string; metadataCandidate: { status: string } }>;
      warnings: unknown[];
    };
    expect(report.summary).toMatchObject({ proposals: 1, strong: 1 });
    expect(report.proposals[0]).toMatchObject({
      id: 'link-method-persistent-homology-chapter-ch-17',
      metadataCandidate: { status: 'draft' },
    });
    expect(report.warnings).toEqual([]);

    const metadata = readFileSync(metadataPath, 'utf-8');
    expect(metadata).toContain('Do not paste these blocks without human review.');
    expect(metadata).toContain('status: "draft"');
    expect(metadata).toContain('sourceId: "tda-research"');
    expect(metadata.endsWith('\n')).toBe(true);

    expect(readFileSync(tdaNotePath, 'utf-8')).toBe(originalTdaNote);
    expect(readFileSync(countingLivesNotePath, 'utf-8')).toBe(originalCountingLivesNote);
  });

  it('rejects attempts to write linker outputs inside a source vault', () => {
    const root = tempRoot();
    const tdaVault = join(root, 'tda');
    const countingLivesVault = join(root, 'counting-lives');
    write(tdaVault, 'method.md', note('Persistent Homology', 'method', 'persistent-homology'));
    write(
      countingLivesVault,
      'chapter.md',
      note('Toward an Ethics of Measurement', 'chapter', 'ch-17'),
    );

    expect(() =>
      runLinker([
        '--tda-vault',
        tdaVault,
        '--counting-lives-vault',
        countingLivesVault,
        '--report',
        join(tdaVault, 'reports', 'cross-vault-linker.report.json'),
        '--metadata-candidates',
        join(root, 'metadata.md'),
      ]),
    ).toThrow(/Refusing to write Phase 3 linker output inside a source root/);
  });

  it('requires confirmed metadata candidate status to be explicit', () => {
    const root = tempRoot();
    const tdaVault = join(root, 'tda');
    const countingLivesVault = join(root, 'counting-lives');
    write(tdaVault, 'method.md', note('Persistent Homology', 'method', 'persistent-homology'));
    write(
      countingLivesVault,
      'chapter.md',
      note('Toward an Ethics of Measurement', 'chapter', 'ch-17'),
    );
    const reportPath = join(root, 'report.json');
    const metadataPath = join(root, 'metadata.md');

    runLinker([
      '--tda-vault',
      tdaVault,
      '--counting-lives-vault',
      countingLivesVault,
      '--report',
      reportPath,
      '--metadata-candidates',
      metadataPath,
      '--candidate-status',
      'confirmed',
    ]);

    expect(readFileSync(metadataPath, 'utf-8')).toContain('status: "confirmed"');
  });
});
