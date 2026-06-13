# Phase 3 Website Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the website-side Phase 3 contract layer so vault-derived metadata can be validated and tested without requiring live vault access.

**Architecture:** Add a small `src/lib/phase3/` library with Zod contracts, fixture-backed validation, route-reference resolution, and derived-connection merge helpers. Keep all vault and TDL access outside this repo; the site consumes only checked-in JSON and valid fixtures.

**Tech Stack:** Astro 6, TypeScript, Zod 4, Vitest, Node filesystem APIs, npm scripts.

---

## Scope

This plan implements only the **Website Contract Agent** boundary from the approved design:

- schemas and TypeScript types
- checked-in valid and invalid fixtures
- validation helpers
- route-reference resolution helpers
- derived-connection merge helpers
- `npm run validate:phase3`

This plan does not wire generated data into public Astro pages. Rendering integration belongs in a separate Website Rendering Agent plan after this contract layer is stable.

## File Structure

- Create `src/lib/phase3/contracts.ts`
  - Zod schemas and exported TypeScript types for Phase 3 JSON.
- Create `src/lib/phase3/contracts.test.ts`
  - Unit tests for schema acceptance and rejection.
- Create `src/data/generated/phase3/fixtures/valid/*.json`
  - Valid fixture exports used by normal validation and tests.
- Create `src/data/generated/phase3/fixtures/invalid/*.json`
  - Invalid fixture exports used by negative tests only.
- Create `src/lib/phase3/fixtures.test.ts`
  - Tests proving valid fixtures parse and invalid fixture files are available for negative validation tests.
- Create `src/lib/phase3/resolveSiteReferences.ts`
  - Pure helpers for route-reference registries and site-reference resolution.
- Create `src/lib/phase3/resolveSiteReferences.test.ts`
  - Tests for resolved, pending, external, and missing internal references.
- Create `src/lib/phase3/loadGeneratedData.ts`
  - File loading, validation summaries, duplicate-ID checks, pending-reference warnings, and optional route-resolution checks.
- Create `src/lib/phase3/loadGeneratedData.test.ts`
  - Tests for validation success, warning, failure, duplicate IDs, and local path non-requirement.
- Create `src/lib/phase3/mergeDerivedConnections.ts`
  - Pure merge helper that gives hand-authored links priority and filters proposed generated links.
- Create `src/lib/phase3/mergeDerivedConnections.test.ts`
  - Tests for dedupe, confidence filtering, and source labeling.
- Create `scripts/validate-phase3-data.ts`
  - CLI entry point for normal validation.
- Modify `package.json`
  - Add `"validate:phase3": "tsx scripts/validate-phase3-data.ts"`.

## Task 1: Define Phase 3 Zod Contracts

**Files:**
- Create: `src/lib/phase3/contracts.test.ts`
- Create: `src/lib/phase3/contracts.ts`

- [ ] **Step 1: Write failing schema tests**

Create `src/lib/phase3/contracts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/lib/phase3/contracts.test.ts
```

Expected: FAIL with an import error because `src/lib/phase3/contracts.ts` does not exist.

- [ ] **Step 3: Implement contract schemas**

Create `src/lib/phase3/contracts.ts`:

