import { existsSync, readdirSync } from 'node:fs';
import { extname, join, parse } from 'node:path';
import {
  createSiteRouteRegistry,
  type SiteRouteRegistry,
} from './resolveSiteReferences';

function mdIdsFromDirectory(workspaceRoot: string, relativeDir: string): string[] {
  const directory = join(workspaceRoot, relativeDir);
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => ['.md', '.mdx'].includes(extname(entry.name)))
    .map((entry) => parse(entry.name).name)
    .sort();
}

export function buildSiteRouteRegistryFromWorkspace(
  workspaceRoot = process.cwd(),
): SiteRouteRegistry {
  const chapters = mdIdsFromDirectory(
    workspaceRoot,
    'src/content/counting-lives/chapters',
  ).filter((id) => id !== 'ch-00-sample');

  return createSiteRouteRegistry({
    chapters,
    papers: mdIdsFromDirectory(workspaceRoot, 'src/content/tda/papers'),
    methods: mdIdsFromDirectory(workspaceRoot, 'src/content/tda/methods'),
    interludes: mdIdsFromDirectory(
      workspaceRoot,
      'src/content/counting-lives/interludes',
    ),
    learnModules: mdIdsFromDirectory(workspaceRoot, 'src/content/learn'),
    interactives: mdIdsFromDirectory(workspaceRoot, 'src/content/interactives'),
    writingNotes: mdIdsFromDirectory(workspaceRoot, 'src/content/writing/notes'),
    writingEssays: mdIdsFromDirectory(workspaceRoot, 'src/content/writing/essays'),
  });
}
