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
  reason: 'resolved' | 'pending' | 'external' | 'missing';
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

function idsForKind(
  reference: SiteReference,
  registry: SiteRouteRegistry,
): Set<string> | null {
  switch (reference.kind) {
    case 'chapter':
      return registry.chapters;
    case 'paper':
      return registry.papers;
    case 'method':
      return registry.methods;
    case 'interlude':
      return registry.interludes;
    case 'learn-module':
      return registry.learnModules;
    case 'interactive':
      return registry.interactives;
    case 'writing-note':
      return registry.writingNotes;
    case 'writing-essay':
      return registry.writingEssays;
    case 'external':
      return null;
  }
}

export function resolveSiteReference(
  reference: SiteReference,
  registry: SiteRouteRegistry,
): ReferenceResolution {
  if (reference.status === 'pending') {
    return { resolved: true, reason: 'pending' };
  }

  if (reference.status === 'external' || reference.kind === 'external') {
    return { resolved: true, reason: 'external' };
  }

  const ids = idsForKind(reference, registry);
  if (ids?.has(reference.id) || (reference.slug && ids?.has(reference.slug))) {
    return { resolved: true, reason: 'resolved' };
  }

  return { resolved: false, reason: 'missing' };
}
