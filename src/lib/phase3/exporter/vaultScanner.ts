import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, parse, relative } from 'node:path';
import { parseDocument } from 'yaml';
import { siteReferenceSchema } from '../contracts';
import type { ExportManifest, SiteReference } from '../contracts';

type Phase3Warning = ExportManifest['warnings'][number];
type Frontmatter = Record<string, unknown>;

export interface TwoLensesEndpointMetadata {
  note?: string;
  path?: string;
  sourceId?: string;
  site?: SiteReference;
}

export interface TwoLensesMetadata {
  id?: string;
  title?: string;
  status?: 'confirmed' | 'draft';
  mathematical?: string | TwoLensesEndpointMetadata;
  political?: string | TwoLensesEndpointMetadata;
  websitePath?: string;
  rationale?: string;
  concepts: string[];
}

export interface ScannedVaultNote {
  sourceId: string;
  relativePath: string;
  title: string;
  frontmatter: Frontmatter;
  citekeys: string[];
  siteReference?: SiteReference;
  twoLenses?: TwoLensesMetadata;
}

export interface ScanVaultOptions {
  root: string;
  sourceId: string;
}

export interface ScanVaultResult {
  sourceId: string;
  root: string;
  notes: ScannedVaultNote[];
  warnings: Phase3Warning[];
}

const skippedDirectories = new Set(['.git', '.obsidian', '.trash', 'node_modules']);

function warning(code: string, message: string, sourceId: string): Phase3Warning {
  return { code, message, sourceId };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function relativeSourcePath(root: string, path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}

function markdownFiles(root: string): string[] {
  const files: string[] = [];

  function visit(directory: string): void {
    const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(basename(path))) {
          visit(path);
        }
        continue;
      }

      if (entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name))) {
        files.push(path);
      }
    }
  }

  visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

function splitFrontmatter(text: string): { frontmatter: string | null; body: string } {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) {
    return { frontmatter: null, body: text };
  }

  return {
    frontmatter: match[1] ?? '',
    body: text.slice(match[0].length),
  };
}

function parseFrontmatter(
  text: string | null,
  sourceId: string,
  warnings: Phase3Warning[],
): Frontmatter {
  if (text === null) {
    return {};
  }

  try {
    const document = parseDocument(text);
    if (document.errors.length > 0) {
      warnings.push(
        warning(
          'frontmatter-parse-error',
          `Could not parse markdown frontmatter: ${document.errors
            .map((error) => error.message)
            .join('; ')}`,
          sourceId,
        ),
      );
      return {};
    }

    const parsed = document.toJSON();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Frontmatter;
    }
  } catch (error) {
    warnings.push(
      warning(
        'frontmatter-parse-error',
        `Could not parse markdown frontmatter: ${errorMessage(error)}`,
        sourceId,
      ),
    );
  }

  return {};
}

function titleFrom(frontmatter: Frontmatter, body: string, filePath: string): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  const heading = /^#\s+(.+)$/m.exec(body);
  if (heading?.[1]?.trim()) {
    return heading[1].trim();
  }

  return parse(filePath).name;
}

function stringsFrom(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  }

  return [];
}

function normalizeCitekey(value: string): string {
  return value.trim().replace(/^@/, '').replace(/[.,;!?]+$/, '');
}

function addBodyCitekey(citekeys: Set<string>, value: string | undefined): void {
  if (value) {
    citekeys.add(normalizeCitekey(value));
  }
}

function collectCitekeys(frontmatter: Frontmatter, body: string): string[] {
  const citekeys = new Set<string>();
  for (const key of ['citekey', 'citekeys', 'zoteroKeys', 'zotero-keys']) {
    for (const value of stringsFrom(frontmatter[key])) {
      citekeys.add(normalizeCitekey(value));
    }
  }

  for (const bracket of body.matchAll(/\[([^\]\n]*@[^\]\n]*)\]/g)) {
    const citationText = bracket[1] ?? '';
    for (const match of citationText.matchAll(/@([A-Za-z0-9][A-Za-z0-9:_./-]*)/g)) {
      addBodyCitekey(citekeys, match[1]);
    }
  }

  for (const match of body.matchAll(/(^|[\s([{"'])@([A-Za-z0-9][A-Za-z0-9:_./-]*\d[A-Za-z0-9:_./-]*)/g)) {
    addBodyCitekey(citekeys, match[2]);
  }

  return [...citekeys].sort((left, right) => left.localeCompare(right));
}

function parseSiteReference(value: unknown): SiteReference | null {
  const result = siteReferenceSchema.safeParse(value);
  return result.success ? result.data : null;
}

function objectFrom(value: unknown): Frontmatter | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Frontmatter;
  }

  return null;
}

function parseEndpoint(value: unknown): string | TwoLensesEndpointMetadata | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const metadata = objectFrom(value);
  if (!metadata) {
    return null;
  }

  const note = stringsFrom(metadata.note)[0];
  const path =
    stringsFrom(metadata.path)[0] ??
    stringsFrom(metadata.sourcePath)[0] ??
    stringsFrom(metadata.relativePath)[0];
  const sourceId = stringsFrom(metadata.sourceId)[0];
  const site = parseSiteReference(metadata.site);

  if (!note && !path && !sourceId && !site) {
    return null;
  }

  return {
    ...(note ? { note } : {}),
    ...(path ? { path } : {}),
    ...(sourceId ? { sourceId } : {}),
    ...(site ? { site } : {}),
  };
}

function parseTwoLenses(frontmatter: Frontmatter): TwoLensesMetadata | null {
  const value = frontmatter['two-lenses'] ?? frontmatter.twoLenses;
  const metadata = objectFrom(value);
  if (!metadata) {
    return null;
  }

  const id = stringsFrom(metadata.id)[0];
  const title = stringsFrom(metadata.title)[0];
  const status = stringsFrom(metadata.status)[0];
  const mathematical = parseEndpoint(metadata.mathematical);
  const political = parseEndpoint(metadata.political);
  const rationale = stringsFrom(metadata.rationale)[0];
  const websitePath =
    stringsFrom(metadata['website-path'])[0] ?? stringsFrom(metadata.websitePath)[0];
  const concepts = stringsFrom(metadata.concepts);

  return {
    ...(id ? { id } : {}),
    ...(title ? { title } : {}),
    ...(status === 'confirmed' || status === 'draft' ? { status } : {}),
    ...(mathematical ? { mathematical } : {}),
    ...(political ? { political } : {}),
    ...(websitePath ? { websitePath } : {}),
    ...(rationale ? { rationale } : {}),
    concepts,
  };
}

export function scanVaultNotes(options: ScanVaultOptions): ScanVaultResult {
  const warnings: Phase3Warning[] = [];
  const notes = markdownFiles(options.root).map((filePath): ScannedVaultNote => {
    const text = readFileSync(filePath, 'utf-8');
    const { frontmatter: frontmatterText, body } = splitFrontmatter(text);
    const frontmatter = parseFrontmatter(frontmatterText, options.sourceId, warnings);
    const siteReference = parseSiteReference(frontmatter.site);
    const twoLenses = parseTwoLenses(frontmatter);

    return {
      sourceId: options.sourceId,
      relativePath: relativeSourcePath(options.root, filePath),
      title: titleFrom(frontmatter, body, filePath),
      frontmatter,
      citekeys: collectCitekeys(frontmatter, body),
      ...(siteReference ? { siteReference } : {}),
      ...(twoLenses ? { twoLenses } : {}),
    };
  });

  return {
    sourceId: options.sourceId,
    root: options.root,
    notes,
    warnings,
  };
}
