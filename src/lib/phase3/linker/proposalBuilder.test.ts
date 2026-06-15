import { describe, expect, it } from 'vitest';
import { buildCrossVaultLinkerReport } from './proposalBuilder';
import type { SiteReference } from '../contracts';
import type { ScanVaultResult, ScannedVaultNote } from '../exporter/vaultScanner';

const generatedAt = '2026-06-15T00:00:00.000Z';

function siteReference(fields: Partial<SiteReference>): SiteReference {
  return {
    kind: 'method',
    id: 'persistent-homology',
    status: 'resolved',
    label: 'Method',
    title: 'Persistent Homology',
    ...fields,
  } as SiteReference;
}

function note(fields: Partial<ScannedVaultNote>): ScannedVaultNote {
  return {
    sourceId: 'tda-research',
    relativePath: 'notes/default.md',
    title: 'Default Note',
    frontmatter: {},
    citekeys: [],
    siteReference: siteReference({}),
    ...fields,
  };
}

function scan(
  sourceId: string,
  notes: ScannedVaultNote[],
  warnings: ScanVaultResult['warnings'] = [],
): ScanVaultResult {
  return {
    sourceId,
    root: `C:/${sourceId}`,
    notes,
    warnings,
  };
}

describe('buildCrossVaultLinkerReport', () => {
  it('proposes cross-vault links with shared evidence', () => {
    const tda = note({
      sourceId: 'tda-research',
      relativePath: '04-Methods/Persistent-Homology.md',
      title: 'Persistent Homology',
      citekeys: ['sen1976'],
      frontmatter: { concepts: ['measurement'] },
      siteReference: siteReference({
        kind: 'method',
        id: 'persistent-homology',
        label: 'Method',
        title: 'Persistent Homology',
      }),
    });
    const political = note({
      sourceId: 'counting-lives',
      relativePath: '01 - Manuscript/Part IV/Ch17.md',
      title: 'Chapter 17',
      citekeys: ['@sen1976'],
      frontmatter: { concepts: ['measurement'] },
      siteReference: siteReference({
        kind: 'chapter',
        id: 'ch-17',
        label: 'Chapter 17',
        title: 'Chapter 17',
      }),
    });

    const report = buildCrossVaultLinkerReport({
      scans: [scan('tda-research', [tda]), scan('counting-lives', [political])],
      generatedAt,
      minScore: 0.5,
    });

    expect(report.summary).toMatchObject({
      tdaNotes: 1,
      countingLivesNotes: 1,
      scoredPairs: 1,
      proposals: 1,
      strong: 1,
      moderate: 0,
      weak: 0,
    });
    expect(report.proposals).toHaveLength(1);
    expect(report.proposals[0]).toMatchObject({
      id: 'link-method-persistent-homology-chapter-ch-17',
      band: 'strong',
      score: 0.8,
      rationale:
        'Candidate cross-vault link based on shared citation @sen1976, shared concept "measurement".',
      concepts: ['measurement'],
      metadataCandidate: {
        id: 'link-method-persistent-homology-chapter-ch-17',
        title: 'Persistent Homology and Chapter 17',
        status: 'draft',
        websitePath: '/writing/essays/two-lenses/link-method-persistent-homology-chapter-ch-17',
        rationale:
          'Candidate cross-vault link based on shared citation @sen1976, shared concept "measurement".',
        concepts: ['measurement'],
        mathematical: {
          sourceId: 'tda-research',
          path: '04-Methods/Persistent-Homology.md',
          site: tda.siteReference,
        },
        political: {
          sourceId: 'counting-lives',
          path: '01 - Manuscript/Part IV/Ch17.md',
          site: political.siteReference,
        },
      },
    });
  });

  it('filters pairs below minScore and still reports scoredPairs', () => {
    const report = buildCrossVaultLinkerReport({
      scans: [
        scan('tda-research', [
          note({
            title: 'Poverty Dynamics',
            frontmatter: {},
            citekeys: [],
          }),
        ]),
        scan('counting-lives', [
          note({
            sourceId: 'counting-lives',
            title: 'Poverty Lines',
            frontmatter: {},
            citekeys: [],
            siteReference: siteReference({ kind: 'chapter', id: 'poverty-lines' }),
          }),
        ]),
      ],
      generatedAt,
      minScore: 0.5,
    });

    expect(report.summary.scoredPairs).toBe(1);
    expect(report.summary.proposals).toBe(0);
    expect(report.proposals).toEqual([]);
  });

  it('honours maxProposals and explicit candidateStatus', () => {
    const sharedTda = {
      sourceId: 'tda-research',
      citekeys: ['sen1976'],
      frontmatter: { concepts: ['measurement'] },
    } satisfies Partial<ScannedVaultNote>;
    const sharedPolitical = {
      sourceId: 'counting-lives',
      citekeys: ['sen1976'],
      frontmatter: { concepts: ['measurement'] },
    } satisfies Partial<ScannedVaultNote>;

    const report = buildCrossVaultLinkerReport({
      scans: [
        scan('tda-research', [
          note({
            ...sharedTda,
            relativePath: 'methods/alpha.md',
            title: 'Alpha',
            siteReference: siteReference({ id: 'alpha' }),
          }),
          note({
            ...sharedTda,
            relativePath: 'methods/beta.md',
            title: 'Beta',
            siteReference: siteReference({ id: 'beta' }),
          }),
        ]),
        scan('counting-lives', [
          note({
            ...sharedPolitical,
            relativePath: 'chapters/ch-17.md',
            title: 'Chapter 17',
            siteReference: siteReference({ kind: 'chapter', id: 'ch-17' }),
          }),
        ]),
      ],
      generatedAt,
      candidateStatus: 'confirmed',
      maxProposals: 1,
    });

    expect(report.summary.scoredPairs).toBe(2);
    expect(report.summary.proposals).toBe(1);
    expect(report.proposals).toHaveLength(1);
    expect(report.proposals[0]?.id).toBe('link-method-alpha-chapter-ch-17');
    expect(report.proposals[0]?.metadataCandidate.status).toBe('confirmed');
  });

  it('does not propose notes without siteReference', () => {
    const tdaWithoutSite = note({
      citekeys: ['sen1976'],
      frontmatter: { concepts: ['measurement'] },
      siteReference: undefined,
    });
    const political = note({
      sourceId: 'counting-lives',
      citekeys: ['sen1976'],
      frontmatter: { concepts: ['measurement'] },
      siteReference: siteReference({ kind: 'chapter', id: 'ch-17' }),
    });

    const report = buildCrossVaultLinkerReport({
      scans: [scan('tda-research', [tdaWithoutSite]), scan('counting-lives', [political])],
      generatedAt,
    });

    expect(report.summary.tdaNotes).toBe(0);
    expect(report.summary.countingLivesNotes).toBe(1);
    expect(report.summary.scoredPairs).toBe(0);
    expect(report.proposals).toEqual([]);
  });

  it('includes scan warnings', () => {
    const warning = {
      code: 'frontmatter-parse-error',
      message: 'Could not parse frontmatter.',
      sourceId: 'tda-research',
    };

    const report = buildCrossVaultLinkerReport({
      scans: [scan('tda-research', [], [warning]), scan('counting-lives', [])],
      generatedAt,
    });

    expect(report.warnings).toEqual([warning]);
  });
});
