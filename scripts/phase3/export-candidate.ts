import {
  defaultCandidatePath,
  defaultFeedbackReportPath,
  parsePhase3Args,
  requiredOption,
  stringOption,
  writeJson,
} from './cli';
import {
  inspectVaultSources,
  type VaultSourceConfig,
} from '../../src/lib/phase3/exporter/sourceInventory';
import { scanVaultNotes } from '../../src/lib/phase3/exporter/vaultScanner';
import { buildPhase3Candidate } from '../../src/lib/phase3/exporter/candidateBuilder';
import { createRouteFeedback } from '../../src/lib/phase3/exporter/routeFeedback';
import { buildSiteRouteRegistryFromWorkspace } from '../../src/lib/phase3/siteRouteRegistry';

const args = parsePhase3Args(process.argv.slice(2));
const tdaVault = requiredOption(args, 'tda-vault', 'PHASE3_TDA_VAULT');
const countingLivesVault = requiredOption(
  args,
  'counting-lives-vault',
  'PHASE3_COUNTING_LIVES_VAULT'
);
const candidatePath = stringOption(args, 'out', defaultCandidatePath);
const feedbackReportPath = stringOption(args, 'report', defaultFeedbackReportPath);

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
const scans = sources.map((source) =>
  scanVaultNotes({ root: source.root, sourceId: source.sourceId })
);
const candidate = buildPhase3Candidate({ inventory, scans });
const feedback = createRouteFeedback(candidate, buildSiteRouteRegistryFromWorkspace(process.cwd()));

writeJson(candidatePath, candidate);
writeJson(feedbackReportPath, feedback);

console.log(
  `Phase 3 candidate export: ${candidate.twoLenses.length} two-lenses, ${candidate.derivedConnections.length} derived connections, ${candidate.manifest.warnings.length} warnings -> ${candidatePath}`
);
console.log(
  `Phase 3 route feedback: ok=${feedback.ok}, errors=${feedback.summary.errors}, warnings=${feedback.summary.warnings} -> ${feedbackReportPath}`
);
