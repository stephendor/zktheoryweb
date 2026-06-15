import { existsSync, lstatSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import type { ExportManifest } from '../contracts';

type SourceType = ExportManifest['sources'][number]['sourceType'];
type ManifestWarning = ExportManifest['warnings'][number];

export interface VaultSourceConfig {
  sourceId: string;
  sourceType: SourceType;
  label: string;
  root: string;
  vaultMapRelativePath?: string;
}

export interface SourceInventoryDeps {
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
  isSymbolicLink(path: string): boolean;
  realpath(path: string): string;
  countMarkdownFiles(path: string, sourceId: string): number | MarkdownCountResult;
}

export interface MarkdownCountResult {
  count: number;
  warnings: ManifestWarning[];
}

export interface SourceInventoryEntry {
  sourceId: string;
  sourceType: SourceType;
  label: string;
  localPath: string;
  realPath: string | null;
  realPathDiffers: boolean;
  linkKind: 'none' | 'symbolic-link' | 'junction-or-reparse-point';
  available: boolean;
  vaultMapPath: string;
  vaultMapFound: boolean;
  markdownFiles: number;
  warnings: ManifestWarning[];
}

export interface SourceInventoryReport {
  generatedAt: string;
  sources: SourceInventoryEntry[];
  warnings: ManifestWarning[];
}

function warning(
  code: string,
  message: string,
  sourceId: string,
): ManifestWarning {
  return { code, message, sourceId };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function defaultIsSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function countMarkdownFiles(root: string, sourceId: string): MarkdownCountResult {
  let count = 0;
  const warnings: ManifestWarning[] = [];

  function visit(directory: string): void {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      warnings.push(
        warning(
          'markdown-directory-unreadable',
          `Could not read markdown directory ${directory}: ${errorMessage(error)}`,
          sourceId,
        ),
      );
      return;
    }

    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', '.obsidian', '.trash', 'node_modules'].includes(entry.name)) {
          visit(path);
        }
        continue;
      }

      if (entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name))) {
        count += 1;
      }
    }
  }

  visit(root);
  return { count, warnings };
}

const defaultDeps: SourceInventoryDeps = {
  exists: existsSync,
  isDirectory: defaultIsDirectory,
  isSymbolicLink: defaultIsSymbolicLink,
  realpath: (path) => realpathSync.native(path),
  countMarkdownFiles,
};

function samePath(left: string, right: string): boolean {
  return left.replaceAll('\\', '/').toLowerCase() === right.replaceAll('\\', '/').toLowerCase();
}

function markdownCountFromResult(result: number | MarkdownCountResult): number {
  return typeof result === 'number' ? result : result.count;
}

export function inspectVaultSource(
  config: VaultSourceConfig,
  deps: SourceInventoryDeps = defaultDeps,
): SourceInventoryEntry {
  const vaultMapRelativePath = config.vaultMapRelativePath ?? 'VAULT-MAP.md';
  const vaultMapPath = join(config.root, vaultMapRelativePath);
  const warnings: ManifestWarning[] = [];

  if (!deps.exists(config.root) || !deps.isDirectory(config.root)) {
    warnings.push(
      warning(
        'source-root-missing',
        `Source root does not exist or is not a directory: ${config.root}`,
        config.sourceId,
      ),
    );
    return {
      sourceId: config.sourceId,
      sourceType: config.sourceType,
      label: config.label,
      localPath: config.root,
      realPath: null,
      realPathDiffers: false,
      linkKind: 'none',
      available: false,
      vaultMapPath,
      vaultMapFound: false,
      markdownFiles: 0,
      warnings,
    };
  }

  const realPath = deps.realpath(config.root);
  const realPathDiffers = !samePath(config.root, realPath);
  const isSymbolicLink = deps.isSymbolicLink(config.root);
  const linkKind = isSymbolicLink
    ? 'symbolic-link'
    : realPathDiffers
      ? 'junction-or-reparse-point'
      : 'none';
  const vaultMapFound = deps.exists(vaultMapPath);

  if (!vaultMapFound) {
    warnings.push(
      warning(
        'vault-map-missing',
        `VAULT-MAP.md was not found at ${vaultMapPath}`,
        config.sourceId,
      ),
    );
  }

  let markdownFiles = 0;
  try {
    const markdownCountResult = deps.countMarkdownFiles(config.root, config.sourceId);
    markdownFiles = markdownCountFromResult(markdownCountResult);
    if (typeof markdownCountResult !== 'number') {
      warnings.push(...markdownCountResult.warnings);
    }
  } catch (error) {
    warnings.push(
      warning(
        'markdown-count-failed',
        `Could not count markdown files for ${config.root}: ${errorMessage(error)}`,
        config.sourceId,
      ),
    );
  }

  return {
    sourceId: config.sourceId,
    sourceType: config.sourceType,
    label: config.label,
    localPath: config.root,
    realPath,
    realPathDiffers,
    linkKind,
    available: true,
    vaultMapPath,
    vaultMapFound,
    markdownFiles,
    warnings,
  };
}

export function inspectVaultSources(
  configs: VaultSourceConfig[],
  deps: SourceInventoryDeps = defaultDeps,
  generatedAt = new Date().toISOString(),
): SourceInventoryReport {
  const sources = configs.map((config) => inspectVaultSource(config, deps));
  return {
    generatedAt,
    sources,
    warnings: sources.flatMap((source) => source.warnings),
  };
}

export function relativeSourcePath(root: string, path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}