```ts
import { z } from 'zod';

const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'Expected a semantic version');

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Expected an ISO timestamp');

const rootRelativePathSchema = z
  .string()
  .regex(/^\/(?!\/)/, 'Expected a root-relative path beginning with /');

const safeHrefSchema = z.string().superRefine((value, ctx) => {
  const looksLikeWindowsPath = /^[A-Za-z]:[\\/]/.test(value);
  if (looksLikeWindowsPath) {
    ctx.addIssue({
      code: 'custom',
      message: 'Local filesystem paths must not be used as website href values',
    });
  }
});

export const sourceTypeSchema = z.enum([
  'obsidian-vault',
  'tdl-repo',
  'manual-fixture',
  'zotero-cache',
]);

export const phase3WarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  sourceId: z.string().min(1).optional(),
});

export const phase3SourceSchema = z.object({
  sourceId: z.string().min(1),
  sourceType: sourceTypeSchema,
  label: z.string().min(1),
  localPath: z.string().min(1).optional(),
  vaultMapPath: z.string().min(1).optional(),
  lastIndexedAt: isoDateTimeSchema.optional(),
});

export const exportManifestSchema = z.object({
  schemaVersion: semverSchema,
  generatedAt: isoDateTimeSchema,
  exporter: z.object({
    name: z.string().min(1),
    version: semverSchema,
    commit: z.string().min(1).optional(),
  }),
  sources: z.array(phase3SourceSchema),
  warnings: z.array(phase3WarningSchema).default([]),
});

export const siteReferenceKindSchema = z.enum([
  'chapter',
  'paper',
  'method',
  'interlude',
  'learn-module',
  'interactive',
  'writing-note',
  'writing-essay',
  'external',
]);

export const siteReferenceStatusSchema = z.enum(['resolved', 'pending', 'external']);

export const siteReferenceSchema = z
  .object({
    kind: siteReferenceKindSchema,
    id: z.string().min(1),
    slug: z.string().min(1).optional(),
    href: safeHrefSchema.optional(),
    status: siteReferenceStatusSchema,
    label: z.string().min(1),
    title: z.string().min(1),
  })
  .superRefine((reference, ctx) => {
    if (reference.kind === 'external' && reference.status !== 'external') {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'External references must use status "external"',
      });
    }
    if (reference.kind !== 'external' && reference.status === 'external') {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Only kind "external" may use status "external"',
      });
    }
    if (reference.kind === 'external' && !reference.href) {
      ctx.addIssue({
        code: 'custom',
        path: ['href'],
        message: 'External references require href',
      });
    }
  });

export const upstreamNoteReferenceSchema = z.object({
  sourceId: z.string().min(1),
  path: z.string().min(1),
  title: z.string().min(1).optional(),
});

export const twoLensesStatusSchema = z.enum(['confirmed', 'draft']);

export const twoLensesLinkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: twoLensesStatusSchema,
  mathematical: siteReferenceSchema,
  political: siteReferenceSchema,
  rationale: z.string().min(1),
  websitePath: rootRelativePathSchema,
  concepts: z.array(z.string().min(1)),
  sourceNoteRefs: z.array(upstreamNoteReferenceSchema).default([]),
  zoteroKeys: z.array(z.string().min(1)).default([]),
});

export const derivedConnectionTypeSchema = z.enum([
  'two-lenses',
  'method-used',
  'chapter-related-paper',
  'shared-citation',
  'learning-path',
  'manual-curation',
]);

export const derivedConnectionConfidenceSchema = z.enum([
  'confirmed',
  'reviewed',
  'proposed',
]);

export const derivedConnectionOriginSchema = z.enum([
  'vault-export',
  'cross-vault-linker',
  'manual-fixture',
  'manual-curation',
]);

export const derivedConnectionSchema = z.object({
  id: z.string().min(1),
  source: siteReferenceSchema,
  target: siteReferenceSchema,
  connectionType: derivedConnectionTypeSchema,
  confidence: derivedConnectionConfidenceSchema,
  rationale: z.string().min(1),
  origin: derivedConnectionOriginSchema,
});

export const learningPathModuleExportSchema = z.object({
  moduleId: z.string().min(1),
  concepts: z.array(z.string().min(1)),
  sourceNoteRefs: z.array(upstreamNoteReferenceSchema).default([]),
  status: z.enum(['aligned', 'needs-review', 'missing-site-content']),
});

export const learningPathExportSchema = z.object({
  pathSlug: z.enum([
    'topology-social-scientists',
    'mathematics-of-poverty',
    'data-justice',
    'tda-practitioners',
  ]),
  generatedModules: z.array(learningPathModuleExportSchema),
  recommendedConnections: z.array(z.string().min(1)).default([]),
  twoLensesIds: z.array(z.string().min(1)).default([]),
});

export const phase3ExportSchema = z.object({
  manifest: exportManifestSchema,
  twoLenses: z.array(twoLensesLinkSchema).default([]),
  derivedConnections: z.array(derivedConnectionSchema).default([]),
  learningPaths: z.array(learningPathExportSchema).default([]),
});

export type Phase3Export = z.infer<typeof phase3ExportSchema>;
export type ExportManifest = z.infer<typeof exportManifestSchema>;
export type SiteReference = z.infer<typeof siteReferenceSchema>;
export type TwoLensesLink = z.infer<typeof twoLensesLinkSchema>;
export type DerivedConnection = z.infer<typeof derivedConnectionSchema>;
export type LearningPathExport = z.infer<typeof learningPathExportSchema>;
export type DerivedConnectionConfidence = z.infer<
  typeof derivedConnectionConfidenceSchema
>;
```

- [ ] **Step 4: Run contract tests**

Run:

```bash
npm run test -- src/lib/phase3/contracts.test.ts
```

Expected: PASS for `contracts.test.ts`.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/phase3/contracts.ts src/lib/phase3/contracts.test.ts
git commit -m "feat: add phase 3 data contracts"
```

## Task 2: Add Fixture JSON Files

**Files:**
- Create: `src/data/generated/phase3/fixtures/valid/valid-minimal.json`
- Create: `src/data/generated/phase3/fixtures/valid/pending-reference.json`
- Create: `src/data/generated/phase3/fixtures/valid/proposed-link.json`
- Create: `src/data/generated/phase3/fixtures/valid/local-junction-path.json`
- Create: `src/data/generated/phase3/fixtures/invalid/broken-reference.json`
- Create: `src/data/generated/phase3/fixtures/invalid/duplicate-ids.json`
- Create: `src/lib/phase3/fixtures.test.ts`

- [ ] **Step 1: Write failing fixture tests**

Create `src/lib/phase3/fixtures.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { phase3ExportSchema } from './contracts';

const fixtureRoot = join(process.cwd(), 'src/data/generated/phase3/fixtures');

function readFixture(group: 'valid' | 'invalid', filename: string): unknown {
  return JSON.parse(
    readFileSync(join(fixtureRoot, group, filename), 'utf-8'),
  ) as unknown;
}

