import { join } from 'node:path';
import {
  defaultInventoryReportPath,
  optionFromArgsOrEnv,
  parsePhase3Args,
  stringOption,
  writeJson,
} from './cli';
import {
  inspectVaultSources,
  type VaultSourceConfig,
} from '../../src/lib/phase3/exporter/sourceInventory';

function unavailablePath(name: string): string {
  return join(process.cwd(), '.phase3-unavailable', name);
}

const args = parsePhase3Args(process.argv.slice(2));
const tdaVault =
  optionFromArgsOrEnv(args, 'tda-vault', 'PHASE3_TDA_VAULT') ?? unavailablePath('tda-vault');
const countingLivesVault =
  optionFromArgsOrEnv(args, 'counting-lives-vault', 'PHASE3_COUNTING_LIVES_VAULT') ??
  unavailablePath('counting-lives-vault');
const reportPath = stringOption(args, 'report', defaultInventoryReportPath);

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
writeJson(reportPath, inventory);

const available = inventory.sources.filter((source) => source.available).length;
console.log(
  `Phase 3 source inventory: ${available}/${inventory.sources.length} sources available, ${inventory.warnings.length} warnings -> ${reportPath}`
);
