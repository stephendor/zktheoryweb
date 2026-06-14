import type {
  DerivedConnection,
  ExportManifest,
  Phase3Export,
  SiteReference,
  TwoLensesLink,
} from '../contracts';
import type { SourceInventoryReport } from './sourceInventory';
import type {
  ScannedVaultNote,
  ScanVaultResult,
  TwoLensesEndpointMetadata,
  TwoLensesMetadata,
} from './vaultScanner';

type Phase3Warning = ExportManifest['warnings'][number];

export interface BuildPhase3CandidateOptions {
  inventory: SourceInventoryReport;
  scans: ScanVaultResult[];
  generatedAt?: string;
}

interface ResolvedEndpoint {
  site: SiteReference;
  note?: ScannedVaultNote;
}

interface NoteWithTwoLenses extends ScannedVaultNote {
  twoLenses: TwoLensesMetadata;
}

const exporter = {
  name: 'phase3-source-to-site-exporter',
  version: '1.0.0',
} as const;

function warning(
  code: string,
  message: string,
  sourceId?: string,
): Phase3Warning {
  return {
    code,
    message,
    ...(sourceId ? { sourceId } : {}),
  };
}

function normalizedPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\/+/, '').toLowerCase();
}

function stableIdPart(value: string): string {
  const slug = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}

function warningKey(entry: Phase3Warning): string {
  return `${entry.sourceId ?? ''}\u0000${entry.code}\u0000${entry.message}`;
}

