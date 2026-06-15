# Cross-Vault Linker Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate Phase 3 cross-vault linker workflow that proposes TDA-to-Counting-Lives links, writes review reports and metadata candidate files, and never silently writes to vault notes or promoted website JSON.

**Architecture:** The linker is a website-owned, report-only workflow that reuses the existing source inventory and vault scanner. It lives beside the exporter under `src/lib/phase3/linker/` and is invoked by a separate `phase3:link:propose` command. Candidate export and promotion remain unchanged: reviewed metadata still enters the website through explicit vault frontmatter edits followed by `phase3:export:candidate` and `phase3:promote`.

**Tech Stack:** TypeScript, Node `fs`/`path`, Vitest, existing `phase3` contracts, existing `vaultScanner`, existing `sourceInventory`, existing `scripts/phase3/cli.ts`.

---

## Boundaries

This plan is intentionally separate from `phase3:export:candidate`.

- The linker proposes relationships; it does not decide that they are true.
- The linker writes only files under report/output paths supplied by CLI flags.
- Default outputs live under `reports/phase3/`.
- The linker must reject output paths inside either source vault root.
- The linker must reject output paths that equal `src/data/generated/phase3/site-connections.json`.
- The linker must not edit Obsidian notes, the TDL repo, `src/data/generated/phase3/site-connections.json`, or any public Astro route.
- A metadata candidate can be generated with `status: confirmed` only when the caller explicitly passes `--candidate-status confirmed`; it is still written to a report file, not to a vault.

The safe default is `--candidate-status draft`.

## Review Workflow

```text
Supplied vault roots
        |
        v
sourceInventory + scanVaultNotes
        |
        v
cross-vault linker scoring
        |
        v
reports/phase3/cross-vault-linker.report.json
reports/phase3/cross-vault-linker.metadata-candidates.md
        |
        v
human review and optional manual vault metadata edits
        |
        v
phase3:export:candidate
        |
        v
phase3:promote
```

## File Structure

- Create `src/lib/phase3/linker/contracts.ts`
  - Shared report, proposal, evidence, scoring option, and metadata candidate types.
- Create `src/lib/phase3/linker/signals.ts`
  - Deterministic token, citekey, concept, and title-overlap signal extraction.
- Test `src/lib/phase3/linker/signals.test.ts`
  - Stopword filtering, citekey evidence, token overlap, and stable ordering.
- Create `src/lib/phase3/linker/proposalBuilder.ts`
  - Cross-vault pair scoring and report generation.
- Test `src/lib/phase3/linker/proposalBuilder.test.ts`
  - Strong proposal, threshold filtering, max proposal limit, stable ids, no same-source links.
- Create `src/lib/phase3/linker/metadataCandidates.ts`
  - Markdown/YAML candidate block rendering for human review.
- Test `src/lib/phase3/linker/metadataCandidates.test.ts`
  - Draft default, explicit confirmed status, warning banner, deterministic output.
- Modify `scripts/phase3/cli.ts`
  - Add default linker report paths and output-root guards.
- Modify `scripts/phase3/cli.test.ts`
  - Cover output guards and default linker paths.
- Create `scripts/phase3/link-proposals.ts`
  - `npm run phase3:link:propose` entry point.
- Modify `package.json`
  - Add `phase3:link:propose`.

## Data Contracts

The linker report is not a `Phase3Export`. It is review evidence.

Use these public TypeScript shapes:

```ts
// src/lib/phase3/linker/contracts.ts
import type { SiteReference } from '../contracts';
import type { ScannedVaultNote } from '../exporter/vaultScanner';

export type LinkEvidenceKind =
  | 'shared-citekey'
  | 'shared-concept'
  | 'shared-token'
  | 'title-token';

export type LinkConfidenceBand = 'strong' | 'moderate' | 'weak';

export type MetadataCandidateStatus = 'draft' | 'confirmed';

export interface LinkEndpoint {
  sourceId: string;
  path: string;
  title: string;
  site?: SiteReference;
}

export interface LinkEvidence {
  kind: LinkEvidenceKind;
  value: string;
  weight: number;
}

export interface LinkProposal {
  id: string;
  score: number;
  band: LinkConfidenceBand;
  mathematical: LinkEndpoint;
  political: LinkEndpoint;
  evidence: LinkEvidence[];
  rationale: string;
  concepts: string[];
  metadataCandidate: TwoLensesMetadataCandidate;
}

export interface TwoLensesMetadataCandidate {
  id: string;
  title: string;
  status: MetadataCandidateStatus;
  mathematical: {
    sourceId: 'tda-research';
    path: string;
    site?: SiteReference;
  };
  political: {
    sourceId: 'counting-lives';
    path: string;
    site?: SiteReference;
  };
  websitePath: string;
  rationale: string;
  concepts: string[];
}

export interface CrossVaultLinkerOptions {
  minScore?: number;
  maxProposals?: number;
  candidateStatus?: MetadataCandidateStatus;
  generatedAt?: string;
}

export interface CrossVaultLinkerSummary {
  tdaNotes: number;
  countingLivesNotes: number;
  scoredPairs: number;
  proposals: number;
  strong: number;
  moderate: number;
  weak: number;
}

export interface CrossVaultLinkerReport {
  generatedAt: string;
  options: Required<Pick<CrossVaultLinkerOptions, 'minScore' | 'maxProposals' | 'candidateStatus'>>;
  summary: CrossVaultLinkerSummary;
  proposals: LinkProposal[];
  warnings: Array<{ code: string; message: string; sourceId?: string }>;
}

export interface LinkableNote extends ScannedVaultNote {
  siteReference: SiteReference;
}
```

