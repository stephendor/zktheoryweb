import { describe, expect, it } from 'vitest';
import { renderMetadataCandidatesMarkdown } from './metadataCandidates';
import type { LinkProposal } from './contracts';
import type { SiteReference } from '../contracts';

const generatedAt = '2026-06-15T00:00:00.000Z';

function siteReference(fields: Partial<SiteReference> = {}): SiteReference {
  return {
    kind: 'method',
    id: 'persistent-homology',
    status: 'resolved',
    label: 'Method',
    title: 'Persistent Homology',
    ...fields,
  } as SiteReference;
}

function proposal(fields: Partial<LinkProposal> = {}): LinkProposal {
  const mathematicalSite = siteReference({
    slug: 'persistent-homology',
    href: '/methods/persistent-homology',
  });
  const politicalSite = siteReference({
    kind: 'chapter',
    id: 'ch-17',
    label: 'Chapter 17',
    title: 'Chapter 17',
  });

  return {
    id: 'link-method-persistent-homology-chapter-ch-17',
    score: 0.8,
    band: 'strong',
    mathematical: {
      sourceId: 'tda-research',
      path: '04-Methods/Persistent-Homology.md',
      title: 'Persistent Homology',
      site: mathematicalSite,
    },
    political: {
      sourceId: 'counting-lives',
      path: '01 - Manuscript/Part IV/Ch17.md',
      title: 'Chapter 17',
      site: politicalSite,
    },
    evidence: [{ kind: 'shared-concept', value: 'measurement', weight: 0.25 }],
    rationale: 'Candidate cross-vault link based on shared concept "measurement".',
    concepts: ['measurement'],
    metadataCandidate: {
      id: 'link-method-persistent-homology-chapter-ch-17',
      title: 'Persistent Homology and Chapter 17',
      status: 'draft',
      mathematical: {
        sourceId: 'tda-research',
        path: '04-Methods/Persistent-Homology.md',
        site: mathematicalSite,
      },
      political: {
        sourceId: 'counting-lives',
        path: '01 - Manuscript/Part IV/Ch17.md',
        site: politicalSite,
      },
      websitePath: '/writing/essays/two-lenses/link-method-persistent-homology-chapter-ch-17',
      rationale: 'Candidate cross-vault link based on shared concept "measurement".',
      concepts: ['measurement'],
    },
    ...fields,
  };
}

describe('renderMetadataCandidatesMarkdown', () => {
  it('renders warning text and a YAML-like two-lenses block for review', () => {
    const output = renderMetadataCandidatesMarkdown([proposal()], { generatedAt });

    expect(output).toContain('# Cross-Vault Linker Metadata Candidates');
    expect(output).toContain(`Generated: ${generatedAt}`);
    expect(output).toContain('Do not paste these blocks without human review.');
    expect(output).toContain('These suggestions are report-only and were not written to either vault.');
    expect(output).toContain('score: 0.8');
    expect(output).toContain('two-lenses:');
    expect(output).toContain('status: "draft"');
    expect(output).toContain('sourceId: "tda-research"');
    expect(output.endsWith('\n')).toBe(true);
  });

  it('renders confirmed status and optional site slug and href', () => {
    const output = renderMetadataCandidatesMarkdown(
      [
        proposal({
          metadataCandidate: {
            ...proposal().metadataCandidate,
            status: 'confirmed',
          },
        }),
      ],
      { generatedAt },
    );

    expect(output).toContain('status: "confirmed"');
    expect(output).toContain('slug: "persistent-homology"');
    expect(output).toContain('href: "/methods/persistent-homology"');
  });

  it('renders empty concepts as an inline empty YAML sequence', () => {
    const baseProposal = proposal();
    const output = renderMetadataCandidatesMarkdown(
      [
        proposal({
          concepts: [],
          metadataCandidate: {
            ...baseProposal.metadataCandidate,
            concepts: [],
          },
        }),
      ],
      { generatedAt },
    );

    expect(output).toContain('  concepts: []');
  });
});