describe('Phase 3 fixture files', () => {
  it.each([
    'valid-minimal.json',
    'pending-reference.json',
    'proposed-link.json',
    'local-junction-path.json',
  ])('valid fixture %s parses with the base schema', (filename) => {
    const parsed = phase3ExportSchema.parse(readFixture('valid', filename));
    expect(parsed.manifest.schemaVersion).toBe('1.0.0');
  });

  it('invalid broken-reference fixture still has the base export shape', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('invalid', 'broken-reference.json'),
    );
    expect(parsed.derivedConnections[0]?.target.id).toBe('paper-99');
  });

  it('invalid duplicate-ids fixture still has the base export shape', () => {
    const parsed = phase3ExportSchema.parse(
      readFixture('invalid', 'duplicate-ids.json'),
    );
    expect(parsed.twoLenses.map((entry) => entry.id)).toEqual([
      'duplicate-two-lenses',
      'duplicate-two-lenses',
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/lib/phase3/fixtures.test.ts
```

Expected: FAIL with `ENOENT` because fixture JSON files do not exist.

- [ ] **Step 3: Add valid minimal fixture**

Create `src/data/generated/phase3/fixtures/valid/valid-minimal.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T12:00:00.000Z",
    "exporter": {
      "name": "manual-fixture",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "tda-research",
        "sourceType": "manual-fixture",
        "label": "TDA Research fixture"
      },
      {
        "sourceId": "counting-lives",
        "sourceType": "manual-fixture",
        "label": "Counting Lives fixture"
      }
    ],
    "warnings": []
  },
  "twoLenses": [
    {
      "id": "fairness-and-measurement-ethics",
      "title": "Fairness and Measurement Ethics",
      "status": "confirmed",
      "mathematical": {
        "kind": "paper",
        "id": "paper-10",
        "status": "resolved",
        "label": "Paper 10",
        "title": "Topological Fairness Analysis"
      },
      "political": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "rationale": "Paper 10 formalises fairness diagnostics while Chapter 17 frames measurement as a political obligation.",
      "websitePath": "/learn/fairness-and-measurement-ethics/",
      "concepts": ["fairness", "measurement ethics"],
      "sourceNoteRefs": [
        {
          "sourceId": "tda-research",
          "path": "03-Papers/P10/_project.md",
          "title": "Paper 10 project file"
        }
      ],
      "zoteroKeys": ["NOBLE2024"]
    }
  ],
  "derivedConnections": [
    {
      "id": "ch17-paper10-two-lenses",
      "source": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "target": {
        "kind": "paper",
        "id": "paper-10",
        "status": "resolved",
        "label": "Paper 10",
        "title": "Topological Fairness Analysis"
      },
      "connectionType": "two-lenses",
      "confidence": "confirmed",
      "rationale": "Both pages treat fairness as a mathematical and political measurement problem.",
      "origin": "manual-fixture"
    }
  ],
  "learningPaths": [
    {
      "pathSlug": "data-justice",
      "generatedModules": [
        {
          "moduleId": "path3-module-6",
          "concepts": ["algorithmic accountability", "fairness"],
          "sourceNoteRefs": [],
          "status": "aligned"
        }
      ],
      "recommendedConnections": ["ch17-paper10-two-lenses"],
      "twoLensesIds": ["fairness-and-measurement-ethics"]
    }
  ]
}
```

- [ ] **Step 4: Add pending-reference fixture**

Create `src/data/generated/phase3/fixtures/valid/pending-reference.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T12:05:00.000Z",
    "exporter": {
      "name": "manual-fixture",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "tda-research",
        "sourceType": "manual-fixture",
        "label": "TDA Research fixture"
      }
    ],
    "warnings": []
  },
  "twoLenses": [],
  "derivedConnections": [
    {
      "id": "ch17-pending-learning-page",
      "source": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "target": {
        "kind": "learn-module",
        "id": "topology-and-justice",
        "status": "pending",
        "label": "Learning Module",
        "title": "Topology and Justice"
      },
      "connectionType": "learning-path",
      "confidence": "reviewed",
      "rationale": "A reviewed connection points to a learning page that has not been authored yet.",
      "origin": "manual-fixture"
    }
  ],
  "learningPaths": []
}
```

- [ ] **Step 5: Add proposed-link fixture**

Create `src/data/generated/phase3/fixtures/valid/proposed-link.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T12:10:00.000Z",
    "exporter": {
      "name": "manual-fixture",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "cross-vault-linker",
        "sourceType": "manual-fixture",
        "label": "Cross-vault linker fixture"
      }
    ],
    "warnings": []
  },
  "twoLenses": [],
  "derivedConnections": [
    {
      "id": "proposed-thresholds-to-persistence",
      "source": {
        "kind": "interlude",
        "id": "mm3-logistic-regression",
        "status": "resolved",
        "label": "Mathematical Interlude",
        "title": "Logistic Regression and Classification"
      },
      "target": {
        "kind": "method",
        "id": "persistent-homology",
        "status": "resolved",
        "label": "Method",
        "title": "Persistent Homology"
      },
      "connectionType": "two-lenses",
      "confidence": "proposed",
      "rationale": "The proposed link needs human review before public rendering.",
      "origin": "cross-vault-linker"
    }
  ],
  "learningPaths": []
}
```

- [ ] **Step 6: Add local-junction-path fixture**

Create `src/data/generated/phase3/fixtures/valid/local-junction-path.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T12:15:00.000Z",
    "exporter": {
      "name": "manual-fixture",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "tda-research",
        "sourceType": "obsidian-vault",
        "label": "TDA Research local junction",
        "localPath": "C:\\Users\\steph\\TDL\\TDA-Research",
        "vaultMapPath": "VAULT-MAP.md",
        "lastIndexedAt": "2026-06-13T11:45:00.000Z"
      }
    ],
    "warnings": []
  },
  "twoLenses": [],
  "derivedConnections": [],
  "learningPaths": []
}
```

- [ ] **Step 7: Add invalid broken-reference fixture**

Create `src/data/generated/phase3/fixtures/invalid/broken-reference.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T12:20:00.000Z",
    "exporter": {
      "name": "manual-fixture",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "tda-research",
        "sourceType": "manual-fixture",
        "label": "TDA Research fixture"
      }
    ],
    "warnings": []
  },
  "twoLenses": [],
  "derivedConnections": [
    {
      "id": "ch17-missing-paper",
      "source": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "target": {
        "kind": "paper",
        "id": "paper-99",
        "status": "resolved",
        "label": "Paper 99",
        "title": "Missing Paper"
      },
      "connectionType": "chapter-related-paper",
      "confidence": "confirmed",
      "rationale": "This fixture intentionally references a missing internal paper.",
      "origin": "manual-fixture"
    }
  ],
  "learningPaths": []
}
```

- [ ] **Step 8: Add invalid duplicate-ids fixture**

Create `src/data/generated/phase3/fixtures/invalid/duplicate-ids.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T12:25:00.000Z",
    "exporter": {
      "name": "manual-fixture",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "counting-lives",
        "sourceType": "manual-fixture",
        "label": "Counting Lives fixture"
      }
    ],
    "warnings": []
  },
  "twoLenses": [
    {
      "id": "duplicate-two-lenses",
      "title": "Duplicate Link A",
      "status": "confirmed",
      "mathematical": {
        "kind": "paper",
        "id": "paper-10",
        "status": "resolved",
        "label": "Paper 10",
        "title": "Topological Fairness Analysis"
      },
      "political": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "rationale": "First entry with this ID.",
      "websitePath": "/learn/duplicate-a/",
      "concepts": ["duplicate"]
    },
    {
      "id": "duplicate-two-lenses",
      "title": "Duplicate Link B",
      "status": "confirmed",
      "mathematical": {
        "kind": "paper",
        "id": "paper-10",
        "status": "resolved",
        "label": "Paper 10",
        "title": "Topological Fairness Analysis"
      },
      "political": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "rationale": "Second entry with this ID.",
      "websitePath": "/learn/duplicate-b/",
      "concepts": ["duplicate"]
    }
  ],
  "derivedConnections": [],
  "learningPaths": []
}
```

- [ ] **Step 9: Run fixture tests**

Run:

```bash
npm run test -- src/lib/phase3/fixtures.test.ts
```

Expected: PASS for `fixtures.test.ts`.

- [ ] **Step 10: Commit Task 2**

```bash
git add src/data/generated/phase3/fixtures src/lib/phase3/fixtures.test.ts
git commit -m "test: add phase 3 contract fixtures"
```

## Task 3: Add Site Reference Resolution Helpers

**Files:**
- Create: `src/lib/phase3/resolveSiteReferences.test.ts`
- Create: `src/lib/phase3/resolveSiteReferences.ts`

- [ ] **Step 1: Write failing resolver tests**

Create `src/lib/phase3/resolveSiteReferences.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/lib/phase3/resolveSiteReferences.test.ts
```

Expected: FAIL with an import error because `resolveSiteReferences.ts` does not exist.

- [ ] **Step 3: Implement resolver helpers**

Create `src/lib/phase3/resolveSiteReferences.ts`:

```ts
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
```

- [ ] **Step 4: Run resolver tests**

Run:

```bash
npm run test -- src/lib/phase3/resolveSiteReferences.test.ts
```

Expected: PASS for `resolveSiteReferences.test.ts`.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/lib/phase3/resolveSiteReferences.ts src/lib/phase3/resolveSiteReferences.test.ts
git commit -m "feat: resolve phase 3 site references"
```

