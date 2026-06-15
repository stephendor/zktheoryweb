# Phase 3 Website Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render validated Phase 3 generated context in the Astro site through additive derived links, confirmed Two Lenses cards, and a dedicated verification command.

**Architecture:** Keep contracts and rendering separate. `src/lib/phase3` remains the boundary: contract files validate data, rendering files select and shape data for layouts, and Astro components only receive render-ready props. Public pages read only checked-in JSON from `src/data/generated/phase3/`; they never touch the TDL repo, Obsidian vault, or local junction target.

**Tech Stack:** Astro 6, TypeScript, Vitest, existing Phase 3 Zod contracts, existing `ConnectionsPanel.astro`.

---

## Execution Mode

The user already selected subagent-driven execution. Run these tasks in order.
Use a fresh worker for each implementation task and review each task before
moving on. Do not dispatch two workers that edit the same file set at the same
time.

## File Structure

- Create `src/data/generated/phase3/site-connections.json`
  - Small non-fixture checked-in data seed so rendering can be observed on real
    pages.
- Create `src/lib/phase3/renderingData.ts`
  - Reads direct JSON files from `src/data/generated/phase3/`, validates them,
    ignores fixtures by construction, and combines records.
- Create `src/lib/phase3/renderingData.test.ts`
  - Reader unit tests with temporary directories.
- Create `src/lib/phase3/pageConnections.ts`
  - Pure selectors for source-specific derived connections and renderable
    generated connection groups.
- Create `src/lib/phase3/pageConnections.test.ts`
  - Source filtering, proposed filtering, and hand-authored dedupe tests.
- Modify `src/lib/phase3/mergeDerivedConnections.ts`
  - Preserve hand-authored unavailable-route metadata and avoid inventing
    invalid learning-module URLs.
- Modify `src/lib/phase3/mergeDerivedConnections.test.ts`
  - Cover those rendering edge cases.
- Create `src/lib/phase3/twoLensesRendering.ts`
  - Selects confirmed Two Lenses links and shapes them for UI.
- Create `src/lib/phase3/twoLensesRendering.test.ts`
  - Confirmed/draft filtering tests.
- Create `src/components/phase3/TwoLensesLinks.astro`
  - Presentational section for `/learn/`.
- Modify `src/layouts/ChapterLayout.astro`
  - Accept prefiltered derived connections and append a generated group to the
    existing `Connections Forward` panel.
- Modify `src/pages/counting-lives/chapters/[slug].astro`
  - Load generated data once for static path generation and pass page-specific
    derived connections into `ChapterLayout`.
- Modify `src/layouts/PaperLayout.astro`
  - Accept prefiltered derived connections and append generated context to the
    paper connections area.
- Modify `src/pages/tda/papers/[slug].astro`
  - Pass page-specific derived connections into `PaperLayout`.
- Modify `src/layouts/ModuleLayout.astro`
  - Accept prefiltered derived connections and add compact generated links in
    the sidebar.
- Modify `src/pages/learn/[path]/[module].astro`
  - Pass page-specific derived connections into `ModuleLayout`.
- Modify `src/pages/learn/index.astro`
  - Load confirmed Two Lenses links and render the new component.
- Modify `package.json`
  - Add `verify:phase3`.

## Task 1: Rendering Data Reader

**Files:**
- Create: `src/data/generated/phase3/site-connections.json`
- Create: `src/lib/phase3/renderingData.ts`
- Test: `src/lib/phase3/renderingData.test.ts`

- [ ] **Step 1: Add failing reader tests**

Create `src/lib/phase3/renderingData.test.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadPhase3RenderingData } from './renderingData';
import { createSiteRouteRegistry } from './resolveSiteReferences';

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

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-rendering-'));
}

function writeJson(root: string, name: string, value: unknown): void {
  writeFileSync(join(root, name), `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

const validExport = {
  manifest: {
    schemaVersion: '1.0.0',
    generatedAt: '2026-06-13T00:00:00.000Z',
    exporter: { name: 'manual-fixture', version: '1.0.0' },
    sources: [
      {
        sourceId: 'phase3-rendering-test',
        sourceType: 'manual-fixture',
        label: 'Phase 3 rendering test data',
      },
    ],
    warnings: [],
  },
  twoLenses: [
    {
      id: 'ch17-paper10-two-lenses',
      title: 'Measurement ethics and topological fairness',
      status: 'confirmed',
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
      rationale: 'Both pages ask how measurement choices alter political accountability.',
      websitePath: '/learn/',
      concepts: ['measurement ethics', 'topological fairness'],
      sourceNoteRefs: [],
      zoteroKeys: [],
    },
  ],
  derivedConnections: [
    {
      id: 'ch17-paper10-derived',
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
      rationale: 'The paper formalises a fairness concern raised by the chapter.',
      origin: 'manual-fixture',
    },
  ],
  learningPaths: [],
};

