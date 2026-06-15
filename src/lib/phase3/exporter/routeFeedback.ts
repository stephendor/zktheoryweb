import type { Phase3Export, SiteReference } from '../contracts';
import {
  type Phase3ValidationIssue,
  validatePhase3Export,
} from '../loadGeneratedData';
import {
  resolveSiteReference,
  type ReferenceResolution,
  type SiteRouteRegistry,
} from '../resolveSiteReferences';

export interface RouteFeedbackReference {
  path: string;
  kind: SiteReference['kind'];
  id: string;
  status: SiteReference['status'];
  label: string;
  title: string;
  resolved: boolean;
  reason: ReferenceResolution['reason'];
}

export interface RouteFeedbackSummary {
  twoLenses: number;
  derivedConnections: number;
  learningPaths: number;
  resolvedReferences: number;
  pendingReferences: number;
  externalReferences: number;
  brokenReferences: number;
  warnings: number;
  errors: number;
}

export interface RouteFeedbackReport {
  ok: boolean;
  generatedAt: string;
  summary: RouteFeedbackSummary;
  references: RouteFeedbackReference[];
  issues: Phase3ValidationIssue[];
}

interface ReferenceWithPath {
  reference: SiteReference;
  path: string;
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

export function createRouteFeedback(
  data: Phase3Export,
  registry: SiteRouteRegistry,
  generatedAt = new Date().toISOString(),
): RouteFeedbackReport {
  const validation = validatePhase3Export(data, { registry });
  const routeReferences = collectReferences(data).map(({ reference, path }) => {
    const resolution = resolveSiteReference(reference, registry);

    return {
      path,
      kind: reference.kind,
      id: reference.id,
      status: reference.status,
      label: reference.label,
      title: reference.title,
      resolved: resolution.resolved,
      reason: resolution.reason,
    };
  });

  return {
    ok: validation.ok,
    generatedAt,
    summary: {
      twoLenses: data.twoLenses.length,
      derivedConnections: data.derivedConnections.length,
      learningPaths: data.learningPaths.length,
      resolvedReferences: routeReferences.filter(
        (reference) => reference.reason === 'resolved',
      ).length,
      pendingReferences: routeReferences.filter(
        (reference) => reference.reason === 'pending',
      ).length,
      externalReferences: routeReferences.filter(
        (reference) => reference.reason === 'external',
      ).length,
      brokenReferences: routeReferences.filter(
        (reference) =>
          reference.reason === 'missing' || reference.reason === 'invalid',
      ).length,
      warnings: validation.summary.warnings,
      errors: validation.summary.errors,
    },
    references: routeReferences,
    issues: validation.issues,
  };
}
