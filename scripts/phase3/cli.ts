import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

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
  if (typeof argValue === 'string' && argValue.trim()) {
    return argValue.trim();
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
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
