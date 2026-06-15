import type { LinkProposal } from './contracts';
import type { SiteReference } from '../contracts';

export interface RenderMetadataCandidatesOptions {
  generatedAt?: string;
}

function quoted(value: string): string {
  return JSON.stringify(value);
}

function renderSiteReference(site: SiteReference, indent: string): string[] {
  const lines = [
    `${indent}kind: ${quoted(site.kind)}`,
    `${indent}id: ${quoted(site.id)}`,
    `${indent}status: ${quoted(site.status)}`,
    `${indent}label: ${quoted(site.label)}`,
    `${indent}title: ${quoted(site.title)}`,
  ];

  if (site.slug) {
    lines.push(`${indent}slug: ${quoted(site.slug)}`);
  }

  if (site.href) {
    lines.push(`${indent}href: ${quoted(site.href)}`);
  }

  return lines;
}

function renderConcepts(concepts: string[]): string[] {
  if (concepts.length === 0) {
    return ['  concepts: []'];
  }

  return ['  concepts:', ...concepts.map((concept) => `    - ${quoted(concept)}`)];
}

function renderProposal(proposal: LinkProposal): string[] {
  const candidate = proposal.metadataCandidate;
  const lines = [
    `## ${proposal.id}`,
    '',
    `- proposalId: ${proposal.id}`,
    `- score: ${proposal.score}`,
    `- band: ${proposal.band}`,
    `- mathematical source/path: ${proposal.mathematical.sourceId} / ${proposal.mathematical.path}`,
    `- political source/path: ${proposal.political.sourceId} / ${proposal.political.path}`,
    '',
    '```yaml',
    'two-lenses:',
    `  id: ${quoted(candidate.id)}`,
    `  title: ${quoted(candidate.title)}`,
    `  status: ${quoted(candidate.status)}`,
    '  mathematical:',
    `    sourceId: ${quoted(candidate.mathematical.sourceId)}`,
    `    path: ${quoted(candidate.mathematical.path)}`,
  ];

  if (candidate.mathematical.site) {
    lines.push('    site:', ...renderSiteReference(candidate.mathematical.site, '      '));
  }

  lines.push(
    '  political:',
    `    sourceId: ${quoted(candidate.political.sourceId)}`,
    `    path: ${quoted(candidate.political.path)}`,
  );

  if (candidate.political.site) {
    lines.push('    site:', ...renderSiteReference(candidate.political.site, '      '));
  }

  lines.push(
    `  websitePath: ${quoted(candidate.websitePath)}`,
    `  rationale: ${quoted(candidate.rationale)}`,
    ...renderConcepts(candidate.concepts),
    '```',
  );

  return lines;
}

export function renderMetadataCandidatesMarkdown(
  proposals: LinkProposal[],
  options: RenderMetadataCandidatesOptions = {},
): string {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const lines = [
    '# Cross-Vault Linker Metadata Candidates',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Do not paste these blocks without human review.',
    'These suggestions are report-only and were not written to either vault.',
    '',
    ...proposals.flatMap((proposal, index) => [
      ...(index === 0 ? [] : ['']),
      ...renderProposal(proposal),
    ]),
  ];

  return `${lines.join('\n')}\n`;
}