## Task 4: Add Generated Data Validation

**Files:**
- Create: `src/lib/phase3/loadGeneratedData.test.ts`
- Create: `src/lib/phase3/loadGeneratedData.ts`

- [ ] **Step 1: Write failing validation tests**

Create `src/lib/phase3/loadGeneratedData.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSiteRouteRegistry } from './resolveSiteReferences';
import {
  readPhase3ExportFile,
  validatePhase3Export,
} from './loadGeneratedData';

const fixtureRoot = join(process.cwd(), 'src/data/generated/phase3/fixtures');

function fixturePath(group: 'valid' | 'invalid', filename: string): string {
  return join(fixtureRoot, group, filename);
}

function readFixture(group: 'valid' | 'invalid', filename: string): unknown {
  return JSON.parse(readFileSync(fixturePath(group, filename), 'utf-8')) as unknown;
}

const registry = createSiteRouteRegistry({
  chapters: ['ch-17'],
  papers: ['paper-10'],
  methods: ['persistent-homology'],
  interludes: ['mm3-logistic-regression'],
  learnModules: ['path3-module-6'],
  interactives: [],
  writingNotes: [],
  writingEssays: [],
});

describe('validatePhase3Export', () => {
  it('accepts valid-minimal without errors', () => {
    const result = validatePhase3Export(readFixture('valid', 'valid-minimal.json'), {
      registry,
    });

    expect(result.ok).toBe(true);
    expect(result.summary.errors).toBe(0);
    expect(result.summary.twoLenses).toBe(1);
    expect(result.summary.derivedConnections).toBe(1);
  });

  it('emits a warning for pending references', () => {
    const result = validatePhase3Export(
      readFixture('valid', 'pending-reference.json'),
      { registry },
    );

    expect(result.ok).toBe(true);
    expect(result.summary.warnings).toBe(1);
    expect(result.issues[0]).toMatchObject({
      severity: 'warning',
      code: 'pending-reference',
    });
  });

  it('does not require localPath to exist', () => {
    const result = validatePhase3Export(
      readFixture('valid', 'local-junction-path.json'),
      { registry },
    );

    expect(result.ok).toBe(true);
    expect(result.summary.errors).toBe(0);
  });

  it('reports missing resolved internal references', () => {
    const result = validatePhase3Export(
      readFixture('invalid', 'broken-reference.json'),
      { registry },
    );

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'unresolved-reference')).toBe(true);
  });

  it('reports duplicate record IDs', () => {
    const result = validatePhase3Export(
      readFixture('invalid', 'duplicate-ids.json'),
      { registry },
    );

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'duplicate-id')).toBe(true);
  });
});

describe('readPhase3ExportFile', () => {
  it('reads and parses a JSON export file', () => {
    const parsed = readPhase3ExportFile(
      fixturePath('valid', 'valid-minimal.json'),
    );

    expect(parsed.manifest.exporter.name).toBe('manual-fixture');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/lib/phase3/loadGeneratedData.test.ts
```

