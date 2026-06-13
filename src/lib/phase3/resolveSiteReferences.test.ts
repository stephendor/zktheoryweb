import { describe, expect, it } from 'vitest';
import {
  createSiteRouteRegistry,
  resolveSiteReference,
} from './resolveSiteReferences';
import type { SiteReference } from './contracts';

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  papers: ['paper-10'],
  methods: ['persistent-homology'],
  interludes: ['mm3-logistic-regression'],
  learnModules: ['path3-module-6'],
  interactives: ['decision-threshold-explorer'],
  writingNotes: ['sample-note'],
  writingEssays: ['orshansky-poverty-line'],
});

describe('resolveSiteReference', () => {
  it('resolves an existing internal reference', () => {
    const reference: SiteReference = {
      kind: 'chapter',
      id: 'ch-17',
      status: 'resolved',
      label: 'Chapter 17',
      title: 'Toward an Ethics of Measurement',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: true,
      reason: 'resolved',
    });
  });

  it('does not require pending references to exist in the registry', () => {
    const reference: SiteReference = {
      kind: 'learn-module',
      id: 'topology-and-justice',
      status: 'pending',
      label: 'Learning Module',
      title: 'Topology and Justice',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: true,
      reason: 'pending',
    });
  });

  it('does not require external references to exist in the registry', () => {
    const reference: SiteReference = {
      kind: 'external',
      id: 'zotero-item',
      status: 'external',
      href: 'https://www.zotero.org/',
      label: 'Zotero',
      title: 'Zotero Item',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: true,
      reason: 'external',
    });
  });

  it('rejects a missing resolved internal reference', () => {
    const reference: SiteReference = {
      kind: 'paper',
      id: 'paper-99',
      status: 'resolved',
      label: 'Paper 99',
      title: 'Missing Paper',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: false,
      reason: 'missing',
    });
  });
});
