import type {
  CrossVaultLinkerOptions,
  CrossVaultLinkerReport,
  LinkConfidenceBand,
  LinkEvidence,
  LinkableNote,
  LinkProposal,
  MetadataCandidateStatus,
} from './contracts';
import { evidenceForPair, scoreEvidence } from './signals';
import type { ScanVaultResult, ScannedVaultNote } from '../exporter/vaultScanner';

export interface BuildCrossVaultLinkerReportOptions extends CrossVaultLinkerOptions {
  scans: ScanVaultResult[];
}

const tdaSourceId = 'tda-research';
const countingLivesSourceId = 'counting-lives';

function stableIdPart(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}

function isLinkableNote(note: ScannedVaultNote): note is LinkableNote {
  return Boolean(note.siteReference);
}

function notesForSource(scans: ScanVaultResult[], sourceId: string): LinkableNote[] {
  return scans
    .filter((scan) => scan.sourceId === sourceId)
    .flatMap((scan) => scan.notes)
    .filter((note) => note.sourceId === sourceId)
    .filter(isLinkableNote);
}

function bandForScore(score: number): LinkConfidenceBand {
  if (score >= 0.75) {
    return 'strong';
  }

  if (score >= 0.5) {
    return 'moderate';
  }

  return 'weak';
}

function evidencePhrase(item: LinkEvidence): string {
  if (item.kind === 'shared-citekey') {
    return `shared citation @${item.value}`;
  }

  if (item.kind === 'shared-concept') {
    return `shared concept "${item.value}"`;
  }

  if (item.kind === 'shared-token') {
    return `shared token "${item.value}"`;
  }

  return `shared title token "${item.value}"`;
}

function rationaleFrom(evidence: LinkEvidence[]): string {
  const phrases = evidence
    .filter((item) => item.kind !== 'title-token')
    .slice(0, 3)
    .map(evidencePhrase);
  const selected = phrases.length > 0 ? phrases : evidence.slice(0, 1).map(evidencePhrase);

  return `Candidate cross-vault link based on ${selected.join(', ')}.`;
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

function proposalId(tdaNote: LinkableNote, politicalNote: LinkableNote): string {
  return [
    'link',
    stableIdPart(tdaNote.siteReference.kind),
    stableIdPart(tdaNote.siteReference.id),
    stableIdPart(politicalNote.siteReference.kind),
    stableIdPart(politicalNote.siteReference.id),
  ].join('-');
}

function buildProposal(
  tdaNote: LinkableNote,
  politicalNote: LinkableNote,
  score: number,
  evidence: LinkEvidence[],
  candidateStatus: MetadataCandidateStatus,
): LinkProposal {
  const id = proposalId(tdaNote, politicalNote);
  const rationale = rationaleFrom(evidence);
  const concepts = conceptsFrom(evidence);

  return {
    id,
    score,
    band: bandForScore(score),
    mathematical: {
      sourceId: tdaSourceId,
      path: tdaNote.relativePath,
      title: tdaNote.title,
      site: tdaNote.siteReference,
    },
    political: {
      sourceId: countingLivesSourceId,
      path: politicalNote.relativePath,
      title: politicalNote.title,
      site: politicalNote.siteReference,
    },
    evidence,
    rationale,
    concepts,
    metadataCandidate: {
      id,
      title: `${tdaNote.title} and ${politicalNote.title}`,
      status: candidateStatus,
      mathematical: {
        sourceId: tdaSourceId,
        path: tdaNote.relativePath,
        site: tdaNote.siteReference,
      },
      political: {
        sourceId: countingLivesSourceId,
        path: politicalNote.relativePath,
        site: politicalNote.siteReference,
      },
      websitePath: `/writing/essays/two-lenses/${id}`,
      rationale,
      concepts,
    },
  };
}

export function buildCrossVaultLinkerReport(
  options: BuildCrossVaultLinkerReportOptions,
): CrossVaultLinkerReport {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const minScore = options.minScore ?? 0.5;
  const maxProposals = options.maxProposals ?? 50;
  const candidateStatus = options.candidateStatus ?? 'draft';
  const tdaNotes = notesForSource(options.scans, tdaSourceId);
  const countingLivesNotes = notesForSource(options.scans, countingLivesSourceId);
  const proposals: LinkProposal[] = [];
  let scoredPairs = 0;

  for (const tdaNote of tdaNotes) {
    for (const politicalNote of countingLivesNotes) {
      scoredPairs += 1;

      const evidence = evidenceForPair(tdaNote, politicalNote);
      const score = scoreEvidence(evidence);
      if (score === 0 || score < minScore) {
        continue;
      }

      proposals.push(buildProposal(tdaNote, politicalNote, score, evidence, candidateStatus));
    }
  }

  const sortedProposals = proposals
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, maxProposals);
  const bandCounts = sortedProposals.reduce(
    (counts, proposal) => {
      counts[proposal.band] += 1;
      return counts;
    },
    { strong: 0, moderate: 0, weak: 0 },
  );

  return {
    generatedAt,
    options: {
      minScore,
      maxProposals,
      candidateStatus,
    },
    summary: {
      tdaNotes: tdaNotes.length,
      countingLivesNotes: countingLivesNotes.length,
      scoredPairs,
      proposals: sortedProposals.length,
      strong: bandCounts.strong,
      moderate: bandCounts.moderate,
      weak: bandCounts.weak,
    },
    proposals: sortedProposals,
    warnings: options.scans.flatMap((scan) => scan.warnings),
  };
}