Expected: FAIL with an import error because `loadGeneratedData.ts` does not exist.

- [ ] **Step 3: Implement validation helpers**

Create `src/lib/phase3/loadGeneratedData.ts`:

```ts
import { readFileSync } from 'node:fs';
import { ZodError } from 'zod';
import {
  phase3ExportSchema,
  type DerivedConnection,
  type Phase3Export,
  type SiteReference,
  type TwoLensesLink,
} from './contracts';
import {
  resolveSiteReference,
  type SiteRouteRegistry,
} from './resolveSiteReferences';

export type ValidationSeverity = 'error' | 'warning';

export interface Phase3ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
  id?: string;
}

export interface Phase3ValidationSummary {
  manifests: number;
  twoLenses: number;
  derivedConnections: number;
  learningPaths: number;
  pendingReferences: number;
  warnings: number;
  errors: number;
}

export interface Phase3ValidationResult {
  ok: boolean;
  data: Phase3Export | null;
  issues: Phase3ValidationIssue[];
  summary: Phase3ValidationSummary;
}

export interface Phase3ValidationOptions {
  registry?: SiteRouteRegistry;
}

function emptySummary(): Phase3ValidationSummary {
  return {
    manifests: 0,
    twoLenses: 0,
    derivedConnections: 0,
    learningPaths: 0,
    pendingReferences: 0,
    warnings: 0,
    errors: 0,
  };
}

function issue(
  severity: ValidationSeverity,
  code: string,
  message: string,
  details: Pick<Phase3ValidationIssue, 'path' | 'id'> = {},
): Phase3ValidationIssue {
  return { severity, code, message, ...details };
}

function zodIssues(error: ZodError): Phase3ValidationIssue[] {
  return error.issues.map((zodIssue) =>
    issue(
      'error',
      'schema-error',
      zodIssue.message,
      { path: zodIssue.path.join('.') },
    ),
  );
}

function addDuplicateIdIssues(
  records: Array<{ id: string }>,
  collectionName: string,
  issues: Phase3ValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      issues.push(
        issue(
          'error',
          'duplicate-id',
          `Duplicate ${collectionName} id "${record.id}"`,
          { id: record.id },
        ),
      );
    }
    seen.add(record.id);
  }
}

function referencesFromTwoLenses(link: TwoLensesLink): SiteReference[] {
  return [link.mathematical, link.political];
}

function referencesFromDerivedConnection(
  connection: DerivedConnection,
): SiteReference[] {
  return [connection.source, connection.target];
}

function checkReference(
  reference: SiteReference,
  issues: Phase3ValidationIssue[],
  options: Phase3ValidationOptions,
): void {
  if (reference.status === 'pending') {
    issues.push(
      issue(
        'warning',
        'pending-reference',
        `Pending reference "${reference.kind}:${reference.id}" is allowed but not resolved`,
        { id: reference.id },
      ),
    );
    return;
  }

  if (!options.registry || reference.status === 'external') {
    return;
  }

  const result = resolveSiteReference(reference, options.registry);
  if (!result.resolved) {
    issues.push(
      issue(
        'error',
        'unresolved-reference',
        `Resolved reference "${reference.kind}:${reference.id}" does not exist in the site registry`,
        { id: reference.id },
      ),
    );
  }
}

export function validatePhase3Export(
  input: unknown,
  options: Phase3ValidationOptions = {},
): Phase3ValidationResult {
  const parsed = phase3ExportSchema.safeParse(input);
  if (!parsed.success) {
    const issues = zodIssues(parsed.error);
    return {
      ok: false,
      data: null,
      issues,
      summary: {
        ...emptySummary(),
        errors: issues.length,
      },
    };
  }

  const data = parsed.data;
  const issues: Phase3ValidationIssue[] = [];

  addDuplicateIdIssues(data.twoLenses, 'twoLenses', issues);
  addDuplicateIdIssues(data.derivedConnections, 'derivedConnections', issues);

  for (const link of data.twoLenses) {
    for (const reference of referencesFromTwoLenses(link)) {
      checkReference(reference, issues, options);
    }
  }

  for (const connection of data.derivedConnections) {
    for (const reference of referencesFromDerivedConnection(connection)) {
      checkReference(reference, issues, options);
    }
  }

  const warnings = issues.filter((entry) => entry.severity === 'warning').length;
  const errors = issues.filter((entry) => entry.severity === 'error').length;
  const pendingReferences = issues.filter(
    (entry) => entry.code === 'pending-reference',
  ).length;

  return {
    ok: errors === 0,
    data,
    issues,
    summary: {
      manifests: 1,
      twoLenses: data.twoLenses.length,
      derivedConnections: data.derivedConnections.length,
      learningPaths: data.learningPaths.length,
      pendingReferences,
      warnings,
      errors,
    },
  };
}

export function readPhase3ExportFile(filePath: string): Phase3Export {
  const raw = readFileSync(filePath, 'utf-8');
  return phase3ExportSchema.parse(JSON.parse(raw) as unknown);
}
```

