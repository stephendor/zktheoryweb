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

  it('keeps parsed frontmatter on scanned notes', () => {
    const root = tempRoot();
    write(root, 'note.md', '---\ntitle: Frontmatter Title\ncustom: value\n---\nBody');

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes[0]?.frontmatter).toMatchObject({
      title: 'Frontmatter Title',
      custom: 'value',
    });
  });

  it('parses frontmatter when markdown starts with a UTF-8 BOM', () => {
    const root = tempRoot();
    write(root, 'bom.md', '\uFEFF---\ntitle: BOM Title\n---\n# Body Title\n');

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes[0]?.title).toBe('BOM Title');
    expect(result.notes[0]?.frontmatter).toMatchObject({ title: 'BOM Title' });
  });

  it('extracts citation citekeys without treating emails or at-rules as citations', () => {
    const root = tempRoot();
    write(
      root,
      'citations.md',
      `# Citations

Pandoc bracket [@bauer2021ripser; @carlsson2009topology].
Inline citation @zomorian2005computing appears in prose.
Email person@example.com should not count.
CSS @media should not count.
Handle @zktheory should not count.
`,
    );

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes[0]?.citekeys).toEqual([
      'bauer2021ripser',
      'carlsson2009topology',
      'zomorian2005computing',
    ]);
  });

  it('preserves endpoint metadata with note source id and parsed site reference', () => {
    const root = tempRoot();
    write(
      root,
      'note.md',
      `---
title: Bridge
two-lenses:
  mathematical:
    note: "04-Methods/Persistent-Homology.md"
    sourceId: "tda-research"
    site:
      kind: "method"
      id: "persistent-homology"
      status: "resolved"
      label: "Method"
      title: "Persistent Homology"
  political: "sections/Ethics.md"
---
Body`,
    );

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes[0]?.twoLenses?.mathematical).toMatchObject({
      note: '04-Methods/Persistent-Homology.md',
      sourceId: 'tda-research',
      site: { kind: 'method', id: 'persistent-homology' },
    });
    expect(result.notes[0]?.twoLenses?.mathematical).not.toHaveProperty('siteReference');
  });

  it('returns incomplete two lenses metadata for downstream warnings', () => {
    const root = tempRoot();
    write(
      root,
      'note.md',
      `---
title: Bridge
two-lenses:
  mathematical: "04-Methods/Persistent-Homology.md"
---
Body`,
    );

    const result = scanVaultNotes({ root, sourceId: 'tda-research' });

    expect(result.notes[0]?.twoLenses).toMatchObject({
      mathematical: '04-Methods/Persistent-Homology.md',
      concepts: [],
    });
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
