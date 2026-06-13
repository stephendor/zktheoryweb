import { describe, expect, it } from 'vitest';
import {
  phase3ExportSchema,
  siteReferenceSchema,
  twoLensesLinkSchema,
} from './contracts';

const chapterRef = {
  kind: 'chapter',
  id: 'ch-17',
  status: 'resolved',
  label: 'Chapter 17',
  title: 'Toward an Ethics of Measurement',
} as const;

const paperRef = {
  kind: 'paper',
  id: 'paper-10',
  status: 'resolved',
  label: 'Paper 10',
  title: 'Topological Fairness Analysis',
} as const;

describe('siteReferenceSchema', () => {
  it('accepts a resolved internal reference without href', () => {
    expect(siteReferenceSchema.parse(chapterRef)).toEqual(chapterRef);
  });

  it('rejects an external reference without href', () => {
    expect(() =>
      siteReferenceSchema.parse({
        kind: 'external',
        id: 'zotero-item',
        status: 'external',
        label: 'External',
        title: 'External Resource',
      }),
    ).toThrow();
  });

  it('rejects a local Windows path as href', () => {
    expect(() =>
      siteReferenceSchema.parse({
        kind: 'chapter',
        id: 'ch-17',
        status: 'resolved',
        label: 'Chapter 17',
        title: 'Toward an Ethics of Measurement',
        href: 'C:\\Users\\steph\\TDL\\vault\\note.md',
      }),
    ).toThrow();
  });
});

describe('twoLensesLinkSchema', () => {
  it('accepts a confirmed mathematical and political pairing', () => {
    const parsed = twoLensesLinkSchema.parse({
      id: 'fairness-and-measurement-ethics',
      title: 'Fairness and Measurement Ethics',
      status: 'confirmed',
      mathematical: paperRef,
      political: chapterRef,
      rationale:
        'Paper 10 formalises fairness diagnostics while Chapter 17 frames measurement as a political obligation.',
      websitePath: '/learn/fairness-and-measurement-ethics/',
      concepts: ['fairness', 'measurement ethics'],
      sourceNoteRefs: [
        {
          sourceId: 'tda-research',
          path: '03-Papers/P10/_project.md',
          title: 'Paper 10 project file',
        },
      ],
      zoteroKeys: ['NOBLE2024'],
    });

    expect(parsed.status).toBe('confirmed');
    expect(parsed.websitePath).toBe('/learn/fairness-and-measurement-ethics/');
  });

  it('rejects a websitePath that is not root-relative', () => {
    expect(() =>
      twoLensesLinkSchema.parse({
        id: 'bad-path',
        title: 'Bad Path',
        status: 'confirmed',
        mathematical: paperRef,
        political: chapterRef,
        rationale: 'This entry has an invalid website path.',
        websitePath: 'learn/bad-path',
        concepts: ['path'],
      }),
    ).toThrow();
  });
});

describe('phase3ExportSchema', () => {
  it('accepts a minimal complete Phase 3 export', () => {
    const parsed = phase3ExportSchema.parse({
      manifest: {
        schemaVersion: '1.0.0',
        generatedAt: '2026-06-13T12:00:00.000Z',
        exporter: {
          name: 'manual-fixture',
          version: '1.0.0',
        },
        sources: [
          {
            sourceId: 'tda-research',
            sourceType: 'manual-fixture',
            label: 'TDA Research fixture',
          },
        ],
        warnings: [],
      },
      twoLenses: [],
      derivedConnections: [],
      learningPaths: [],
    });

    expect(parsed.manifest.schemaVersion).toBe('1.0.0');
  });
});