- [ ] **Step 4: Run validation tests**

Run:

```bash
npm run test -- src/lib/phase3/loadGeneratedData.test.ts
```

Expected: PASS for `loadGeneratedData.test.ts`.

- [ ] **Step 5: Run all phase3 unit tests**

Run:

```bash
npm run test -- src/lib/phase3
```

Expected: PASS for `contracts`, `fixtures`, `resolveSiteReferences`, and `loadGeneratedData` tests.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/lib/phase3/loadGeneratedData.ts src/lib/phase3/loadGeneratedData.test.ts
git commit -m "feat: validate phase 3 generated data"
```

## Task 5: Add Derived Connection Merge Helper

**Files:**
- Create: `src/lib/phase3/mergeDerivedConnections.test.ts`
- Create: `src/lib/phase3/mergeDerivedConnections.ts`

- [ ] **Step 1: Write failing merge tests**

Create `src/lib/phase3/mergeDerivedConnections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  mergeDerivedConnections,
  type HandAuthoredConnection,
} from './mergeDerivedConnections';
import type { DerivedConnection } from './contracts';

const handAuthored: HandAuthoredConnection[] = [
  {
    targetKind: 'paper',
    targetId: 'paper-10',
    href: '/tda/papers/paper-10/',
    label: 'Paper 10',
    title: 'Topological Fairness Analysis',
    palette: 'tda',
  },
];

const confirmedGenerated: DerivedConnection = {
  id: 'ch17-paper10-generated',
  source: {
    kind: 'chapter',
    id: 'ch-17',
    status: 'resolved',
    label: 'Chapter 17',
    title: 'Toward an Ethics of Measurement',
  },
  target: {
    kind: 'paper',
    id: 'paper-10',
    status: 'resolved',
    label: 'Paper 10',
    title: 'Topological Fairness Analysis',
  },
  connectionType: 'two-lenses',
  confidence: 'confirmed',
  rationale: 'Generated duplicate of a hand-authored connection.',
  origin: 'manual-fixture',
};

const reviewedGenerated: DerivedConnection = {
  id: 'ch17-method-generated',
  source: {
    kind: 'chapter',
    id: 'ch-17',
    status: 'resolved',
    label: 'Chapter 17',
    title: 'Toward an Ethics of Measurement',
  },
  target: {
    kind: 'method',
    id: 'persistent-homology',
    status: 'resolved',
    label: 'Method',
    title: 'Persistent Homology',
  },
  connectionType: 'method-used',
  confidence: 'reviewed',
  rationale: 'Reviewed generated method connection.',
  origin: 'manual-fixture',
};

const proposedGenerated: DerivedConnection = {
  ...reviewedGenerated,
  id: 'ch17-proposed-generated',
  confidence: 'proposed',
  target: {
    kind: 'interlude',
    id: 'mm3-logistic-regression',
    status: 'resolved',
    label: 'Interlude',
    title: 'Logistic Regression and Classification',
  },
};

