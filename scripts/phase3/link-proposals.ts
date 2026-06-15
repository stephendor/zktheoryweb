import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  assertNotPromotedOutputPath,
  assertOutsideSourceRoots,
  boundedNumberOption,
  defaultLinkerMetadataCandidatesPath,
  defaultLinkerReportPath,
  numberOption,
  parsePhase3Args,
  requiredOption,
  stringOption,
  writeJson,
} from './cli';
import {
  inspectVaultSources,
  type VaultSourceConfig,
} from '../../src/lib/phase3/exporter/sourceInventory';
import { scanVaultNotes, type ScanVaultResult } from '../../src/lib/phase3/exporter/vaultScanner';
import { buildCrossVaultLinkerReport } from '../../src/lib/phase3/linker/proposalBuilder';
import { renderMetadataCandidatesMarkdown } from '../../src/lib/phase3/linker/metadataCandidates';
import type { MetadataCandidateStatus } from '../../src/lib/phase3/linker/contracts';

function maxProposalsOption(args: ReturnType<typeof parsePhase3Args>): number {
  const value = numberOption(args, 'max-proposals', 50);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Option --max-proposals must be an integer greater than or equal to 0.');
  }

  return value;
}

function candidateStatusOption(args: ReturnType<typeof parsePhase3Args>): MetadataCandidateStatus {
  const value = stringOption(args, 'candidate-status', 'draft');
  if (value !== 'draft' && value !== 'confirmed') {
    throw new Error('Option --candidate-status must be either draft or confirmed.');
  }

  return value;
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
  'PHASE3_COUNTING_LIVES_VAULT'
);
const reportPath = stringOption(args, 'report', defaultLinkerReportPath);
const metadataCandidatesPath = stringOption(
  args,
  'metadata-candidates',
  defaultLinkerMetadataCandidatesPath
);
const minScore = boundedNumberOption(args, 'min-score', 0.5, { min: 0, max: 1 });
const maxProposals = maxProposalsOption(args);
const candidateStatus = candidateStatusOption(args);

for (const outputPath of [reportPath, metadataCandidatesPath]) {
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
const scans: ScanVaultResult[] = inventory.sources.map((source) => {
  const scan = source.available
    ? scanVaultNotes({ root: source.localPath, sourceId: source.sourceId })
    : {
        sourceId: source.sourceId,
        root: source.localPath,
        notes: [],
        warnings: [],
      };

  return {
    ...scan,
    warnings: [...source.warnings, ...scan.warnings],
  };
});
const report = buildCrossVaultLinkerReport({
  scans,
  minScore,
  maxProposals,
  candidateStatus,
});
const metadataCandidates = renderMetadataCandidatesMarkdown(report.proposals, {
  generatedAt: report.generatedAt,
});

writeJson(reportPath, report);
writeText(metadataCandidatesPath, metadataCandidates);

console.log(
  `Phase 3 link proposals: ${report.summary.proposals} proposals, ${report.summary.strong} strong, ${report.summary.moderate} moderate, ${report.summary.weak} weak -> ${reportPath}`
);
console.log(`Phase 3 metadata candidates: ${metadataCandidatesPath}`);