describe('loadPhase3RenderingData', () => {
  it('returns empty data when the generated directory has no direct JSON files', () => {
    const root = tempRoot();
    mkdirSync(join(root, 'fixtures', 'valid'), { recursive: true });
    writeJson(join(root, 'fixtures', 'valid'), 'fixture.json', validExport);

    const data = loadPhase3RenderingData({ root, registry });

    expect(data.twoLenses).toEqual([]);
    expect(data.derivedConnections).toEqual([]);
    expect(data.learningPaths).toEqual([]);
  });

  it('loads and combines direct generated JSON files', () => {
    const root = tempRoot();
    writeJson(root, 'site-connections.json', validExport);

    const data = loadPhase3RenderingData({ root, registry });

    expect(data.manifest.sources).toHaveLength(1);
    expect(data.twoLenses).toHaveLength(1);
    expect(data.derivedConnections).toHaveLength(1);
  });

  it('throws for invalid direct generated JSON files', () => {
    const root = tempRoot();
    writeJson(root, 'invalid.json', { manifest: { schemaVersion: '1.0.0' } });

    expect(() => loadPhase3RenderingData({ root, registry })).toThrow(
      /Invalid Phase 3 generated data/,
    );
  });
});
```

- [ ] **Step 2: Run the focused failing tests**

Run:

```bash
npm run test -- src/lib/phase3/renderingData.test.ts
```

Expected: fail because `./renderingData` does not exist yet.

- [ ] **Step 3: Implement the reader**

Create `src/lib/phase3/renderingData.ts`:

```ts
import { existsSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { Phase3Export } from './contracts';
import {
  readPhase3ExportFile,
  validatePhase3Export,
} from './loadGeneratedData';
import type { SiteRouteRegistry } from './resolveSiteReferences';

export interface Phase3RenderingDataOptions {
  root?: string;
  registry?: SiteRouteRegistry;
}

export const phase3GeneratedDataRoot = join(
  process.cwd(),
  'src/data/generated/phase3',
);

function emptyPhase3Export(): Phase3Export {
  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt: '1970-01-01T00:00:00.000Z',
      exporter: {
        name: 'phase3-rendering-reader',
        version: '1.0.0',
      },
      sources: [],
      warnings: [],
    },
    twoLenses: [],
    derivedConnections: [],
    learningPaths: [],
  };
}

function directJsonFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => extname(entry.name) === '.json')
    .map((entry) => join(root, entry.name))
    .sort();
}

function combinePhase3Exports(exports: Phase3Export[]): Phase3Export {
  if (exports.length === 0) {
    return emptyPhase3Export();
  }

  return {
    manifest: {
      schemaVersion: '1.0.0',
      generatedAt: exports[0].manifest.generatedAt,
      exporter: {
        name: 'phase3-rendering-reader',
        version: '1.0.0',
      },
      sources: exports.flatMap((entry) => entry.manifest.sources),
      warnings: exports.flatMap((entry) => entry.manifest.warnings),
    },
    twoLenses: exports.flatMap((entry) => entry.twoLenses),
    derivedConnections: exports.flatMap((entry) => entry.derivedConnections),
    learningPaths: exports.flatMap((entry) => entry.learningPaths),
  };
}