describe('mergeDerivedConnections', () => {
  it('keeps hand-authored links first and removes generated duplicates', () => {
    const merged = mergeDerivedConnections(handAuthored, [
      confirmedGenerated,
      reviewedGenerated,
    ]);

    expect(merged.map((entry) => entry.title)).toEqual([
      'Topological Fairness Analysis',
      'Persistent Homology',
    ]);
    expect(merged[0]?.source).toBe('hand-authored');
    expect(merged[1]?.source).toBe('generated');
  });

  it('filters proposed generated connections from public output', () => {
    const merged = mergeDerivedConnections([], [proposedGenerated]);
    expect(merged).toEqual([]);
  });

  it('maps generated references to renderable connection cards', () => {
    const merged = mergeDerivedConnections([], [reviewedGenerated]);

    expect(merged[0]).toMatchObject({
      href: '/tda/methods/persistent-homology/',
      label: 'Method',
      palette: 'tda',
      source: 'generated',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- src/lib/phase3/mergeDerivedConnections.test.ts
```

Expected: FAIL with an import error because `mergeDerivedConnections.ts` does not exist.

- [ ] **Step 3: Implement merge helper**

Create `src/lib/phase3/mergeDerivedConnections.ts`:

```ts
import type { DerivedConnection, SiteReference } from './contracts';

type Palette = 'tda' | 'cl';

export interface HandAuthoredConnection {
  targetKind: SiteReference['kind'];
  targetId: string;
  href?: string;
  label: string;
  title: string;
  palette: Palette;
}

export interface RenderableConnection {
  href?: string;
  label: string;
  title: string;
  palette: Palette;
  source: 'hand-authored' | 'generated';
  dataTodo?: string;
}

function keyFor(kind: SiteReference['kind'], id: string): string {
  return `${kind}:${id}`;
}

function paletteForReference(reference: SiteReference): Palette {
  if (reference.kind === 'chapter' || reference.kind === 'interlude') {
    return 'cl';
  }
  return 'tda';
}

function hrefForReference(reference: SiteReference): string | undefined {
  if (reference.href) return reference.href;

  switch (reference.kind) {
    case 'chapter':
      return `/counting-lives/chapters/${reference.id}/`;
    case 'paper':
      return `/tda/papers/${reference.id}/`;
    case 'method':
      return `/tda/methods/${reference.id}/`;
    case 'interlude':
      return `/counting-lives/interludes/${reference.id}/`;
    case 'learn-module':
      return reference.slug ? `/learn/${reference.slug}/` : undefined;
    case 'interactive':
      return `/learn/interactives/${reference.id}/`;
    case 'writing-note':
      return `/writing/notes/${reference.id}/`;
    case 'writing-essay':
      return `/writing/essays/${reference.id}/`;
    case 'external':
      return reference.href;
  }
}

function handAuthoredToRenderable(
  connection: HandAuthoredConnection,
): RenderableConnection {
  return {
    href: connection.href,
    label: connection.label,
    title: connection.title,
    palette: connection.palette,
    source: 'hand-authored',
  };
}

function generatedToRenderable(
  connection: DerivedConnection,
): RenderableConnection {
  const href = hrefForReference(connection.target);
  return {
    href,
    label: connection.target.label,
    title: connection.target.title,
    palette: paletteForReference(connection.target),
    source: 'generated',
    dataTodo: connection.target.status === 'pending' ? 'pending-route' : undefined,
  };
}

export function mergeDerivedConnections(
  handAuthoredConnections: HandAuthoredConnection[],
  generatedConnections: DerivedConnection[],
): RenderableConnection[] {
  const seen = new Set<string>();
  const merged: RenderableConnection[] = [];

  for (const connection of handAuthoredConnections) {
    seen.add(keyFor(connection.targetKind, connection.targetId));
    merged.push(handAuthoredToRenderable(connection));
  }

  for (const connection of generatedConnections) {
    if (connection.confidence === 'proposed') continue;

    const key = keyFor(connection.target.kind, connection.target.id);
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(generatedToRenderable(connection));
  }

  return merged;
}
```

- [ ] **Step 4: Run merge tests**

Run:

```bash
npm run test -- src/lib/phase3/mergeDerivedConnections.test.ts
```

Expected: PASS for `mergeDerivedConnections.test.ts`.

- [ ] **Step 5: Run all phase3 unit tests**

Run:

```bash
npm run test -- src/lib/phase3
```

Expected: PASS for all Phase 3 tests.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/lib/phase3/mergeDerivedConnections.ts src/lib/phase3/mergeDerivedConnections.test.ts
git commit -m "feat: merge phase 3 derived connections"
```

## Task 6: Add CLI Validation Script

**Files:**
- Create: `scripts/validate-phase3-data.ts`
- Modify: `package.json`

- [ ] **Step 1: Add validation script to package.json first**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "vitest run",
    "test:e2e": "npm run build && playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report",
    "fetch:zotero": "npx tsx src/lib/zotero.ts",
    "validate:phase3": "tsx scripts/validate-phase3-data.ts",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

Keep all existing scripts and add only `validate:phase3`.

- [ ] **Step 2: Run validation to verify it fails**

Run:

```bash
npm run validate:phase3
```

Expected: FAIL with `Cannot find module` or `ERR_MODULE_NOT_FOUND` because `scripts/validate-phase3-data.ts` does not exist.

- [ ] **Step 3: Implement CLI script**

Create `scripts/validate-phase3-data.ts`:

```ts
import {
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { extname, join, parse } from 'node:path';
import {
  validatePhase3Export,
  readPhase3ExportFile,
  type Phase3ValidationResult,
} from '../src/lib/phase3/loadGeneratedData';
import {
  createSiteRouteRegistry,
  type SiteRouteRegistry,
} from '../src/lib/phase3/resolveSiteReferences';

const workspaceRoot = process.cwd();

function mdIdsFromDirectory(relativeDir: string): string[] {
  const directory = join(workspaceRoot, relativeDir);
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => ['.md', '.mdx'].includes(extname(entry.name)))
    .map((entry) => parse(entry.name).name)
    .sort();
}

function buildRegistryFromWorkspace(): SiteRouteRegistry {
  return createSiteRouteRegistry({
    chapters: mdIdsFromDirectory('src/content/counting-lives/chapters'),
    papers: mdIdsFromDirectory('src/content/tda/papers'),
    methods: mdIdsFromDirectory('src/content/tda/methods'),
    interludes: mdIdsFromDirectory('src/content/counting-lives/interludes'),
    learnModules: mdIdsFromDirectory('src/content/learn'),
    interactives: mdIdsFromDirectory('src/content/interactives'),
    writingNotes: mdIdsFromDirectory('src/content/writing/notes'),
    writingEssays: mdIdsFromDirectory('src/content/writing/essays'),
  });
}

function jsonFilesInDirectory(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .map((name) => join(directory, name))
    .filter((path) => statSync(path).isFile())
    .filter((path) => extname(path) === '.json')
    .sort();
}

function validationFiles(): string[] {
  const generatedRoot = join(workspaceRoot, 'src/data/generated/phase3');
  const validFixtures = join(generatedRoot, 'fixtures/valid');

  return [
    ...jsonFilesInDirectory(generatedRoot),
    ...jsonFilesInDirectory(validFixtures),
  ];
}

function printResult(filePath: string, result: Phase3ValidationResult): void {
  const relativePath = filePath.replace(`${workspaceRoot}\\`, '').replace(`${workspaceRoot}/`, '');
  const label = result.ok ? 'OK' : 'ERROR';
  console.log(`[phase3] ${label} ${relativePath}`);
  console.log(
    `[phase3] counts: twoLenses=${result.summary.twoLenses}, derivedConnections=${result.summary.derivedConnections}, learningPaths=${result.summary.learningPaths}, warnings=${result.summary.warnings}, errors=${result.summary.errors}`,
  );

  for (const entry of result.issues) {
    console.log(
      `[phase3] ${entry.severity.toUpperCase()} ${entry.code}: ${entry.message}`,
    );
  }
}

function main(): void {
  const files = validationFiles();
  if (files.length === 0) {
    console.log('[phase3] No generated Phase 3 JSON files found.');
    return;
  }

  const registry = buildRegistryFromWorkspace();
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const data = readPhase3ExportFile(file);
    const result = validatePhase3Export(data, { registry });
    printResult(file, result);
    totalErrors += result.summary.errors;
    totalWarnings += result.summary.warnings;
  }

  console.log(
    `[phase3] complete: files=${files.length}, warnings=${totalWarnings}, errors=${totalErrors}`,
  );

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}

main();
```

- [ ] **Step 4: Run CLI validation**

Run:

```bash
npm run validate:phase3
```

Expected: PASS with lines for the valid fixture files. The `pending-reference.json` file should produce one warning, and the process should exit with code `0`.

- [ ] **Step 5: Run all Phase 3 tests and CLI validation together**

Run:

```bash
npm run test -- src/lib/phase3
npm run validate:phase3
```

Expected: both commands PASS. The validation command may print one warning for the pending fixture.

- [ ] **Step 6: Commit Task 6**

```bash
git add package.json scripts/validate-phase3-data.ts
git commit -m "chore: add phase 3 validation command"
```

## Task 7: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run targeted Phase 3 tests**

Run:

```bash
npm run test -- src/lib/phase3
```

Expected: PASS for all Phase 3 unit tests.

- [ ] **Step 2: Run validation command**

Run:

```bash
npm run validate:phase3
```

Expected: PASS with `errors=0`. Warnings are allowed for `pending-reference.json`.

- [ ] **Step 3: Run full unit test suite**

Run:

```bash
npm run test
```

Expected: PASS for the project Vitest suite.

- [ ] **Step 4: Run Astro type/content check**

Run:

```bash
npm run check
```

Expected: PASS with Astro check completing successfully.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. The build must not require the TDL repo, Obsidian vaults, Zotero MCP, or the Windows junction.

- [ ] **Step 6: Inspect final git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only Phase 3 contract files, fixtures, the CLI script, and `package.json` are changed.

- [ ] **Step 7: Commit final verification adjustments if needed**

If final verification required small fixes, commit those fixes:

```bash
git add src/lib/phase3 src/data/generated/phase3 scripts/validate-phase3-data.ts package.json
git commit -m "fix: stabilize phase 3 contract validation"
```

Expected: commit succeeds only if Step 1 through Step 5 pass.

## Self-Review Checklist for Implementer

Before reporting completion:

- Confirm `npm run validate:phase3` does not read invalid fixtures.
- Confirm invalid fixtures are loaded only by tests.
- Confirm `localPath` is parsed but no existence check runs.
- Confirm generated `proposed` connections are excluded from merge output.
- Confirm hand-authored links win over generated duplicates.
- Confirm no public Astro page consumes generated data in this plan.
- Confirm the final build does not depend on vault or junction access.
