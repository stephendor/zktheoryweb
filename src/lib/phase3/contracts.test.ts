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

const externalRef = {
  kind: 'external',
  id: 'zotero-item',
  status: 'external',
  label: 'External',
  title: 'External Resource',
} as const;

const hrefMessage = 'Expected href to be a root-relative path or http(s) URL';
const localHrefMessage =
  'Local filesystem paths must not be used as website href values';
const isoTimestampMessage = 'Expected an ISO timestamp';

const expectIssue = (
  issues: Array<{ path: PropertyKey[]; message: string }>,
  path: PropertyKey[],
  message: string,
) => {
  expect(issues).toEqual(
    expect.arrayContaining([expect.objectContaining({ path, message })]),
  );
};

const phase3ExportFixture = (generatedAt = '2026-06-13T12:00:00.000Z') => ({
  manifest: {
    schemaVersion: '1.0.0',
    generatedAt,
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

describe('siteReferenceSchema', () => {
  it('accepts a resolved internal reference without href', () => {
    expect(siteReferenceSchema.parse(chapterRef)).toEqual(chapterRef);
  });

  it('accepts a root-relative internal href', () => {
    const reference = {
      ...chapterRef,
      href: '/learn/example/',
    };

    expect(siteReferenceSchema.parse(reference)).toEqual(reference);
  });

  it('accepts an external reference with an https href', () => {
    const reference = {
      ...externalRef,
      href: 'https://www.zotero.org/',
    };

    expect(siteReferenceSchema.parse(reference)).toEqual(reference);
  });

  it('rejects an external reference without href', () => {
    const result = siteReferenceSchema.safeParse(externalRef);

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(
        result.error.issues,
        ['href'],
        'External references require href',
      );
    }
  });

  it('rejects a local Windows path as href', () => {
    const result = siteReferenceSchema.safeParse({
      ...chapterRef,
      href: 'C:\\Users\\steph\\TDL\\vault\\note.md',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(result.error.issues, ['href'], localHrefMessage);
    }
  });

  it('rejects an external href that is not a URL or root-relative path', () => {
    const result = siteReferenceSchema.safeParse({
      ...externalRef,
      href: 'not a url',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(result.error.issues, ['href'], hrefMessage);
    }
  });

  it('rejects a file URL as href', () => {
    const result = siteReferenceSchema.safeParse({
      ...externalRef,
      href: 'file:///C:/Users/steph/TDL/note.md',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(result.error.issues, ['href'], localHrefMessage);
    }
  });

  it('rejects a UNC backslash path as href', () => {
    const result = siteReferenceSchema.safeParse({
      ...externalRef,
      href: String.raw`\\server\share\note.md`,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(result.error.issues, ['href'], localHrefMessage);
    }
  });

  it('rejects unsafe href schemes', () => {
    const result = siteReferenceSchema.safeParse({
      ...externalRef,
      href: 'javascript:alert("bad")',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(result.error.issues, ['href'], hrefMessage);
    }
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
    const parsed = phase3ExportSchema.parse(phase3ExportFixture());

    expect(parsed.manifest.schemaVersion).toBe('1.0.0');
  });

  it('rejects a date-only generatedAt value', () => {
    const result = phase3ExportSchema.safeParse(phase3ExportFixture('2026-06-13'));

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(
        result.error.issues,
        ['manifest', 'generatedAt'],
        isoTimestampMessage,
      );
    }
  });

  it('rejects a prose generatedAt value', () => {
    const result = phase3ExportSchema.safeParse(phase3ExportFixture('13 June 2026'));

    expect(result.success).toBe(false);
    if (!result.success) {
      expectIssue(
        result.error.issues,
        ['manifest', 'generatedAt'],
        isoTimestampMessage,
      );
    }
  });
});