The proposal builder should only propose between notes with `siteReference`.
Notes without site references can be counted in warnings later, but they should
not become Two Lenses metadata candidates in this first version.

## Task 1: Linker Contracts And Signals

**Files:**
- Create: `src/lib/phase3/linker/contracts.ts`
- Create: `src/lib/phase3/linker/signals.ts`
- Test: `src/lib/phase3/linker/signals.test.ts`

- [ ] **Step 1: Write failing signal tests**

Create `src/lib/phase3/linker/signals.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  evidenceForPair,
  normalizedTokens,
  scoreEvidence,
} from './signals';
import type { LinkableNote } from './contracts';

function note(fields: Partial<LinkableNote>): LinkableNote {
  return {
    sourceId: 'tda-research',
    relativePath: 'method.md',
    title: 'Persistent Homology',
    frontmatter: {},
    citekeys: [],
    siteReference: {
      kind: 'method',
      id: 'persistent-homology',
      status: 'resolved',
      label: 'Method',
      title: 'Persistent Homology',
    },
    ...fields,
  };
}

describe('normalizedTokens', () => {
  it('lowercases, removes punctuation, and drops common stopwords', () => {
    expect(normalizedTokens('The Ethics of Persistent Measurement')).toEqual([
      'ethics',
      'persistent',
      'measurement',
    ]);
  });
});

describe('evidenceForPair', () => {
  it('records shared citekeys before weaker token evidence', () => {
    const evidence = evidenceForPair(
      note({
        title: 'Persistent Homology',
        citekeys: ['edelsbrunner2002', 'sen1976'],
        frontmatter: { concepts: ['topology', 'measurement'] },
      }),
      note({
        sourceId: 'counting-lives',
        relativePath: 'chapter.md',
        title: 'Measurement Ethics',
        citekeys: ['sen1976'],
        siteReference: {
          kind: 'chapter',
          id: 'ch-17',
          status: 'resolved',
          label: 'Chapter 17',
          title: 'Toward an Ethics of Measurement',
        },
        frontmatter: { concepts: ['measurement', 'poverty'] },
      }),
    );

    expect(evidence[0]).toMatchObject({
      kind: 'shared-citekey',
      value: 'sen1976',
      weight: 0.55,
    });
    expect(evidence).toContainEqual({
      kind: 'shared-concept',
      value: 'measurement',
      weight: 0.25,
    });
  });
});

describe('scoreEvidence', () => {
  it('caps scores at 1 and rounds to three decimals', () => {
    expect(
      scoreEvidence([
        { kind: 'shared-citekey', value: 'a', weight: 0.55 },
        { kind: 'shared-citekey', value: 'b', weight: 0.55 },
      ]),
    ).toBe(1);
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/linker/signals.test.ts
```

Expected: fail because `./signals` does not exist.

- [ ] **Step 3: Add contracts**

Create `src/lib/phase3/linker/contracts.ts` using the interfaces from the
Data Contracts section. Export all interfaces and union types.

- [ ] **Step 4: Implement signal extraction**

Create `src/lib/phase3/linker/signals.ts`:

```ts
import type { LinkEvidence, LinkableNote } from './contracts';

const stopwords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

function stringsFrom(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  }
  return [];
}

export function normalizedTokens(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 3)
        .filter((token) => !stopwords.has(token)),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

function noteConcepts(note: LinkableNote): string[] {
  return [
    ...new Set(
      [
        ...stringsFrom(note.frontmatter.concepts),
        ...stringsFrom(note.frontmatter.tags),
        ...stringsFrom(note.frontmatter.keywords),
      ].map((value) => value.trim().toLowerCase()),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

function sharedValues(left: string[], right: string[]): string[] {
  const rightValues = new Set(right);
  return left.filter((value) => rightValues.has(value)).sort((a, b) => a.localeCompare(b));
}

export function evidenceForPair(
  tdaNote: LinkableNote,
  countingLivesNote: LinkableNote,
): LinkEvidence[] {
  const tdaConcepts = noteConcepts(tdaNote);
  const countingLivesConcepts = noteConcepts(countingLivesNote);
  const sharedConcepts = sharedValues(tdaConcepts, countingLivesConcepts);
  const sharedTitleTokens = sharedValues(
    normalizedTokens(tdaNote.title),
    normalizedTokens(countingLivesNote.title),
  );
  const alreadyExplainedTokens = new Set([...sharedConcepts, ...sharedTitleTokens]);

  return [
    ...sharedValues(tdaNote.citekeys, countingLivesNote.citekeys).map((value) => ({
      kind: 'shared-citekey' as const,
      value,
      weight: 0.55,
    })),
    ...sharedConcepts.map((value) => ({
      kind: 'shared-concept' as const,
      value,
      weight: 0.25,
    })),
    ...sharedTitleTokens.map((value) => ({
      kind: 'title-token' as const,
      value,
      weight: 0.15,
    })),
    ...sharedValues(
      normalizedTokens(`${tdaNote.title} ${tdaConcepts.join(' ')}`),
      normalizedTokens(`${countingLivesNote.title} ${countingLivesConcepts.join(' ')}`),
    )
      .filter((value) => !alreadyExplainedTokens.has(value))
      .map((value) => ({
        kind: 'shared-token' as const,
        value,
        weight: 0.1,
      })),
  ];
}

export function scoreEvidence(evidence: LinkEvidence[]): number {
  const score = evidence.reduce((total, item) => total + item.weight, 0);
  return Math.min(1, Math.round(score * 1000) / 1000);
}
```

- [ ] **Step 5: Run signal tests**

Run:

```bash
npm run test -- src/lib/phase3/linker/signals.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/phase3/linker/contracts.ts src/lib/phase3/linker/signals.ts src/lib/phase3/linker/signals.test.ts
git commit -m "feat: add phase 3 linker signals"
```

## Task 2: Cross-Vault Proposal Builder

**Files:**
- Create: `src/lib/phase3/linker/proposalBuilder.ts`
- Test: `src/lib/phase3/linker/proposalBuilder.test.ts`

- [ ] **Step 1: Write failing proposal builder tests**

Create `src/lib/phase3/linker/proposalBuilder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ScanVaultResult, ScannedVaultNote } from '../exporter/vaultScanner';
import { buildCrossVaultLinkerReport } from './proposalBuilder';

function site(kind: 'method' | 'chapter', id: string) {
  return {
    kind,
    id,
    status: 'resolved' as const,
    label: kind === 'method' ? 'Method' : 'Chapter',
    title: id,
  };
}

function note(fields: Partial<ScannedVaultNote>): ScannedVaultNote {
  return {
    sourceId: 'tda-research',
    relativePath: 'method.md',
    title: 'Persistent Homology',
    frontmatter: {},
    citekeys: [],
    siteReference: site('method', 'persistent-homology'),
    ...fields,
  };
}

function scan(sourceId: string, notes: ScannedVaultNote[]): ScanVaultResult {
  return { sourceId, root: `/tmp/${sourceId}`, notes, warnings: [] };
}

describe('buildCrossVaultLinkerReport', () => {
  it('proposes cross-vault links with shared evidence', () => {
    const report = buildCrossVaultLinkerReport({
      scans: [
        scan('tda-research', [
          note({
            citekeys: ['sen1976'],
            frontmatter: { concepts: ['measurement'] },
          }),
        ]),
        scan('counting-lives', [
          note({
            sourceId: 'counting-lives',
            relativePath: 'chapters/ch-17.md',
            title: 'Toward an Ethics of Measurement',
            citekeys: ['sen1976'],
            frontmatter: { concepts: ['measurement'] },
            siteReference: site('chapter', 'ch-17'),
          }),
        ]),
      ],
      generatedAt: '2026-06-15T00:00:00.000Z',
      minScore: 0.5,
    });

    expect(report.summary.proposals).toBe(1);
    expect(report.proposals[0]).toMatchObject({
      id: 'link-method-persistent-homology-chapter-ch-17',
      band: 'strong',
      score: 0.8,
    });
    expect(report.proposals[0]?.metadataCandidate.status).toBe('draft');
  });

  it('filters pairs below the minimum score', () => {
    const report = buildCrossVaultLinkerReport({
      scans: [
        scan('tda-research', [note({ title: 'Mapper' })]),
        scan('counting-lives', [
          note({
            sourceId: 'counting-lives',
            relativePath: 'chapters/ch-01.md',
            title: 'Households',
            siteReference: site('chapter', 'ch-01'),
          }),
        ]),
      ],
      minScore: 0.5,
    });

    expect(report.summary.scoredPairs).toBe(1);
    expect(report.summary.proposals).toBe(0);
  });

  it('honours maxProposals and explicit confirmed candidate status', () => {
    const report = buildCrossVaultLinkerReport({
      scans: [
        scan('tda-research', [
          note({ relativePath: 'a.md', citekeys: ['one'] }),
          note({ relativePath: 'b.md', citekeys: ['two'] }),
        ]),
        scan('counting-lives', [
          note({
            sourceId: 'counting-lives',
            relativePath: 'a.md',
            citekeys: ['one'],
            siteReference: site('chapter', 'ch-01'),
          }),
          note({
            sourceId: 'counting-lives',
            relativePath: 'b.md',
            citekeys: ['two'],
            siteReference: site('chapter', 'ch-02'),
          }),
        ]),
      ],
      maxProposals: 1,
      candidateStatus: 'confirmed',
    });

    expect(report.proposals).toHaveLength(1);
    expect(report.proposals[0]?.metadataCandidate.status).toBe('confirmed');
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/linker/proposalBuilder.test.ts
```

