import { describe, expect, it } from 'vitest';
import type { Phase3Export, TwoLensesLink } from './contracts';
import { confirmedTwoLensesLinks } from './twoLensesRendering';

function link(id: string, status: TwoLensesLink['status']): TwoLensesLink {
  return {
    id,
    title: id,
    status,
    mathematical: {
      kind: 'paper',
      id: 'paper-10',
      status: 'resolved',
      label: 'Paper 10',
      title: 'Topological Fairness Analysis',
    },
    political: {
      kind: 'chapter',
      id: 'ch-17',
      status: 'resolved',
      label: 'Chapter 17',
      title: 'Toward an Ethics of Measurement',
    },
    rationale: 'Shared measurement question.',
    websitePath: '/learn/',
    concepts: ['measurement ethics'],
    sourceNoteRefs: [],
    zoteroKeys: [],
  };
}

const data: Phase3Export = {
  manifest: {
    schemaVersion: '1.0.0',
    generatedAt: '2026-06-13T00:00:00.000Z',
    exporter: { name: 'manual-fixture', version: '1.0.0' },
    sources: [],
    warnings: [],
  },
  twoLenses: [link('confirmed-link', 'confirmed'), link('draft-link', 'draft')],
  derivedConnections: [],
  learningPaths: [],
};

describe('confirmedTwoLensesLinks', () => {
  it('returns confirmed links and omits draft links', () => {
    expect(confirmedTwoLensesLinks(data).map((entry) => entry.id)).toEqual([
      'confirmed-link',
    ]);
  });

  it('keeps paired mathematical and political labels for rendering', () => {
    const [entry] = confirmedTwoLensesLinks(data);

    expect(entry).toMatchObject({
      href: '/learn/',
      mathematical: { label: 'Paper 10' },
      political: { label: 'Chapter 17' },
    });
  });
});