export function loadPhase3RenderingData(
  options: Phase3RenderingDataOptions = {},
): Phase3Export {
  const root = options.root ?? phase3GeneratedDataRoot;
  const files = directJsonFiles(root);
  const exports = files.map((file) => {
    const data = readPhase3ExportFile(file);
    const result = validatePhase3Export(data, { registry: options.registry });

    if (!result.ok) {
      const details = result.issues
        .map((issue) => `${issue.code}${issue.path ? ` at ${issue.path}` : ''}`)
        .join(', ');
      throw new Error(`Invalid Phase 3 generated data in ${file}: ${details}`);
    }

    return result.data ?? data;
  });

  return combinePhase3Exports(exports);
}
```

- [ ] **Step 4: Add a minimal non-fixture site data seed**

Create `src/data/generated/phase3/site-connections.json`:

```json
{
  "manifest": {
    "schemaVersion": "1.0.0",
    "generatedAt": "2026-06-13T00:00:00.000Z",
    "exporter": {
      "name": "phase3-manual-site-seed",
      "version": "1.0.0"
    },
    "sources": [
      {
        "sourceId": "phase3-manual-site-seed",
        "sourceType": "manual-curation",
        "label": "Manual Phase 3 site rendering seed"
      }
    ],
    "warnings": []
  },
  "twoLenses": [
    {
      "id": "two-lenses-ch17-paper10",
      "title": "Measurement ethics and topological fairness",
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
      "rationale": "Both pages examine how measurement choices shape accountability.",
      "websitePath": "/learn/",
      "concepts": ["measurement ethics", "topological fairness"],
      "sourceNoteRefs": [],
      "zoteroKeys": []
    }
  ],
  "derivedConnections": [
    {
      "id": "ch17-persistent-homology-derived",
      "source": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "target": {
        "kind": "method",
        "id": "persistent-homology",
        "status": "resolved",
        "label": "Method",
        "title": "Persistent Homology"
      },
      "connectionType": "method-used",
      "confidence": "reviewed",
      "rationale": "The chapter's concern with durable measurement categories is formalised through persistence.",
      "origin": "manual-curation"
    },
    {
      "id": "paper10-ch17-derived",
      "source": {
        "kind": "paper",
        "id": "paper-10",
        "status": "resolved",
        "label": "Paper 10",
        "title": "Topological Fairness Analysis"
      },
      "target": {
        "kind": "chapter",
        "id": "ch-17",
        "status": "resolved",
        "label": "Chapter 17",
        "title": "Toward an Ethics of Measurement"
      },
      "connectionType": "two-lenses",
      "confidence": "confirmed",
      "rationale": "The paper gives a mathematical lens on the ethical question developed in the chapter.",
      "origin": "manual-curation"
    },
    {
      "id": "path3-module6-paper10-derived",
      "source": {
        "kind": "learn-module",
        "id": "path3-module-6",
        "status": "resolved",
        "label": "Learning Module",
        "title": "Fairness and Poverty Measurement"
      },
      "target": {
        "kind": "paper",
        "id": "paper-10",
        "status": "resolved",
        "label": "Paper 10",
        "title": "Topological Fairness Analysis"
      },
      "connectionType": "learning-path",
      "confidence": "reviewed",
      "rationale": "The module introduces the fairness question that Paper 10 develops as a research argument.",
      "origin": "manual-curation"
    }
  ],
  "learningPaths": [
    {
      "pathSlug": "data-justice",
      "generatedModules": [
        {
          "moduleId": "path3-module-6",
          "concepts": ["fairness", "poverty measurement"],
          "sourceNoteRefs": [],
          "status": "aligned"
        }
      ],
      "recommendedConnections": ["path3-module6-paper10-derived"],
      "twoLensesIds": ["two-lenses-ch17-paper10"]
    }
  ]
}
```

- [ ] **Step 5: Run reader tests and validation**

Run:

```bash
npm run test -- src/lib/phase3/renderingData.test.ts
npm run validate:phase3
```

Expected: tests pass; Phase 3 validation reports zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/generated/phase3/site-connections.json src/lib/phase3/renderingData.ts src/lib/phase3/renderingData.test.ts
git commit -m "feat: load phase 3 rendering data"
```

## Task 2: Page-Level Derived Connection Lookup

**Files:**
- Modify: `src/lib/phase3/mergeDerivedConnections.ts`
- Modify: `src/lib/phase3/mergeDerivedConnections.test.ts`
- Create: `src/lib/phase3/pageConnections.ts`
- Test: `src/lib/phase3/pageConnections.test.ts`

- [ ] **Step 1: Add failing selector and merge tests**

Append these cases to `src/lib/phase3/mergeDerivedConnections.test.ts`:

```ts
it('preserves unavailable metadata from hand-authored connections', () => {
  const merged = mergeDerivedConnections(
    [
      {
        targetKind: 'paper',
        targetId: 'paper-99',
        label: 'Paper 99',
        title: 'Future Paper',
        palette: 'tda',
        dataTodo: 'paper-not-found',
      },
    ],
    [],
  );

  expect(merged[0]).toMatchObject({
    source: 'hand-authored',
    dataTodo: 'paper-not-found',
  });
});

it('does not invent a learn-module URL when only an entry id is available', () => {
  const merged = mergeDerivedConnections([], [
    generatedConnectionForTarget({
      kind: 'learn-module',
      id: 'path3-module-6',
      slug: 'path3-module-6',
      status: 'resolved',
      label: 'Learning Module',
      title: 'Fairness and Poverty Measurement',
    }),
  ]);

  expect(merged[0]).not.toHaveProperty('href');
});

it('uses an explicit learn-module href from generated data', () => {
  const merged = mergeDerivedConnections([], [
    generatedConnectionForTarget({
      kind: 'learn-module',
      id: 'path3-module-6',
      href: '/learn/data-justice/6/',
      status: 'resolved',
      label: 'Learning Module',
      title: 'Fairness and Poverty Measurement',
    }),
  ]);

  expect(merged[0]?.href).toBe('/learn/data-justice/6/');
});
```

