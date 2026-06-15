import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolve } from 'node:path';

export type ParsedPhase3Args = Record<string, string | boolean>;

export const defaultCandidatePath = join(
  process.cwd(),
  'src/data/generated/phase3/candidates/site-connections.candidate.json'
);
export const defaultFeedbackReportPath = join(
  process.cwd(),
  'reports/phase3/site-connections.feedback.json'
);
export const defaultInventoryReportPath = join(
  process.cwd(),
  'reports/phase3/source-inventory.json'
);
export const defaultLinkerReportPath = join(
  process.cwd(),
  'reports/phase3/cross-vault-linker.report.json'
);
export const defaultLinkerMetadataCandidatesPath = join(
  process.cwd(),
  'reports/phase3/cross-vault-linker.metadata-candidates.md'
);
export const defaultPromotedPath = join(
  process.cwd(),
  'src/data/generated/phase3/site-connections.json'
);

type Phase3Env = Record<string, string | undefined>;

export function parsePhase3Args(argv: string[]): ParsedPhase3Args {
  const args: ParsedPhase3Args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const equalsIndex = key.indexOf('=');
    if (equalsIndex >= 0) {
      args[key.slice(0, equalsIndex)] = key.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
      continue;
    }

    args[key] = true;
  }

  return args;
}

export function optionFromArgsOrEnv(
  args: ParsedPhase3Args,
  key: string,
  envKey: string,
  env: Phase3Env = process.env
): string | undefined {
  const argValue = args[key];
  if (argValue === true) {
    throw new Error(`Option --${key} requires a value.`);
  }

  if (typeof argValue === 'string') {
    const trimmed = argValue.trim();
    if (!trimmed) {
      throw new Error(`Option --${key} requires a value.`);
    }

    return trimmed;
  }

  const envValue = env[envKey];
  return envValue?.trim() || undefined;
}

export function requiredOption(
  args: ParsedPhase3Args,
  key: string,
  envKey: string,
  env: Phase3Env = process.env
): string {
  const value = optionFromArgsOrEnv(args, key, envKey, env);
  if (!value) {
    throw new Error(`Missing required option --${key} or environment variable ${envKey}.`);
  }

  return value;
}

export function stringOption(args: ParsedPhase3Args, key: string, fallback: string): string {
  const value = args[key];
  if (value === true) {
    throw new Error(`Option --${key} requires a value.`);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`Option --${key} requires a value.`);
    }

    return trimmed;
  }

  return fallback;
}

export function numberOption(
  args: ParsedPhase3Args,
  key: string,
  fallback: number
): number {
  const rawValue = stringOption(args, key, String(fallback));
  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(`Option --${key} must be a finite number.`);
  }

  return value;
}

export interface NumberOptionBounds {
  min?: number;
  max?: number;
}

export function boundedNumberOption(
  args: ParsedPhase3Args,
  key: string,
  fallback: number,
  bounds: NumberOptionBounds
): number {
  const value = numberOption(args, key, fallback);

  if (bounds.min !== undefined && value < bounds.min) {
    throw new Error(`Option --${key} must be greater than or equal to ${bounds.min}.`);
  }

  if (bounds.max !== undefined && value > bounds.max) {
    throw new Error(`Option --${key} must be less than or equal to ${bounds.max}.`);
  }

  return value;
}

function normalizedAbsolutePath(path: string): string {
  return resolve(path).replaceAll('\\', '/').toLowerCase();
}

function isSameOrInside(path: string, root: string): boolean {
  const normalizedPath = normalizedAbsolutePath(path);
  const normalizedRoot = normalizedAbsolutePath(root);

  return (
    normalizedPath === normalizedRoot ||
    normalizedPath.startsWith(`${normalizedRoot.replace(/\/+$/, '')}/`)
  );
}

function realpathIfExists(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return realpathSync.native(path);
  } catch {
    return null;
  }
}

function projectedRealOutputPath(path: string): string | null {
  let current = resolve(path);
  const missingSegments: string[] = [];

  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }

    missingSegments.unshift(basename(current));
    current = parent;
  }

  const realAncestor = realpathIfExists(current);
  if (!realAncestor) {
    return null;
  }

  return missingSegments.length > 0 ? join(realAncestor, ...missingSegments) : realAncestor;
}

export function assertNotPromotedOutputPath(
  outputPath: string,
  promotedPath = defaultPromotedPath
): void {
  if (normalizedAbsolutePath(outputPath) === normalizedAbsolutePath(promotedPath)) {
    throw new Error(
      `Refusing to write a Phase 3 candidate to the promoted public JSON path: ${promotedPath}. Use npm run phase3:promote after reviewing a candidate instead.`
    );
  }
}

export function assertOutsideSourceRoots(outputPath: string, roots: string[]): void {
  const outputPaths = [
    outputPath,
    projectedRealOutputPath(outputPath),
  ].filter((path): path is string => Boolean(path));

  for (const root of roots) {
    const trimmedRoot = root.trim();
    if (!trimmedRoot) {
      continue;
    }

    const rootPaths = [
      trimmedRoot,
      realpathIfExists(trimmedRoot),
    ].filter((path): path is string => Boolean(path));

    for (const candidateOutputPath of outputPaths) {
      if (rootPaths.some((rootPath) => isSameOrInside(candidateOutputPath, rootPath))) {
        throw new Error(
          `Refusing to write Phase 3 linker output inside a source root: ${outputPath}`
        );
      }
    }
  }
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
