import { describe, expect, it } from 'vitest';
import type { Phase3Export, SiteReference } from '../contracts';
import { createSiteRouteRegistry } from '../resolveSiteReferences';
import { createRouteFeedback } from './routeFeedback';

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  methods: ['persistent-homology'],
});

function ref(fields: Partial<SiteReference>): SiteReference {
  return {
    kind: 'chapter',
    id: 'ch-17',
    status: 'resolved',
    label: 'Chapter 17',
    title: 'Toward an Ethics of Measurement',
    ...fields,
  } as SiteReference;
}

function exportWithRefs(source: SiteReference, target: SiteReference): Phase3Export {
  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt: '2026-06-14T00:00:00.000Z',
      exporter: { name: 'test', version: '1.0.0' },
      sources: [],
      warnings: [],
    },
    twoLenses: [],
    derivedConnections: [
      {
        id: 'test-connection',
        source,
        target,
        connectionType: 'manual-curation',
        confidence: 'reviewed',
        rationale: 'Test connection.',
        origin: 'manual-curation',
      },
    ],
    learningPaths: [],
  };
}

describe('createRouteFeedback', () => {
  it('counts resolved and pending references', () => {
    const report = createRouteFeedback(
      exportWithRefs(
        ref({ kind: 'chapter', id: 'ch-17' }),
        ref({
          kind: 'method',
          id: 'future-method',
          status: 'pending',
          label: 'Method',
          title: 'Future Method',
        }),
      ),
      registry,
      '2026-06-14T00:00:00.000Z',
    );

    expect(report.ok).toBe(true);
    expect(report.summary.resolvedReferences).toBe(1);
    expect(report.summary.pendingReferences).toBe(1);
    expect(report.summary.brokenReferences).toBe(0);
  });

  it('counts broken resolved references and exposes validation issues', () => {
    const report = createRouteFeedback(
      exportWithRefs(
        ref({ kind: 'chapter', id: 'missing-chapter' }),
        ref({ kind: 'method', id: 'persistent-homology' }),
      ),
      registry,
      '2026-06-14T00:00:00.000Z',
    );

    expect(report.ok).toBe(false);
    expect(report.summary.brokenReferences).toBe(1);
    expect(report.issues.map((issue) => issue.code)).toContain(
      'unresolved-reference',
    );
  });
});