Create `src/lib/phase3/pageConnections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { DerivedConnection, Phase3Export } from './contracts';
import {
  derivedConnectionsForSource,
  renderableDerivedConnectionGroup,
  renderHandAuthoredConnections,
} from './pageConnections';
import type { HandAuthoredConnection } from './mergeDerivedConnections';

const source = {
  kind: 'chapter',
  id: 'ch-17',
  status: 'resolved',
  label: 'Chapter 17',
  title: 'Toward an Ethics of Measurement',
} as const;

function connection(
  id: string,
  confidence: DerivedConnection['confidence'],
  targetId = 'paper-10',
): DerivedConnection {
  return {
    id,
    source,
    target: {
      kind: 'paper',
      id: targetId,
      status: 'resolved',
      label: `Paper ${targetId}`,
      title: `Generated ${targetId}`,
    },
    connectionType: 'two-lenses',
    confidence,
    rationale: 'Generated test connection.',
    origin: 'manual-fixture',
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
  twoLenses: [],
  derivedConnections: [
    connection('confirmed', 'confirmed'),
    connection('reviewed', 'reviewed', 'paper-09'),
    connection('proposed', 'proposed', 'paper-08'),
    {
      ...connection('different-source', 'confirmed', 'paper-07'),
      source: { ...source, kind: 'paper', id: 'paper-10', label: 'Paper 10' },
    },
  ],
  learningPaths: [],
};

describe('derivedConnectionsForSource', () => {
  it('filters by source kind and id and omits proposed links', () => {
    expect(
      derivedConnectionsForSource(data, { kind: 'chapter', id: 'ch-17' }).map(
        (entry) => entry.id,
      ),
    ).toEqual(['confirmed', 'reviewed']);
  });
});

describe('renderHandAuthoredConnections', () => {
  it('renders hand-authored connections through the shared merge helper', () => {
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

    expect(renderHandAuthoredConnections(handAuthored)[0]).toMatchObject({
      source: 'hand-authored',
      href: '/tda/papers/paper-10/',
    });
  });
});

describe('renderableDerivedConnectionGroup', () => {
  it('dedupes generated links against hand-authored targets', () => {
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
    const generated = derivedConnectionsForSource(data, {
      kind: 'chapter',
      id: 'ch-17',
    });

    const group = renderableDerivedConnectionGroup(generated, { handAuthored });

    expect(group?.subheading).toBe('Derived from Phase 3');
    expect(group?.connections.map((entry) => entry.title)).toEqual([
      'Generated paper-09',
    ]);
    expect(group?.connections[0]?.href).toBe('/tda/papers/paper-09/');
  });
});
```

- [ ] **Step 2: Run the focused failing tests**

Run:

```bash
npm run test -- src/lib/phase3/pageConnections.test.ts src/lib/phase3/mergeDerivedConnections.test.ts
```

Expected: fail because `./pageConnections` does not exist and
`HandAuthoredConnection` does not yet accept `dataTodo`.

- [ ] **Step 3: Harden the shared merge helper**

In `src/lib/phase3/mergeDerivedConnections.ts`, add `dataTodo` to
`HandAuthoredConnection`, preserve it in `handAuthoredToRenderable`, and avoid
guessing learning-module routes from entry ids:

```ts
export interface HandAuthoredConnection {
  targetKind: SiteReference['kind'];
  targetId: string;
  href?: string;
  label: string;
  title: string;
  palette: Palette;
  dataTodo?: string;
}
```

```ts
const handAuthoredToRenderable = (
  connection: HandAuthoredConnection,
): RenderableConnection => {
  const renderable: RenderableConnection = {
    label: connection.label,
    title: connection.title,
    palette: connection.palette,
    source: 'hand-authored',
  };

  if (connection.href) {
    renderable.href = connection.href;
  }

  if (connection.dataTodo) {
    renderable.dataTodo = connection.dataTodo;
  }

  return renderable;
};
```

Use this `learn-module` case:

```ts
case 'learn-module':
  return undefined;
```

The existing top-level `if (reference.href)` still lets generated data provide
the canonical `/learn/{path}/{module}/` URL explicitly.

- [ ] **Step 4: Implement selectors**

Create `src/lib/phase3/pageConnections.ts`:

```ts
import type { DerivedConnection, Phase3Export, SiteReference } from './contracts';
import {
  mergeDerivedConnections,
  type HandAuthoredConnection,
  type RenderableConnection,
} from './mergeDerivedConnections';

export interface PageSourceReference {
  kind: SiteReference['kind'];
  id: string;
}

export interface DerivedConnectionGroup {
  subheading: string;
  connections: RenderableConnection[];
}

export interface RenderableDerivedConnectionGroupOptions {
  handAuthored?: HandAuthoredConnection[];
  subheading?: string;
}

export const derivedConnectionsSubheading = 'Derived from Phase 3';

export function derivedConnectionsForSource(
  data: Phase3Export,
  source: PageSourceReference,
): DerivedConnection[] {
  return data.derivedConnections.filter(
    (connection) =>
      connection.source.kind === source.kind &&
      connection.source.id === source.id &&
      connection.confidence !== 'proposed',
  );
}

export function renderHandAuthoredConnections(
  handAuthored: HandAuthoredConnection[],
): RenderableConnection[] {
  return mergeDerivedConnections(handAuthored, []).filter(
    (connection) => connection.source === 'hand-authored',
  );
}

export function renderableDerivedConnectionGroup(
  generatedConnections: DerivedConnection[],
  options: RenderableDerivedConnectionGroupOptions = {},
): DerivedConnectionGroup | null {
  const merged = mergeDerivedConnections(
    options.handAuthored ?? [],
    generatedConnections,
  );
  const generated = merged.filter((connection) => connection.source === 'generated');

  if (generated.length === 0) {
    return null;
  }

  return {
    subheading: options.subheading ?? derivedConnectionsSubheading,
    connections: generated,
  };
}

export function appendDerivedConnectionGroup(
  groups: DerivedConnectionGroup[],
  group: DerivedConnectionGroup | null,
): DerivedConnectionGroup[] {
  return group ? [...groups, group] : groups;
}
```

- [ ] **Step 5: Run selector tests**

Run:

```bash
npm run test -- src/lib/phase3/pageConnections.test.ts src/lib/phase3/mergeDerivedConnections.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/phase3/mergeDerivedConnections.ts src/lib/phase3/mergeDerivedConnections.test.ts src/lib/phase3/pageConnections.ts src/lib/phase3/pageConnections.test.ts
git commit -m "feat: select phase 3 page connections"
```

## Task 3: Confirmed Two Lenses Rendering Helpers

**Files:**
- Create: `src/lib/phase3/twoLensesRendering.ts`
- Test: `src/lib/phase3/twoLensesRendering.test.ts`
- Create: `src/components/phase3/TwoLensesLinks.astro`

- [ ] **Step 1: Add failing Two Lenses tests**

Create `src/lib/phase3/twoLensesRendering.test.ts`:

```ts
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
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm run test -- src/lib/phase3/twoLensesRendering.test.ts
```

Expected: fail because `./twoLensesRendering` does not exist yet.

- [ ] **Step 3: Implement helper**

Create `src/lib/phase3/twoLensesRendering.ts`:

```ts
import type { Phase3Export, SiteReference } from './contracts';

export interface RenderableTwoLensesLink {
  id: string;
  title: string;
  href: string;
  mathematical: Pick<SiteReference, 'label' | 'title'>;
  political: Pick<SiteReference, 'label' | 'title'>;
  rationale: string;
  concepts: string[];
}

export function confirmedTwoLensesLinks(
  data: Phase3Export,
): RenderableTwoLensesLink[] {
  return data.twoLenses
    .filter((link) => link.status === 'confirmed')
    .map((link) => ({
      id: link.id,
      title: link.title,
      href: link.websitePath,
      mathematical: {
        label: link.mathematical.label,
        title: link.mathematical.title,
      },
      political: {
        label: link.political.label,
        title: link.political.title,
      },
      rationale: link.rationale,
      concepts: link.concepts,
    }));
}
```

- [ ] **Step 4: Add presentational component**

Create `src/components/phase3/TwoLensesLinks.astro`:

```astro
---
import type { RenderableTwoLensesLink } from '@lib/phase3/twoLensesRendering';

interface Props {
  links: RenderableTwoLensesLink[];
}

const { links } = Astro.props;
---

{links.length > 0 && (
  <section class="two-lenses-links" aria-labelledby="two-lenses-heading">
    <div class="two-lenses-links__header">
      <h2 id="two-lenses-heading">Two Lenses</h2>
      <p>
        Confirmed bridges between the mathematics of TDA and the politics of
        poverty measurement.
      </p>
    </div>

    <ul class="two-lenses-links__list">
      {links.map((link) => (
        <li>
          <a href={link.href} class="two-lenses-card">
            <span class="two-lenses-card__title">{link.title}</span>
            <span class="two-lenses-card__pair">
              <span>
                <span class="two-lenses-card__label">Mathematical</span>
                <span class="two-lenses-card__endpoint">
                  {link.mathematical.label}: {link.mathematical.title}
                </span>
              </span>
              <span>
                <span class="two-lenses-card__label">Political</span>
                <span class="two-lenses-card__endpoint">
                  {link.political.label}: {link.political.title}
                </span>
              </span>
            </span>
            <span class="two-lenses-card__rationale">{link.rationale}</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
)}

<style>
  .two-lenses-links {
    margin-top: var(--space-10);
    padding-top: var(--space-8);
    border-top: 1px solid var(--color-neutral-border);
  }

  .two-lenses-links__header {
    margin-bottom: var(--space-5);
  }

  .two-lenses-links__header h2 {
    font-family: var(--font-ui);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-neutral-muted);
    margin: 0 0 var(--space-2);
  }

  .two-lenses-links__header p {
    font-family: var(--font-body);
    color: var(--color-neutral-muted);
    line-height: var(--leading-relaxed);
    margin: 0;
    max-width: 68ch;
  }

  .two-lenses-links__list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: var(--space-4);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .two-lenses-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-height: 100%;
    padding: var(--space-5);
    border: 1px solid var(--color-neutral-border);
    border-left: 4px solid var(--color-tda-teal);
    border-radius: var(--radius-md);
    color: inherit;
    text-decoration: none;
    background: var(--color-neutral-surface);
  }

  .two-lenses-card:hover,
  .two-lenses-card:focus-visible {
    border-color: var(--color-tda-teal);
    outline: 2px solid transparent;
    box-shadow: var(--shadow-sm);
  }

  .two-lenses-card__title {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-neutral-body);
  }

  .two-lenses-card__pair {
    display: grid;
    gap: var(--space-3);
  }

  .two-lenses-card__label {
    display: block;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-neutral-muted);
  }

  .two-lenses-card__endpoint,
  .two-lenses-card__rationale {
    display: block;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
  }

  .two-lenses-card__rationale {
    color: var(--color-neutral-muted);
  }
</style>
```

