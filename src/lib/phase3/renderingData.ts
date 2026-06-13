import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import type { ExportManifest, Phase3Export } from './contracts';
import {
  readPhase3ExportFile,
  validatePhase3Export,
  type Phase3ValidationIssue,
} from './loadGeneratedData';
import type { SiteRouteRegistry } from './resolveSiteReferences';

const defaultGeneratedRoot = join(process.cwd(), 'src/data/generated/phase3');
const emptyGeneratedAt = '1970-01-01T00:00:00.000Z';

export interface Phase3RenderingDataOptions {
  root?: string;
  registry?: SiteRouteRegistry;
}

function readerManifest(
  generatedAt: string,
  sources: ExportManifest['sources'] = [],
  warnings: ExportManifest['warnings'] = [],
): ExportManifest {
  return {
    schemaVersion: '1.0.0',
    generatedAt,
    exporter: {
      name: 'phase3-rendering-reader',
      version: '1.0.0',
    },
    sources,
    warnings,
  };
}

function emptyRenderingExport(): Phase3Export {
  return {
    manifest: readerManifest(emptyGeneratedAt),
    twoLenses: [],
    derivedConnections: [],
    learningPaths: [],
  };
}

function directJsonFiles(root: string): string[] {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => extname(entry.name) === '.json')
    .map((entry) => join(root, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function displayPath(filePath: string): string {
  return relative(process.cwd(), filePath).replaceAll('\\', '/');
}

function formatIssue(issue: Phase3ValidationIssue): string {
  const location = issue.path ? ` at ${issue.path}` : '';
  const id = issue.id ? ` (${issue.id})` : '';
  return `${issue.code}${location}${id}: ${issue.message}`;
}

function invalidDataError(filePath: string, details: string[]): Error {
  return new Error(
    [
      `Invalid Phase 3 generated data in ${displayPath(filePath)}.`,
      ...details.map((detail) => `- ${detail}`),
    ].join('\n'),
  );
}

function readValidExport(
  filePath: string,
  registry: SiteRouteRegistry | undefined,
): Phase3Export {
  let data: Phase3Export;

  try {
    data = readPhase3ExportFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw invalidDataError(filePath, [message]);
  }

  const validation = validatePhase3Export(data, { registry });
  const errors = validation.issues.filter((issue) => issue.severity === 'error');

  if (errors.length > 0) {
    throw invalidDataError(filePath, errors.map(formatIssue));
  }

  return validation.data ?? data;
}

export function loadPhase3RenderingData(
  options: Phase3RenderingDataOptions = {},
): Phase3Export {
  const root = options.root ?? defaultGeneratedRoot;
  const files = directJsonFiles(root);

  if (files.length === 0) {
    return emptyRenderingExport();
  }

  const exports = files.map((filePath) => readValidExport(filePath, options.registry));

  return {
    manifest: readerManifest(
      exports[0]?.manifest.generatedAt ?? emptyGeneratedAt,
      exports.flatMap((entry) => entry.manifest.sources),
      exports.flatMap((entry) => entry.manifest.warnings),
    ),
    twoLenses: exports.flatMap((entry) => entry.twoLenses),
    derivedConnections: exports.flatMap((entry) => entry.derivedConnections),
    learningPaths: exports.flatMap((entry) => entry.learningPaths),
  };
}
