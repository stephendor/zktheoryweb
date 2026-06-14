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
  writeFileAtomically(
    options.destinationPath,
    `${JSON.stringify(promoted, null, 2)}\n`,
  );

  return promoted;
}