Expected: fail because `./proposalBuilder` does not exist.

- [ ] **Step 3: Implement proposal builder**

Create `src/lib/phase3/linker/proposalBuilder.ts`:

```ts
import type { SiteReference } from '../contracts';
import type { ScanVaultResult, ScannedVaultNote } from '../exporter/vaultScanner';
import type {
  CrossVaultLinkerOptions,
  CrossVaultLinkerReport,
  LinkConfidenceBand,
  LinkEndpoint,
  LinkEvidence,
  LinkProposal,
  LinkableNote,
  MetadataCandidateStatus,
  TwoLensesMetadataCandidate,
} from './contracts';
import { evidenceForPair, scoreEvidence } from './signals';

export interface BuildCrossVaultLinkerReportOptions extends CrossVaultLinkerOptions {
  scans: ScanVaultResult[];
}

const defaultMinScore = 0.5;
const defaultMaxProposals = 50;
const defaultCandidateStatus: MetadataCandidateStatus = 'draft';

function stableIdPart(value: string): string {
  const slug = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'item';
}

function hasSiteReference(note: ScannedVaultNote): note is LinkableNote {
  return Boolean(note.siteReference);
}

function notesFor(scans: ScanVaultResult[], sourceId: string): LinkableNote[] {
  return scans
    .filter((scan) => scan.sourceId === sourceId)
    .flatMap((scan) => scan.notes)
    .filter(hasSiteReference)
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function bandFor(score: number): LinkConfidenceBand {
  if (score >= 0.75) return 'strong';
  if (score >= 0.5) return 'moderate';
  return 'weak';
}

function endpoint(note: LinkableNote): LinkEndpoint {
  return {
    sourceId: note.sourceId,
    path: note.relativePath,
    title: note.title,
    site: note.siteReference,
  };
}

function titleFor(tda: LinkableNote, political: LinkableNote): string {
  return `${tda.title} and ${political.title}`;
}

function websitePathFor(id: string): string {
  return `/writing/essays/two-lenses/${id}`;
}

function conceptsFrom(evidence: LinkEvidence[]): string[] {
  return [
    ...new Set(
      evidence
        .filter((item) => item.kind === 'shared-concept' || item.kind === 'shared-token')
        .map((item) => item.value),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

function rationaleFor(evidence: LinkEvidence[]): string {
  const strongest = evidence.slice(0, 3).map((item) => {
    if (item.kind === 'shared-citekey') return `shared citation @${item.value}`;
    if (item.kind === 'shared-concept') return `shared concept "${item.value}"`;
    return `shared term "${item.value}"`;
  });
  return `Candidate cross-vault link based on ${strongest.join(', ')}.`;
}

function metadataCandidate(
  id: string,
  tda: LinkableNote,
  political: LinkableNote,
  evidence: LinkEvidence[],
  status: MetadataCandidateStatus,
): TwoLensesMetadataCandidate {
  return {
    id,
    title: titleFor(tda, political),
    status,
    mathematical: {
      sourceId: 'tda-research',
      path: tda.relativePath,
      site: tda.siteReference as SiteReference,
    },
    political: {
      sourceId: 'counting-lives',
      path: political.relativePath,
      site: political.siteReference as SiteReference,
    },
    websitePath: websitePathFor(id),
    rationale: rationaleFor(evidence),
    concepts: conceptsFrom(evidence),
  };
}

function proposalFor(
  tda: LinkableNote,
  political: LinkableNote,
  candidateStatus: MetadataCandidateStatus,
): LinkProposal | null {
  const evidence = evidenceForPair(tda, political);
  const score = scoreEvidence(evidence);
  if (score === 0) return null;

  const id = [
    'link',
    stableIdPart(tda.siteReference.kind),
    stableIdPart(tda.siteReference.id),
    stableIdPart(political.siteReference.kind),
    stableIdPart(political.siteReference.id),
  ].join('-');

  return {
    id,
    score,
    band: bandFor(score),
    mathematical: endpoint(tda),
    political: endpoint(political),
    evidence,
    rationale: rationaleFor(evidence),
    concepts: conceptsFrom(evidence),
    metadataCandidate: metadataCandidate(id, tda, political, evidence, candidateStatus),
  };
}

export function buildCrossVaultLinkerReport(
  options: BuildCrossVaultLinkerReportOptions,
): CrossVaultLinkerReport {
  const minScore = options.minScore ?? defaultMinScore;
  const maxProposals = options.maxProposals ?? defaultMaxProposals;
  const candidateStatus = options.candidateStatus ?? defaultCandidateStatus;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const tdaNotes = notesFor(options.scans, 'tda-research');
  const countingLivesNotes = notesFor(options.scans, 'counting-lives');
  const proposals: LinkProposal[] = [];
  let scoredPairs = 0;

  for (const tdaNote of tdaNotes) {
    for (const politicalNote of countingLivesNotes) {
      scoredPairs += 1;
      const proposal = proposalFor(tdaNote, politicalNote, candidateStatus);
      if (proposal && proposal.score >= minScore) {
        proposals.push(proposal);
      }
    }
  }

  const ranked = proposals
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.id.localeCompare(right.id),
    )
    .slice(0, maxProposals);

  return {
    generatedAt,
    options: { minScore, maxProposals, candidateStatus },
    summary: {
      tdaNotes: tdaNotes.length,
      countingLivesNotes: countingLivesNotes.length,
      scoredPairs,
      proposals: ranked.length,
      strong: ranked.filter((proposal) => proposal.band === 'strong').length,
      moderate: ranked.filter((proposal) => proposal.band === 'moderate').length,
      weak: ranked.filter((proposal) => proposal.band === 'weak').length,
    },
    proposals: ranked,
    warnings: options.scans.flatMap((scan) => scan.warnings),
  };
}
```

