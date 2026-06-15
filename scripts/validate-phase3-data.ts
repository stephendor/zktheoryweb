import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import {
  readPhase3ExportFile,
  validatePhase3Export,
  type Phase3ValidationResult,
} from '../src/lib/phase3/loadGeneratedData';
import { buildSiteRouteRegistryFromWorkspace } from '../src/lib/phase3/siteRouteRegistry';

const workspaceRoot = process.cwd();

function jsonFilesInDirectory(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .map((name) => join(directory, name))
    .filter((path) => statSync(path).isFile())
    .filter((path) => extname(path) === '.json')
    .sort();
}

function validationFiles(): string[] {
  const generatedRoot = join(workspaceRoot, 'src/data/generated/phase3');
  const validFixtures = join(generatedRoot, 'fixtures/valid');

  return [
    ...jsonFilesInDirectory(generatedRoot),
    ...jsonFilesInDirectory(validFixtures),
  ];
}

function relativeDisplayPath(filePath: string): string {
  return relative(workspaceRoot, filePath).replaceAll('\\', '/');
}

function printResult(filePath: string, result: Phase3ValidationResult): void {
  const label = result.ok ? 'OK' : 'ERROR';
  console.log(`[phase3] ${label} ${relativeDisplayPath(filePath)}`);
  console.log(
    `[phase3] counts: twoLenses=${result.summary.twoLenses}, derivedConnections=${result.summary.derivedConnections}, learningPaths=${result.summary.learningPaths}, warnings=${result.summary.warnings}, errors=${result.summary.errors}`,
  );

  for (const entry of result.issues) {
    const location = entry.path ? ` at ${entry.path}` : '';
    console.log(
      `[phase3] ${entry.severity.toUpperCase()} ${entry.code}${location}: ${entry.message}`,
    );
  }
}

function main(): void {
  const files = validationFiles();
  if (files.length === 0) {
    console.log('[phase3] No generated Phase 3 JSON files found.');
    return;
  }

  const registry = buildSiteRouteRegistryFromWorkspace(workspaceRoot);
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const data = readPhase3ExportFile(file);
    const result = validatePhase3Export(data, { registry });
    printResult(file, result);
    totalErrors += result.summary.errors;
    totalWarnings += result.summary.warnings;
  }

  console.log(
    `[phase3] complete: files=${files.length}, warnings=${totalWarnings}, errors=${totalErrors}`,
  );

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}

main();