- [ ] **Step 5: Run helper tests**

Run:

```bash
npm run test -- src/lib/phase3/twoLensesRendering.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/phase3/twoLensesRendering.ts src/lib/phase3/twoLensesRendering.test.ts src/components/phase3/TwoLensesLinks.astro
git commit -m "feat: render confirmed two lenses links"
```

## Task 4: Chapter And Paper Layout Integration

**Files:**
- Modify: `src/layouts/ChapterLayout.astro`
- Modify: `src/layouts/PaperLayout.astro`
- Modify: `src/pages/counting-lives/chapters/[slug].astro`
- Modify: `src/pages/tda/papers/[slug].astro`

- [ ] **Step 1: Pass chapter and paper generated links from route files**

In `src/pages/counting-lives/chapters/[slug].astro`, add imports:

```ts
import { loadPhase3RenderingData } from '@lib/phase3/renderingData';
import { derivedConnectionsForSource } from '@lib/phase3/pageConnections';
import type { DerivedConnection } from '@lib/phase3/contracts';
```

Inside `getStaticPaths()`, load once before `return allChapters.map(...)`:

```ts
const phase3Data = loadPhase3RenderingData();
```

Inside the mapped route object, add:

```ts
const derivedConnections = derivedConnectionsForSource(phase3Data, {
  kind: 'chapter',
  id: entry.id,
});
```

Return it in props:

```ts
props: { entry, prevChapter, nextChapter, derivedConnections },
```

Add the prop type:

```ts
derivedConnections?: DerivedConnection[];
```

Pass it to the layout:

```astro
<ChapterLayout
  entry={entry}
  prevChapter={prevChapter}
  nextChapter={nextChapter}
  derivedConnections={derivedConnections}
/>
```

In `src/pages/tda/papers/[slug].astro`, add imports:

```ts
import { loadPhase3RenderingData } from '@lib/phase3/renderingData';
import { derivedConnectionsForSource } from '@lib/phase3/pageConnections';
import type { DerivedConnection } from '@lib/phase3/contracts';
```

Inside `getStaticPaths()`, load once before `return allPapers.map(...)`:

```ts
const phase3Data = loadPhase3RenderingData();
```

Inside the mapped route object, add:

```ts
const derivedConnections = derivedConnectionsForSource(phase3Data, {
  kind: 'paper',
  id: entry.id,
});
```

Return it in props:

```ts
props: { entry, prevPaper, nextPaper, derivedConnections },
```

Add the prop type:

```ts
derivedConnections?: DerivedConnection[];
```

Pass it to the layout:

```astro
<PaperLayout
  entry={entry}
  prevPaper={prevPaper}
  nextPaper={nextPaper}
  derivedConnections={derivedConnections}
/>
```

- [ ] **Step 2: Update `ChapterLayout.astro` imports and props**

Add imports:

```ts
import {
  appendDerivedConnectionGroup,
  renderableDerivedConnectionGroup,
  renderHandAuthoredConnections,
} from '@lib/phase3/pageConnections';
import type { DerivedConnection } from '@lib/phase3/contracts';
import type { HandAuthoredConnection } from '@lib/phase3/mergeDerivedConnections';
```

Add to `Props`:

```ts
derivedConnections?: DerivedConnection[];
```

Destructure with a default:

```ts
const { entry, prevChapter, nextChapter, derivedConnections = [] } = Astro.props;
```