- [ ] **Step 4: Run proposal tests**

Run:

```bash
npm run test -- src/lib/phase3/linker/proposalBuilder.test.ts src/lib/phase3/linker/signals.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phase3/linker/proposalBuilder.ts src/lib/phase3/linker/proposalBuilder.test.ts
git commit -m "feat: propose phase 3 cross-vault links"
```

## Task 3: Metadata Candidate Rendering

**Files:**
- Create: `src/lib/phase3/linker/metadataCandidates.ts`
- Test: `src/lib/phase3/linker/metadataCandidates.test.ts`

- [ ] **Step 1: Write failing metadata rendering tests**

Create `src/lib/phase3/linker/metadataCandidates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { LinkProposal } from './contracts';
import { renderMetadataCandidatesMarkdown } from './metadataCandidates';

const proposal: LinkProposal = {
  id: 'link-method-persistent-homology-chapter-ch-17',
  score: 0.8,
  band: 'strong',
  mathematical: {
    sourceId: 'tda-research',
    path: '04-Methods/Persistent-Homology.md',
    title: 'Persistent Homology',
    site: {
      kind: 'method',
      id: 'persistent-homology',
      status: 'resolved',
      label: 'Method',
      title: 'Persistent Homology',
    },
  },
  political: {
    sourceId: 'counting-lives',
    path: 'chapters/ch-17.md',
    title: 'Toward an Ethics of Measurement',
    site: {
      kind: 'chapter',
      id: 'ch-17',
      status: 'resolved',
      label: 'Chapter',
      title: 'Toward an Ethics of Measurement',
    },
  },
  evidence: [{ kind: 'shared-citekey', value: 'sen1976', weight: 0.55 }],
  rationale: 'Candidate cross-vault link based on shared citation @sen1976.',
  concepts: ['measurement'],
  metadataCandidate: {
    id: 'link-method-persistent-homology-chapter-ch-17',
    title: 'Persistent Homology and Toward an Ethics of Measurement',
    status: 'draft',
    mathematical: {
      sourceId: 'tda-research',
      path: '04-Methods/Persistent-Homology.md',
      site: {
        kind: 'method',
        id: 'persistent-homology',
        status: 'resolved',
        label: 'Method',
        title: 'Persistent Homology',
      },
    },
    political: {
      sourceId: 'counting-lives',
      path: 'chapters/ch-17.md',
      site: {
        kind: 'chapter',
        id: 'ch-17',
        status: 'resolved',
        label: 'Chapter',
        title: 'Toward an Ethics of Measurement',
      },
    },
    websitePath: '/writing/essays/two-lenses/link-method-persistent-homology-chapter-ch-17',
    rationale: 'Candidate cross-vault link based on shared citation @sen1976.',
    concepts: ['measurement'],
  },
};

describe('renderMetadataCandidatesMarkdown', () => {
  it('renders a warning banner and YAML-like two-lenses block', () => {
    const markdown = renderMetadataCandidatesMarkdown([proposal], {
      generatedAt: '2026-06-15T00:00:00.000Z',
    });

    expect(markdown).toContain('Do not paste these blocks without human review.');
    expect(markdown).toContain('score: 0.8');
    expect(markdown).toContain('two-lenses:');
    expect(markdown).toContain('status: draft');
    expect(markdown).toContain('sourceId: tda-research');
    expect(markdown.endsWith('\n')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/lib/phase3/linker/metadataCandidates.test.ts
```

Expected: fail because `./metadataCandidates` does not exist.