function uniqueWarnings(warnings: Phase3Warning[]): Phase3Warning[] {
  const seen = new Set<string>();
  return warnings.filter((entry) => {
    const key = warningKey(entry);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function noteRef(note: ScannedVaultNote): TwoLensesLink['sourceNoteRefs'][number] {
  return {
    sourceId: note.sourceId,
    path: note.relativePath,
    title: note.title,
  };
}

function sourceMatches(note: ScannedVaultNote, sourceId: string | undefined): boolean {
  return !sourceId || note.sourceId === sourceId;
}

function resolveNoteByPath(
  notes: ScannedVaultNote[],
  path: string,
  sourceId?: string,
): ScannedVaultNote | undefined {
  const normalized = normalizedPath(path);
  return notes.find(
    (note) =>
      sourceMatches(note, sourceId) && normalizedPath(note.relativePath) === normalized,
  );
}

function resolveNoteByTitleOrPath(
  notes: ScannedVaultNote[],
  value: string,
  sourceId?: string,
): ScannedVaultNote | undefined {
  return (
    resolveNoteByPath(notes, value, sourceId) ??
    notes.find(
      (note) =>
        sourceMatches(note, sourceId) &&
        note.title.trim().toLowerCase() === value.trim().toLowerCase(),
    )
  );
}

function hasTwoLenses(note: ScannedVaultNote): note is NoteWithTwoLenses {
  return Boolean(note.twoLenses);
}

function resolveEndpoint(
  endpoint: string | TwoLensesEndpointMetadata | undefined,
  notes: ScannedVaultNote[],
): ResolvedEndpoint | null {
  if (!endpoint) {
    return null;
  }

  if (typeof endpoint === 'string') {
    const note = resolveNoteByPath(notes, endpoint);
    return note?.siteReference ? { site: note.siteReference, note } : null;
  }

  if (endpoint.site) {
    const notePath = endpoint.path ?? endpoint.note;
    const note = notePath
      ? resolveNoteByTitleOrPath(notes, notePath, endpoint.sourceId)
      : undefined;

    return {
      site: endpoint.site,
      ...(note ? { note } : {}),
    };
  }

  const notePath = endpoint.path ?? endpoint.note;
  if (!notePath) {
    return null;
  }

  const note = resolveNoteByTitleOrPath(notes, notePath, endpoint.sourceId);
  return note?.siteReference ? { site: note.siteReference, note } : null;
}

function requiredText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildTwoLensesLink(
  sourceNote: ScannedVaultNote,
  metadata: TwoLensesMetadata,
  notes: ScannedVaultNote[],
  warnings: Phase3Warning[],
): TwoLensesLink | null {
  const mathematical = resolveEndpoint(metadata.mathematical, notes);
  const political = resolveEndpoint(metadata.political, notes);
  const { id, title, status, websitePath, rationale } = metadata;
  const isComplete =
    requiredText(id) &&
    requiredText(title) &&
    status !== undefined &&
    mathematical !== null &&
    political !== null &&
    requiredText(websitePath) &&
    requiredText(rationale);

  if (!isComplete) {
    warnings.push(
      warning(
        'two-lenses-metadata-incomplete',
        `Two Lenses metadata is incomplete for ${sourceNote.relativePath}.`,
        sourceNote.sourceId,
      ),
    );
    return null;
  }

  const endpointNotes = [mathematical.note, political.note].filter(
    (note): note is ScannedVaultNote => Boolean(note),
  );
  const sourceNoteRefsByKey = new Map(
    endpointNotes.map((note) => [`${note.sourceId}/${note.relativePath}`, noteRef(note)]),
  );
  const sourceNoteRefs = [...sourceNoteRefsByKey.values()]
    .sort((left, right) =>
      `${left.sourceId}/${left.path}`.localeCompare(`${right.sourceId}/${right.path}`),
    );
  const zoteroKeys = [
    ...new Set(endpointNotes.flatMap((note) => note.citekeys)),
  ].sort((left, right) => left.localeCompare(right));

  return {
    id,
    title,
    status,
    mathematical: mathematical.site,
    political: political.site,
    rationale,
    websitePath,
    concepts: [...metadata.concepts].sort((left, right) => left.localeCompare(right)),
    sourceNoteRefs,
    zoteroKeys,
  };
}

function buildSharedCitationConnections(
  scans: ScanVaultResult[],
): DerivedConnection[] {
  const tdaNotes = scans
    .filter((scan) => scan.sourceId === 'tda-research')
    .flatMap((scan) => scan.notes)
    .filter((note) => note.siteReference);
  const countingLivesNotes = scans
    .filter((scan) => scan.sourceId === 'counting-lives')
    .flatMap((scan) => scan.notes)
    .filter((note) => note.siteReference);
  const connections = new Map<string, DerivedConnection>();

  for (const tdaNote of tdaNotes) {
    const tdaCitekeys = new Set(tdaNote.citekeys);
    for (const countingLivesNote of countingLivesNotes) {
      const sharedCitekeys = countingLivesNote.citekeys
        .filter((citekey) => tdaCitekeys.has(citekey))
        .sort((left, right) => left.localeCompare(right));

      const citekey = sharedCitekeys[0];
      if (!citekey || !tdaNote.siteReference || !countingLivesNote.siteReference) {
        continue;
      }

      const id = [
        'shared-citation',
        stableIdPart(tdaNote.siteReference.kind),
        stableIdPart(tdaNote.siteReference.id),
        stableIdPart(countingLivesNote.siteReference.kind),
        stableIdPart(countingLivesNote.siteReference.id),
        stableIdPart(citekey),
      ].join('-');

      if (!connections.has(id)) {
        connections.set(id, {
          id,
          source: tdaNote.siteReference,
          target: countingLivesNote.siteReference,
          connectionType: 'shared-citation',
          confidence: 'proposed',
          rationale: `Both notes cite @${citekey}.`,
          origin: 'cross-vault-linker',
        });
      }
    }
  }

  return [...connections.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function buildPhase3Candidate(
  options: BuildPhase3CandidateOptions,
): Phase3Export {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const scansBySourceId = new Map(
    options.scans.map((scan) => [scan.sourceId, scan] as const),
  );
  const notes = options.scans
    .flatMap((scan) => scan.notes)
    .sort((left, right) =>
      `${left.sourceId}/${left.relativePath}`.localeCompare(
        `${right.sourceId}/${right.relativePath}`,
      ),
    );
  const builderWarnings: Phase3Warning[] = [];
  const twoLenses = notes
    .filter(hasTwoLenses)
    .map((note) => buildTwoLensesLink(note, note.twoLenses, notes, builderWarnings))
    .filter((link): link is TwoLensesLink => Boolean(link))
    .sort((left, right) => left.id.localeCompare(right.id));

  if (!twoLenses.some((link) => link.status === 'confirmed')) {
    builderWarnings.push(
      warning('no-confirmed-two-lenses', 'No confirmed Two Lenses metadata was found.'),
    );
  }

  const manifest: ExportManifest = {
    schemaVersion: '1.0.0',
    generatedAt,
    exporter,
    sources: options.inventory.sources.map((source) => ({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      label: source.label,
      localPath: source.localPath,
      vaultMapPath: source.vaultMapPath,
      lastIndexedAt: scansBySourceId.has(source.sourceId) ? generatedAt : undefined,
    })),
    warnings: uniqueWarnings([
      ...options.inventory.warnings,
      ...options.inventory.sources.flatMap((source) => source.warnings),
      ...options.scans.flatMap((scan) => scan.warnings),
      ...builderWarnings,
    ]),
  };

  return {
    manifest,
    twoLenses,
    derivedConnections: buildSharedCitationConnections(options.scans),
    learningPaths: [],
  };
}
