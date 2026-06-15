import { readFileSync } from 'node:fs';
import type { ZodError } from 'zod';
import {
  phase3ExportSchema,
  type DerivedConnection,
  type Phase3Export,
  type SiteReference,
  type TwoLensesLink,
} from './contracts';
import { resolveSiteReference, type SiteRouteRegistry } from './resolveSiteReferences';

export type ValidationSeverity = 'error' | 'warning';

export interface Phase3ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
  id?: string;
}

export interface Phase3ValidationSummary {
  manifests: number;
  twoLenses: number;
  derivedConnections: number;
  learningPaths: number;
  pendingReferences: number;
  warnings: number;
  errors: number;
}

export interface Phase3ValidationResult {
  ok: boolean;
  data: Phase3Export | null;
  issues: Phase3ValidationIssue[];
  summary: Phase3ValidationSummary;
}

export interface Phase3ValidationOptions {
  registry?: SiteRouteRegistry;
}

interface ReferenceWithPath {
  reference: SiteReference;
  path: string;
}

function emptySummary(): Phase3ValidationSummary {
  return {
    manifests: 0,
    twoLenses: 0,
    derivedConnections: 0,
    learningPaths: 0,
    pendingReferences: 0,
    warnings: 0,
    errors: 0,
  };
}

function issue(
  severity: ValidationSeverity,
  code: string,
  message: string,
  options: Pick<Phase3ValidationIssue, 'path' | 'id'> = {}
): Phase3ValidationIssue {
  return {
    severity,
    code,
    message,
    ...options,
  };
}

function finalizeSummary(
  summary: Phase3ValidationSummary,
  issues: Phase3ValidationIssue[]
): Phase3ValidationSummary {
  return {
    ...summary,
    warnings: issues.filter((validationIssue) => validationIssue.severity === 'warning').length,
    errors: issues.filter((validationIssue) => validationIssue.severity === 'error').length,
  };
}

function pathSegment(segment: PropertyKey): string {
  return typeof segment === 'number' ? `[${segment}]` : String(segment);
}

function zodPath(path: PropertyKey[]): string | undefined {
  if (path.length === 0) {
    return undefined;
  }

  return path.map(pathSegment).join('.').replaceAll('.[', '[');
}

function zodIssues(error: ZodError): Phase3ValidationIssue[] {
  return error.issues.map((zodIssue) =>
    issue('error', 'schema-error', zodIssue.message, {
      path: zodPath(zodIssue.path),
    })
  );
}

function addDuplicateIdIssues<T extends Pick<TwoLensesLink | DerivedConnection, 'id'>>(
  records: T[],
  collectionName: 'twoLenses' | 'derivedConnections',
  issues: Phase3ValidationIssue[]
): void {
  const seenIds = new Map<string, number>();

  records.forEach((record, index) => {
    const firstIndex = seenIds.get(record.id);

    if (firstIndex !== undefined) {
      issues.push(
        issue(
          'error',
          'duplicate-id',
          `Duplicate ${collectionName} id "${record.id}" first appeared at ${collectionName}[${firstIndex}].id.`,
          {
            id: record.id,
            path: `${collectionName}[${index}].id`,
          }
        )
      );
      return;
    }

    seenIds.set(record.id, index);
  });
}

function collectReferences(data: Phase3Export): ReferenceWithPath[] {
  return [
    ...data.twoLenses.flatMap((link, index) => [
      {
        reference: link.mathematical,
        path: `twoLenses[${index}].mathematical`,
      },
      {
        reference: link.political,
        path: `twoLenses[${index}].political`,
      },
    ]),
    ...data.derivedConnections.flatMap((connection, index) => [
      {
        reference: connection.source,
        path: `derivedConnections[${index}].source`,
      },
      {
        reference: connection.target,
        path: `derivedConnections[${index}].target`,
      },
    ]),
  ];
}

function addReferenceIssues(
  references: ReferenceWithPath[],
  issues: Phase3ValidationIssue[],
  summary: Phase3ValidationSummary,
  registry?: SiteRouteRegistry
): void {
  references.forEach(({ reference, path }) => {
    if (reference.status === 'pending') {
      summary.pendingReferences += 1;
      issues.push(
        issue(
          'warning',
          'pending-reference',
          `Pending reference "${reference.id}" is not required to resolve yet.`,
          {
            id: reference.id,
            path,
          }
        )
      );
    }

    if (!registry) {
      return;
    }

    const resolution = resolveSiteReference(reference, registry);

    if (resolution.resolved) {
      return;
    }

    if (resolution.reason === 'invalid') {
      issues.push(
        issue(
          'error',
          'invalid-reference',
          `Reference "${reference.id}" has an invalid kind/status combination.`,
          {
            id: reference.id,
            path,
          }
        )
      );
      return;
    }

    if (resolution.reason === 'missing') {
      issues.push(
        issue(
          'error',
          'unresolved-reference',
          `Reference "${reference.id}" does not resolve to a known site route.`,
          {
            id: reference.id,
            path,
          }
        )
      );
    }
  });
}

export function validatePhase3Export(
  input: unknown,
  options: Phase3ValidationOptions = {}
): Phase3ValidationResult {
  const parsed = phase3ExportSchema.safeParse(input);

  if (!parsed.success) {
    const issues = zodIssues(parsed.error);
    return {
      ok: false,
      data: null,
      issues,
      summary: finalizeSummary(emptySummary(), issues),
    };
  }

  const data = parsed.data;
  const summary: Phase3ValidationSummary = {
    ...emptySummary(),
    manifests: 1,
    twoLenses: data.twoLenses.length,
    derivedConnections: data.derivedConnections.length,
    learningPaths: data.learningPaths.length,
  };
  const issues: Phase3ValidationIssue[] = [];

  addDuplicateIdIssues(data.twoLenses, 'twoLenses', issues);
  addDuplicateIdIssues(data.derivedConnections, 'derivedConnections', issues);
  addReferenceIssues(collectReferences(data), issues, summary, options.registry);

  const finalizedSummary = finalizeSummary(summary, issues);

  return {
    ok: finalizedSummary.errors === 0,
    data,
    issues,
    summary: finalizedSummary,
  };
}

export function readPhase3ExportFile(filePath: string): Phase3Export {
  return phase3ExportSchema.parse(JSON.parse(readFileSync(filePath, 'utf-8')) as unknown);
}