- [ ] **Step 3: Convert chapter hand-authored connections to keyed arrays**

Replace the `paperConnections` and `interludeConnections` construction with
keyed arrays plus renderable arrays:

```ts
const paperHandAuthoredConnections: HandAuthoredConnection[] = related_tda_papers.map((n) => {
  const paper = allPapers.find((p) => p.data.paper_number === n);
  return paper
    ? {
        targetKind: 'paper',
        targetId: paper.id,
        href: `/tda/papers/${paper.id}`,
        label: `Paper ${n}`,
        title: paper.data.title,
        palette: 'tda',
      }
    : {
        targetKind: 'paper',
        targetId: `paper-${n}`,
        label: `Paper ${n}`,
        title: `Paper ${n}`,
        palette: 'tda',
        dataTodo: 'paper-not-found',
      };
});

const interludeHandAuthoredConnections: HandAuthoredConnection[] = interludeSlugs.map((slug) => {
  const interlude = allInterludes.find((i) => i.data.interlude_slug === slug);
  return interlude
    ? {
        targetKind: 'interlude',
        targetId: slug,
        href: `/counting-lives/interludes/${slug}`,
        label: 'Mathematical Interlude',
        title: interlude.data.title,
        palette: 'cl',
      }
    : {
        targetKind: 'interlude',
        targetId: slug,
        label: 'Mathematical Interlude',
        title: slug,
        palette: 'cl',
        dataTodo: 'route-missing',
      };
});

const paperConnections = renderHandAuthoredConnections(paperHandAuthoredConnections);
const interludeConnections = renderHandAuthoredConnections(interludeHandAuthoredConnections);
const chapterDerivedConnectionGroup = renderableDerivedConnectionGroup(derivedConnections, {
  handAuthored: [
    ...paperHandAuthoredConnections,
    ...interludeHandAuthoredConnections,
  ],
});
const chapterConnectionGroups = appendDerivedConnectionGroup(
  [
    ...(paperConnections.length > 0
      ? [{ subheading: 'TDA Research Programme', connections: paperConnections }]
      : []),
    ...(interludeConnections.length > 0
      ? [{ subheading: 'Mathematical Interludes', connections: interludeConnections }]
      : []),
  ],
  chapterDerivedConnectionGroup,
);
```

- [ ] **Step 4: Update the chapter panel render**

Replace the inline `groups={[...]}` construction with:

```astro
<ConnectionsPanel heading="Connections Forward" groups={chapterConnectionGroups} />
```

The outer conditional should use `chapterConnectionGroups.length > 0`.

- [ ] **Step 5: Update `PaperLayout.astro`**

Add imports:

```ts
import {
  renderableDerivedConnectionGroup,
  renderHandAuthoredConnections,
} from '@lib/phase3/pageConnections';
import type { DerivedConnection } from '@lib/phase3/contracts';
import type { HandAuthoredConnection } from '@lib/phase3/mergeDerivedConnections';
```

Add `derivedConnections?: DerivedConnection[]` to `Props`, destructure it with
`derivedConnections = []`, and convert the existing hand-authored arrays to
keyed `HandAuthoredConnection[]` arrays. Use:

- method target: `{ targetKind: 'method', targetId: slug }`
- dependency/enables target: `{ targetKind: 'paper', targetId: paper.id }`

Create the generated group:

```ts
const paperDerivedConnectionGroup = renderableDerivedConnectionGroup(derivedConnections, {
  handAuthored: [
    ...methodHandAuthoredConnections,
    ...dependsOnHandAuthoredConnections,
    ...enablesHandAuthoredConnections,
  ],
});
const paperDerivedConnections = paperDerivedConnectionGroup?.connections ?? [];
```

Render a third panel after `Research Dependencies`:

```astro
{paperDerivedConnections.length > 0 && (
  <ConnectionsPanel heading="Derived Connections" connections={paperDerivedConnections} />
)}
```

Update the outer paper-connections conditional to include
`paperDerivedConnections.length > 0`.

- [ ] **Step 6: Run layout typecheck**

Run:

```bash
npm run check
```

