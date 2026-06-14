import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSiteRouteRegistryFromWorkspace } from './siteRouteRegistry';

function tempWorkspace(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-registry-'));
}

function touch(root: string, relativePath: string): void {
  const filePath = join(root, relativePath);
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, '---\ntitle: Test\n---\n', 'utf-8');
}

describe('buildSiteRouteRegistryFromWorkspace', () => {
  it('collects markdown and mdx ids from the website content directories', () => {
    const root = tempWorkspace();
    touch(root, 'src/content/counting-lives/chapters/ch-17.mdx');
    touch(root, 'src/content/tda/papers/paper-10.md');
    touch(root, 'src/content/tda/methods/persistent-homology.mdx');
    touch(root, 'src/content/counting-lives/interludes/mm3-logistic-regression.md');
    touch(root, 'src/content/learn/path3-module-6.mdx');
    touch(root, 'src/content/interactives/mapper-lab.md');
    touch(root, 'src/content/writing/notes/measurement-ethics.md');
    touch(root, 'src/content/writing/essays/two-lenses.mdx');
    writeFileSync(
      join(root, 'src/content/tda/papers/not-content.txt'),
      'ignore me',
      'utf-8',
    );

    const registry = buildSiteRouteRegistryFromWorkspace(root);

    expect(registry.chapters.has('ch-17')).toBe(true);
    expect(registry.papers.has('paper-10')).toBe(true);
    expect(registry.methods.has('persistent-homology')).toBe(true);
    expect(registry.interludes.has('mm3-logistic-regression')).toBe(true);
    expect(registry.learnModules.has('path3-module-6')).toBe(true);
    expect(registry.interactives.has('mapper-lab')).toBe(true);
    expect(registry.writingNotes.has('measurement-ethics')).toBe(true);
    expect(registry.writingEssays.has('two-lenses')).toBe(true);
    expect(registry.papers.has('not-content')).toBe(false);
  });

  it('returns empty sets when content directories do not exist', () => {
    const registry = buildSiteRouteRegistryFromWorkspace(tempWorkspace());

    expect(registry.chapters.size).toBe(0);
    expect(registry.papers.size).toBe(0);
    expect(registry.learnModules.size).toBe(0);
  });
});