- [ ] **Step 3: Implement Markdown candidate rendering**

Create `src/lib/phase3/linker/metadataCandidates.ts`:

```ts
import type { LinkProposal, TwoLensesMetadataCandidate } from './contracts';

export interface RenderMetadataCandidatesOptions {
  generatedAt?: string;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function renderSite(site: TwoLensesMetadataCandidate['mathematical']['site']): string[] {
  if (!site) return [];
  return [
    '      site:',
    `        kind: ${site.kind}`,
    `        id: ${quote(site.id)}`,
    `        status: ${site.status}`,
    `        label: ${quote(site.label)}`,
    `        title: ${quote(site.title)}`,
  ];
}

function renderCandidate(candidate: TwoLensesMetadataCandidate): string {
  const lines = [
    'two-lenses:',
    `  id: ${quote(candidate.id)}`,
    `  title: ${quote(candidate.title)}`,
    `  status: ${candidate.status}`,
    '  mathematical:',
    `    sourceId: ${candidate.mathematical.sourceId}`,
    `    path: ${quote(candidate.mathematical.path)}`,
    ...renderSite(candidate.mathematical.site),
    '  political:',
    `    sourceId: ${candidate.political.sourceId}`,
    `    path: ${quote(candidate.political.path)}`,
    ...renderSite(candidate.political.site),
    `  websitePath: ${quote(candidate.websitePath)}`,
    `  rationale: ${quote(candidate.rationale)}`,
    '  concepts:',
    ...(candidate.concepts.length > 0
      ? candidate.concepts.map((concept) => `    - ${quote(concept)}`)
      : ['    []']),
  ];

  return lines.join('\n');
}

export function renderMetadataCandidatesMarkdown(
  proposals: LinkProposal[],
  options: RenderMetadataCandidatesOptions = {},
): string {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sections = proposals.map((proposal, index) =>
    [
      `## ${index + 1}. ${proposal.metadataCandidate.title}`,
      '',
      `- proposalId: \`${proposal.id}\``,
      `- score: ${proposal.score}`,
      `- band: ${proposal.band}`,
      `- mathematical: ${proposal.mathematical.sourceId}/${proposal.mathematical.path}`,
      `- political: ${proposal.political.sourceId}/${proposal.political.path}`,
      '',
      '```yaml',
      renderCandidate(proposal.metadataCandidate),
      '```',
    ].join('\n'),
  );

  return [
    '# Cross-Vault Linker Metadata Candidates',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Do not paste these blocks without human review.',
    'These suggestions are report-only and were not written to either vault.',
    '',
    ...sections,
    '',
  ].join('\n');
}
```

- [ ] **Step 4: Run metadata tests**

Run:

```bash
npm run test -- src/lib/phase3/linker/metadataCandidates.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phase3/linker/metadataCandidates.ts src/lib/phase3/linker/metadataCandidates.test.ts
git commit -m "feat: render phase 3 metadata candidates"
```

## Task 4: Linker CLI Command And Output Guards

**Files:**
- Modify: `scripts/phase3/cli.ts`
- Modify: `scripts/phase3/cli.test.ts`
- Create: `scripts/phase3/link-proposals.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing CLI guard tests**

Add to `scripts/phase3/cli.test.ts`:

```ts
import { resolve } from 'node:path';
import {
  assertOutsideSourceRoots,
  defaultLinkerMetadataCandidatesPath,
  defaultLinkerReportPath,
} from './cli';

describe('linker defaults', () => {
  it('keeps linker outputs under reports by default', () => {
    expect(defaultLinkerReportPath).toContain('reports');
    expect(defaultLinkerReportPath).toContain('cross-vault-linker.report.json');
    expect(defaultLinkerMetadataCandidatesPath).toContain(
      'cross-vault-linker.metadata-candidates.md',
    );
  });
});

describe('assertOutsideSourceRoots', () => {
  it('rejects output paths inside supplied vault roots', () => {
    const root = resolve('C:/tmp/tda-vault');
    expect(() =>
      assertOutsideSourceRoots(resolve(root, 'candidate.md'), [root]),
    ).toThrow(/Refusing to write Phase 3 linker output inside a source root/);
  });
});
```

If `resolve('C:/tmp/tda-vault')` behaves unexpectedly on the local platform,
use `join(tempRoot(), 'vault')` and a child path under it.

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- scripts/phase3/cli.test.ts
```

Expected: fail because the new helpers do not exist.

- [ ] **Step 3: Extend CLI helpers**

Modify `scripts/phase3/cli.ts`:

```ts
export const defaultLinkerReportPath = join(
  process.cwd(),
  'reports/phase3/cross-vault-linker.report.json',
);

export const defaultLinkerMetadataCandidatesPath = join(
  process.cwd(),
  'reports/phase3/cross-vault-linker.metadata-candidates.md',
);

