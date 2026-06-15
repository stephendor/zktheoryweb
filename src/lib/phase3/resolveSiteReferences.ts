import type { SiteReference } from './contracts';

export interface SiteRouteRegistryInput {
  chapters?: string[];
  papers?: string[];
  methods?: string[];
  interludes?: string[];
  learnModules?: string[];
  interactives?: string[];
  writingNotes?: string[];
  writingEssays?: string[];
}

export interface SiteRouteRegistry {
  chapters: Set<string>;
  papers: Set<string>;
  methods: Set<string>;
  interludes: Set<string>;
  learnModules: Set<string>;
  interactives: Set<string>;
  writingNotes: Set<string>;
  writingEssays: Set<string>;
}

export interface ReferenceResolution {
  resolved: boolean;
  reason: 'resolved' | 'pending' | 'external' | 'missing' | 'invalid';
}

export function createSiteRouteRegistry(
  input: SiteRouteRegistryInput,
): SiteRouteRegistry {
  return {
    chapters: new Set(input.chapters ?? []),
    papers: new Set(input.papers ?? []),
    methods: new Set(input.methods ?? []),
    interludes: new Set(input.interludes ?? []),
    learnModules: new Set(input.learnModules ?? []),
    interactives: new Set(input.interactives ?? []),
    writingNotes: new Set(input.writingNotes ?? []),
    writingEssays: new Set(input.writingEssays ?? []),
  };
}

type InternalSiteReferenceKind = Exclude<SiteReference['kind'], 'external'>;

const registryKeyByKind = {
  chapter: 'chapters',
  paper: 'papers',
  method: 'methods',
  interlude: 'interludes',
  'learn-module': 'learnModules',
  interactive: 'interactives',
  'writing-note': 'writingNotes',
  'writing-essay': 'writingEssays',
} satisfies Record<InternalSiteReferenceKind, keyof SiteRouteRegistry>;

function idsForKind(
  reference: SiteReference,
  registry: SiteRouteRegistry,
): Set<string> | null {
  if (reference.kind === 'external') {
    return null;
  }

  return registry[registryKeyByKind[reference.kind]];
}

export function resolveSiteReference(
  reference: SiteReference,
  registry: SiteRouteRegistry,
): ReferenceResolution {
  const isExternalKind = reference.kind === 'external';
  const isExternalStatus = reference.status === 'external';

  if (isExternalKind || isExternalStatus) {
    if (isExternalKind && isExternalStatus) {
      return { resolved: true, reason: 'external' };
    }

    return { resolved: false, reason: 'invalid' };
  }

  if (reference.status === 'pending') {
    return { resolved: true, reason: 'pending' };
  }

  const ids = idsForKind(reference, registry);
  if (ids?.has(reference.id) || (reference.slug && ids?.has(reference.slug))) {
    return { resolved: true, reason: 'resolved' };
  }

  return { resolved: false, reason: 'missing' };
}
