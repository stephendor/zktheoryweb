import {
  existsSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import type { Phase3Export } from '../contracts';
import {
  readPhase3ExportFile,
  validatePhase3Export,
} from '../loadGeneratedData';
import type { SiteRouteRegistry } from '../resolveSiteReferences';

export interface PromotePhase3CandidateOptions {
  candidatePath: string;
  destinationPath: string;
  registry: SiteRouteRegistry;
  // Overwrite the promoted file even when the candidate drops entries it
  // currently holds. Off by default: a vault export cannot reproduce
  // hand-curated entries, so a silent overwrite loses them.
  allowDrop?: boolean;
}

export interface Phase3PromotionDrops {
  twoLenses: string[];
  derivedConnections: string[];
  learningPaths: string[];
  manualCurationSources: string[];
  unreadableDestination?: string;
}

function missingIds(current: string[], candidate: string[]): string[] {
  const candidateIds = new Set(candidate);
  return current.filter((id) => !candidateIds.has(id));
}

export function findPhase3PromotionDrops(
  current: Phase3Export,
  candidate: Phase3Export,
): Phase3PromotionDrops {
  const candidateSourceIds = candidate.manifest.sources.map(
    (source) => source.sourceId,
  );

  return {
    twoLenses: missingIds(
      current.twoLenses.map((link) => link.id),
      candidate.twoLenses.map((link) => link.id),
    ),
    derivedConnections: missingIds(
      current.derivedConnections.map((connection) => connection.id),
      candidate.derivedConnections.map((connection) => connection.id),
    ),
    learningPaths: missingIds(
      current.learningPaths.map((path) => path.pathSlug),
      candidate.learningPaths.map((path) => path.pathSlug),
    ),
    manualCurationSources: missingIds(
      current.manifest.sources
        .filter((source) => source.sourceType === 'manual-curation')
        .map((source) => source.sourceId),
      candidateSourceIds,
    ),
  };
}

function hasDrops(drops: Phase3PromotionDrops): boolean {
  return (
    drops.unreadableDestination !== undefined ||
    drops.twoLenses.length > 0 ||
    drops.derivedConnections.length > 0 ||
    drops.learningPaths.length > 0 ||
    drops.manualCurationSources.length > 0
  );
}

function dropErrorMessage(
  destinationPath: string,
  drops: Phase3PromotionDrops,
): string {
  const lines = [
    `Refusing to promote Phase 3 candidate: it would drop entries that ${destinationPath} currently holds.`,
  ];
  if (drops.unreadableDestination) {
    lines.push(
      `  current file is not a valid Phase 3 export: ${drops.unreadableDestination}`,
    );
  }
  const groups: [string, string[]][] = [
    ['twoLenses', drops.twoLenses],
    ['derivedConnections', drops.derivedConnections],
    ['learningPaths', drops.learningPaths],
    ['manual-curation sources', drops.manualCurationSources],
  ];
  for (const [label, ids] of groups) {
    if (ids.length > 0) {
      lines.push(`  ${label}: ${ids.join(', ')}`);
    }
  }
  lines.push(
    'Add the missing entries to the candidate, or pass --allow-drop to overwrite anyway.',
  );
  return lines.join('\n');
}

function currentPromotionDrops(
  destinationPath: string,
  candidate: Phase3Export,
): Phase3PromotionDrops | null {
  if (!existsSync(destinationPath)) {
    return null;
  }

  let current: Phase3Export;
  try {
    current = readPhase3ExportFile(destinationPath);
  } catch (error) {
    return {
      twoLenses: [],
      derivedConnections: [],
      learningPaths: [],
      manualCurationSources: [],
      unreadableDestination:
        error instanceof Error ? error.message.split('\n')[0] : String(error),
    };
  }

  return findPhase3PromotionDrops(current, candidate);
}

function promotionErrorMessage(
  issues: ReturnType<typeof validatePhase3Export>['issues'],
): string {
  return issues
    .filter((issue) => issue.severity === 'error')
    .map((issue) => {
      const location = issue.path ? ` at ${issue.path}` : '';
      return `${issue.code}${location}: ${issue.message}`;
    })
    .join('; ');
}

export function writeFileAtomically(destinationPath: string, contents: string): string {
  const destinationDir = dirname(destinationPath);
  const tempPath = join(
    destinationDir,
    `.${basename(destinationPath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  mkdirSync(destinationDir, { recursive: true });

  try {
    writeFileSync(tempPath, contents, 'utf-8');
    renameSync(tempPath, destinationPath);
  } catch (error) {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }

    throw error;
  }

  return tempPath;
}

export function promotePhase3Candidate(
  options: PromotePhase3CandidateOptions,
): Phase3Export {
  const candidate = readPhase3ExportFile(options.candidatePath);
  const validation = validatePhase3Export(candidate, {
    registry: options.registry,
  });

  if (validation.summary.errors > 0) {
    throw new Error(
      `Cannot promote Phase 3 candidate: ${promotionErrorMessage(validation.issues)}`,
    );
  }

  const promoted = validation.data ?? candidate;

  if (!options.allowDrop) {
    const drops = currentPromotionDrops(options.destinationPath, promoted);
    if (drops && hasDrops(drops)) {
      throw new Error(dropErrorMessage(options.destinationPath, drops));
    }
  }

  writeFileAtomically(
    options.destinationPath,
    `${JSON.stringify(promoted, null, 2)}\n`,
  );

  return promoted;
}