Expected: zero errors. Existing hints may remain.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/ChapterLayout.astro src/layouts/PaperLayout.astro "src/pages/counting-lives/chapters/[slug].astro" "src/pages/tda/papers/[slug].astro"
git commit -m "feat: show phase 3 connections on chapters and papers"
```

## Task 5: Module Layout And Learn Hub Integration

**Files:**
- Modify: `src/layouts/ModuleLayout.astro`
- Modify: `src/pages/learn/[path]/[module].astro`
- Modify: `src/pages/learn/index.astro`

- [ ] **Step 1: Pass module generated links from the route file**

In `src/pages/learn/[path]/[module].astro`, add imports:

```ts
import { loadPhase3RenderingData } from '@lib/phase3/renderingData';
import { derivedConnectionsForSource } from '@lib/phase3/pageConnections';
import type { DerivedConnection } from '@lib/phase3/contracts';
```

Inside `getStaticPaths()`, load once before `return allModules.map(...)`:

```ts
const phase3Data = loadPhase3RenderingData();
```

Inside the mapped route object, add:

```ts
const derivedConnections = derivedConnectionsForSource(phase3Data, {
  kind: 'learn-module',
  id: entry.id,
});
```

Return it in props:

```ts
props: { entry, pathModules, prevModule, nextModule, derivedConnections },
```

Add the prop type:

```ts
derivedConnections?: DerivedConnection[];
```

Destructure it:

```ts
const { entry, pathModules, prevModule, nextModule, derivedConnections } =
  Astro.props;
```

Pass it to the layout:

```astro
<ModuleLayout
  entry={entry}
  pathModules={pathModules}
  prevModule={prevModule}
  nextModule={nextModule}
  derivedConnections={derivedConnections}
/>
```

- [ ] **Step 2: Compute module derived links in the layout**

In `ModuleLayout.astro`, add imports:

```ts
import { renderableDerivedConnectionGroup } from '@lib/phase3/pageConnections';
import type { DerivedConnection } from '@lib/phase3/contracts';
```

Add `derivedConnections?: DerivedConnection[]` to `Props`, destructure with
`derivedConnections = []`, and add:

```ts
const moduleDerivedConnectionGroup =
  renderableDerivedConnectionGroup(derivedConnections);
const moduleDerivedConnections = moduleDerivedConnectionGroup?.connections ?? [];
const hasHandAuthoredModuleConnections =
  connections.chapters.length > 0 ||
  connections.papers.length > 0 ||
  connections.modules.length > 0 ||
  connections.methods.length > 0;
const hasModuleConnections =
  hasHandAuthoredModuleConnections || moduleDerivedConnections.length > 0;
```

- [ ] **Step 3: Render module derived links in the sidebar**

Change the sidebar conditional to `hasModuleConnections`. Add this group after
the hand-authored groups:

```astro
{moduleDerivedConnections.length > 0 && (
  <div class="connections-group">
    <h3 class="connections-group-label">Derived</h3>
    <ul class="connections-list">
      {moduleDerivedConnections.map((connection) => (
        <li>
          {connection.href ? (
            <a
              href={connection.href}
              class="connections-link"
              data-todo={connection.dataTodo}
            >
              {connection.label}: {connection.title}
            </a>
          ) : (
            <span class="connections-link connections-link--unavailable" data-todo={connection.dataTodo}>
              {connection.label}: {connection.title}
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
)}
```

Add CSS:

```css
.connections-link--unavailable {
  opacity: 0.7;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Integrate Two Lenses on the learn hub**

Add imports to `src/pages/learn/index.astro`:

```ts
import TwoLensesLinks from '@components/phase3/TwoLensesLinks.astro';
import { loadPhase3RenderingData } from '@lib/phase3/renderingData';
import { confirmedTwoLensesLinks } from '@lib/phase3/twoLensesRendering';
```

Add data:

```ts
const phase3Data = loadPhase3RenderingData();
const twoLensesLinks = confirmedTwoLensesLinks(phase3Data);
```

Render between the path section and resources section:

```astro
<TwoLensesLinks links={twoLensesLinks} />
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
npm run test -- src/lib/phase3
npm run check
```

Expected: Phase 3 tests pass; typecheck has zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/ModuleLayout.astro "src/pages/learn/[path]/[module].astro" src/pages/learn/index.astro
git commit -m "feat: surface phase 3 links in learning pages"
```

## Task 6: Validation Gate And Full Verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add verification script**

In `package.json`, add:

```json
"verify:phase3": "npm run validate:phase3 && npm run test -- src/lib/phase3 && npm run check"
```

Keep `build` unchanged.

- [ ] **Step 2: Run Phase 3 verification**

Run:

```bash
npm run verify:phase3
```

Expected: Phase 3 validation succeeds, targeted tests pass, and Astro check
has zero errors.

- [ ] **Step 3: Run full project verification**

Run:

```bash
npm run test
npm run build
```

Expected: full tests pass and Astro build exits zero. Existing Zotero env-var
and Vite chunk/alias warnings may still appear, but they must not be new errors.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add phase 3 verification gate"
```

## Final Review

- [ ] Confirm `git status --short` is clean.
- [ ] Confirm no Phase 3 rendering code reads outside the repository.
- [ ] Confirm generated public links still exclude `proposed` confidence.
- [ ] Confirm `/learn/` renders with confirmed Two Lenses entries when
  `site-connections.json` is present.
- [ ] Confirm the final response lists the verification commands and any
  remaining warnings.
