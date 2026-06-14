import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

function normalizedAbsolutePath(path: string): string {
  return resolve(path).replaceAll('\\', '/').toLowerCase();
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

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