function isWithinRoot(path: string, root: string): boolean {
  const normalizedPath = normalizedAbsolutePath(path);
  const normalizedRoot = normalizedAbsolutePath(root);
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

export function assertOutsideSourceRoots(outputPath: string, roots: string[]): void {
  const matchingRoot = roots
    .filter((root) => root.trim().length > 0)
    .find((root) => isWithinRoot(outputPath, root));

  if (matchingRoot) {
    throw new Error(
      `Refusing to write Phase 3 linker output inside a source root: ${outputPath} is under ${matchingRoot}.`,
    );
  }
}
```

- [ ] **Step 4: Create linker command**

Create `scripts/phase3/link-proposals.ts`:

```ts
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import {
  assertNotPromotedOutputPath,
  assertOutsideSourceRoots,
  defaultLinkerMetadataCandidatesPath,
  defaultLinkerReportPath,
  parsePhase3Args,
  requiredOption,
  stringOption,
  writeJson,
} from './cli';
import { inspectVaultSources, type VaultSourceConfig } from '../../src/lib/phase3/exporter/sourceInventory';
import { scanVaultNotes, type ScanVaultResult } from '../../src/lib/phase3/exporter/vaultScanner';
import { buildCrossVaultLinkerReport } from '../../src/lib/phase3/linker/proposalBuilder';
import { renderMetadataCandidatesMarkdown } from '../../src/lib/phase3/linker/metadataCandidates';
import type { MetadataCandidateStatus } from '../../src/lib/phase3/linker/contracts';

function numberOption(
  args: Record<string, string | boolean>,
  key: string,
  fallback: number,
): number {
  const value = args[key];
  if (value === undefined) return fallback;
  if (value === true || !String(value).trim()) {
    throw new Error(`Option --${key} requires a numeric value.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Option --${key} must be a number.`);
  }
  return parsed;
}

function candidateStatusOption(
  args: Record<string, string | boolean>,
): MetadataCandidateStatus {
  const raw = stringOption(args, 'candidate-status', 'draft');
  if (raw === 'draft' || raw === 'confirmed') return raw;
  throw new Error('Option --candidate-status must be "draft" or "confirmed".');
}

function writeText(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf-8');
}

const args = parsePhase3Args(process.argv.slice(2));
const tdaVault = requiredOption(args, 'tda-vault', 'PHASE3_TDA_VAULT');
const countingLivesVault = requiredOption(
  args,
  'counting-lives-vault',
  'PHASE3_COUNTING_LIVES_VAULT',
);
const reportPath = stringOption(args, 'report', defaultLinkerReportPath);
const metadataPath = stringOption(
  args,
  'metadata-candidates',
  defaultLinkerMetadataCandidatesPath,
);
const minScore = numberOption(args, 'min-score', 0.5);
const maxProposals = numberOption(args, 'max-proposals', 50);
const candidateStatus = candidateStatusOption(args);

for (const outputPath of [reportPath, metadataPath]) {
  assertNotPromotedOutputPath(outputPath);
  assertOutsideSourceRoots(outputPath, [tdaVault, countingLivesVault]);
}

const sources: VaultSourceConfig[] = [
  {
    sourceId: 'tda-research',
    sourceType: 'obsidian-vault',
    label: 'TDA Research vault',
    root: tdaVault,
  },
  {
    sourceId: 'counting-lives',
    sourceType: 'obsidian-vault',
    label: 'Counting Lives vault',
    root: countingLivesVault,
  },
];
const inventory = inspectVaultSources(sources);
const scans: ScanVaultResult[] = inventory.sources.map((source) =>
  source.available
    ? scanVaultNotes({ root: source.localPath, sourceId: source.sourceId })
    : { sourceId: source.sourceId, root: source.localPath, notes: [], warnings: [] },
);
const report = buildCrossVaultLinkerReport({
  scans,
  minScore,
  maxProposals,
  candidateStatus,
});
const metadataMarkdown = renderMetadataCandidatesMarkdown(report.proposals, {
  generatedAt: report.generatedAt,
});

writeJson(reportPath, report);
writeText(metadataPath, metadataMarkdown);

console.log(
  `Phase 3 cross-vault linker: proposals=${report.summary.proposals}, strong=${report.summary.strong}, moderate=${report.summary.moderate}, weak=${report.summary.weak}`,
);
console.log(`Phase 3 cross-vault linker report -> ${reportPath}`);
console.log(`Phase 3 metadata candidates -> ${metadataPath}`);
```

- [ ] **Step 5: Add package script**

Modify `package.json`:

```json
"phase3:link:propose": "tsx scripts/phase3/link-proposals.ts"
```

- [ ] **Step 6: Run CLI tests**

Run:

```bash
npm run test -- scripts/phase3/cli.test.ts
```

Expected: tests pass.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/phase3/cli.ts scripts/phase3/cli.test.ts scripts/phase3/link-proposals.ts
git commit -m "feat: add phase 3 link proposal command"
```

## Task 5: Workflow Smoke Tests And No-Write Guarantees

**Files:**
- Test: `scripts/phase3/link-proposals.test.ts`

- [ ] **Step 1: Write command smoke tests**

Create `scripts/phase3/link-proposals.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-linker-cli-'));
}

function write(root: string, relativePath: string, text: string): void {
  const filePath = join(root, relativePath);
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, text, 'utf-8');
}

function note(title: string, kind: 'method' | 'chapter', id: string): string {
  return `---
title: "${title}"
citekey: "sen1976"
site:
  kind: "${kind}"
  id: "${id}"
  status: "resolved"
  label: "${kind}"
  title: "${title}"
concepts:
  - "measurement"
---

# ${title}
`;
}

describe('phase3:link:propose command', () => {
  it('writes report and metadata candidates without touching vault notes', () => {
    const root = tempRoot();
    const tdaVault = join(root, 'tda');
    const countingVault = join(root, 'counting');
    write(tdaVault, 'method.md', note('Persistent Homology', 'method', 'persistent-homology'));
    write(countingVault, 'chapter.md', note('Toward an Ethics of Measurement', 'chapter', 'ch-17'));
    const reportPath = join(root, 'report.json');
    const metadataPath = join(root, 'metadata.md');

    execFileSync(
      'npm',
      [
        'run',
        'phase3:link:propose',
        '--',
        '--tda-vault',
        tdaVault,
        '--counting-lives-vault',
        countingVault,
        '--report',
        reportPath,
        '--metadata-candidates',
        metadataPath,
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );

    expect(existsSync(reportPath)).toBe(true);
    expect(existsSync(metadataPath)).toBe(true);
    expect(readFileSync(join(tdaVault, 'method.md'), 'utf-8')).toContain(
      '# Persistent Homology',
    );
    expect(readFileSync(metadataPath, 'utf-8')).toContain('Do not paste these blocks');
  });
});
```

If Windows `execFileSync('npm', ...)` cannot resolve `npm`, use
`process.platform === 'win32' ? 'npm.cmd' : 'npm'`.

- [ ] **Step 2: Run command smoke test**

Run:

```bash
npm run test -- scripts/phase3/link-proposals.test.ts
```

Expected: test passes and writes only temporary report files.

- [ ] **Step 3: Run full linker test slice**

Run:

```bash
npm run test -- src/lib/phase3/linker scripts/phase3
```

Expected: linker and CLI tests pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/phase3/link-proposals.test.ts
git commit -m "test: cover phase 3 link proposal workflow"
```

## Task 6: Final Verification

**Files:**
- No new files unless earlier tasks uncovered a necessary correction.

- [ ] **Step 1: Run targeted linker tests**

Run:

```bash
npm run test -- src/lib/phase3/linker scripts/phase3
```

Expected: all linker and command tests pass.

- [ ] **Step 2: Run Phase 3 verification gate**

Run:

```bash
npm run verify:phase3
```

Expected: generated data validation succeeds, Phase 3 tests pass, and Astro
check has zero errors. Existing pending-reference fixture warnings may remain.

- [ ] **Step 3: Run full project tests**

Run:

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 4: Confirm build independence**

Run:

```bash
npm run build
```

Expected: build exits zero without reading live vault paths. Existing Zotero
env-var, Vite alias, plugin timing, chunk-size, and transform warnings may
remain if they match the current baseline.

- [ ] **Step 5: Confirm no live-vault dependency in render path**

Run:

```bash
rg -n "phase3:link:propose|PHASE3_TDA_VAULT|PHASE3_COUNTING_LIVES_VAULT|scanVaultNotes|inspectVaultSources|buildCrossVaultLinkerReport" src scripts
```

Expected: live vault paths and linker calls appear only in exporter/linker
libraries, tests, and `scripts/phase3`. They must not appear in Astro pages,
layouts, components, or rendering data readers.

- [ ] **Step 6: Confirm worktree state**

Run:

```bash
git status --short
```

Expected: clean worktree after all task commits.

## Acceptance Checklist

- [ ] Link proposals are deterministic and evidence-scored.
- [ ] Link proposals are cross-vault only.
- [ ] Link proposals require site references on both endpoints.
- [ ] Default metadata candidate status is `draft`.
- [ ] `status: confirmed` requires explicit `--candidate-status confirmed`.
- [ ] Metadata candidates are written only to a report file.
- [ ] Linker outputs cannot be written inside either vault root.
- [ ] Linker outputs cannot overwrite promoted public generated JSON.
- [ ] `phase3:export:candidate` and `phase3:promote` remain separate review steps.
- [ ] `npm run build` remains independent of live vault paths.

## Self-Review

- Spec coverage: the plan covers proposal generation, report output, metadata
  candidate output, no silent writes, separate command/workflow, and final
  verification.
- Red-flag scan: clean; every task has concrete files, commands, and expected outcomes.
- Type consistency: `MetadataCandidateStatus`, `LinkProposal`, and
  `CrossVaultLinkerReport` are defined before use and reused across tasks.
