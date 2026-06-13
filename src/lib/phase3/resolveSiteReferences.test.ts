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
  it.each([
    {
      kind: 'chapter',
      id: 'ch-17',
      label: 'Chapter 17',
      title: 'Toward an Ethics of Measurement',
    },
    {
      kind: 'paper',
      id: 'paper-10',
      label: 'Paper 10',
      title: 'Wasserstein Poverty Dynamics',
    },
    {
      kind: 'method',
      id: 'persistent-homology',
      label: 'Persistent Homology',
      title: 'Persistent Homology',
    },
    {
      kind: 'interlude',
      id: 'mm3-logistic-regression',
      label: 'Methods Interlude',
      title: 'Logistic Regression',
    },
    {
      kind: 'learn-module',
      id: 'path3-module-6',
      label: 'Learning Module',
      title: 'Path 3 Module 6',
    },
    {
      kind: 'interactive',
      id: 'decision-threshold-explorer',
      label: 'Interactive',
      title: 'Decision Threshold Explorer',
    },
    {
      kind: 'writing-note',
      id: 'sample-note',
      label: 'Writing Note',
      title: 'Sample Note',
    },
    {
      kind: 'writing-essay',
      id: 'orshansky-poverty-line',
      label: 'Writing Essay',
      title: 'Orshansky Poverty Line',
    },
  ] satisfies Array<
    Pick<SiteReference, 'kind' | 'id' | 'label' | 'title'>
  >)('resolves an existing internal $kind reference', (referenceFields) => {
    const reference: SiteReference = {
      ...referenceFields,
      status: 'resolved',
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

  it('rejects an external kind with a non-external status', () => {
    const reference: SiteReference = {
      kind: 'external',
      id: 'malformed-external',
      status: 'pending',
      href: 'https://www.zotero.org/',
      label: 'Malformed External',
      title: 'Malformed External Reference',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: false,
      reason: 'invalid',
    });
  });

  it('rejects an external status on an internal kind', () => {
    const reference: SiteReference = {
      kind: 'paper',
      id: 'paper-10',
      status: 'external',
      label: 'Paper 10',
      title: 'Malformed Internal Reference',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: false,
      reason: 'invalid',
    });
  });

  it('resolves an internal reference by slug fallback', () => {
    const reference: SiteReference = {
      kind: 'chapter',
      id: 'toward-an-ethics-of-measurement',
      slug: 'ch-17',
      status: 'resolved',
      label: 'Chapter 17',
      title: 'Toward an Ethics of Measurement',
    };

    expect(resolveSiteReference(reference, registry)).toEqual({
      resolved: true,
      reason: 'resolved',
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
