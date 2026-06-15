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
  options: Required<
    Pick<CrossVaultLinkerOptions, 'minScore' | 'maxProposals' | 'candidateStatus'>
  >;
  summary: CrossVaultLinkerSummary;
  proposals: LinkProposal[];
  warnings: Array<{ code: string; message: string; sourceId?: string }>;
}

export interface LinkableNote extends ScannedVaultNote {
  siteReference: SiteReference;
}
