import { z } from 'zod';

const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'Expected a semantic version');

const isoDateTimeSchema = z.iso.datetime({ message: 'Expected an ISO timestamp' });

const rootRelativePathPattern = /^\/(?!\/)/;
const rootRelativePathSchema = z
  .string()
  .regex(rootRelativePathPattern, 'Expected a root-relative path beginning with /');

const hrefSchemaMessage = 'Expected href to be a root-relative path or http(s) URL';
const localHrefSchemaMessage =
  'Local filesystem paths must not be used as website href values';
const safeHrefSchema = z.string().superRefine((value, ctx) => {
  const looksLikeWindowsPath = /^[A-Za-z]:[\\/]/.test(value);
  const looksLikeBackslashPath = /^\\/.test(value);
  const looksLikeFileUrl = /^file:/i.test(value);

  if (looksLikeWindowsPath || looksLikeBackslashPath || looksLikeFileUrl) {
    ctx.addIssue({
      code: 'custom',
      message: localHrefSchemaMessage,
    });
    return;
  }

  if (rootRelativePathPattern.test(value)) {
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return;
    }
  } catch {
    ctx.addIssue({
      code: 'custom',
      message: hrefSchemaMessage,
    });
    return;
  }

  ctx.addIssue({
    code: 'custom',
    message: hrefSchemaMessage,
  });
});

export const sourceTypeSchema = z.enum([
  'obsidian-vault',
  'tdl-repo',
  'manual-fixture',
  'manual-curation',
  'zotero-cache',
]);

export const phase3WarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  sourceId: z.string().min(1).optional(),
});

export const phase3SourceSchema = z.object({
  sourceId: z.string().min(1),
  sourceType: sourceTypeSchema,
  label: z.string().min(1),
  localPath: z.string().min(1).optional(),
  vaultMapPath: z.string().min(1).optional(),
  lastIndexedAt: isoDateTimeSchema.optional(),
});

export const exportManifestSchema = z.object({
  schemaVersion: semverSchema,
  generatedAt: isoDateTimeSchema,
  exporter: z.object({
    name: z.string().min(1),
    version: semverSchema,
    commit: z.string().min(1).optional(),
  }),
  sources: z.array(phase3SourceSchema),
  warnings: z.array(phase3WarningSchema).default([]),
});

export const siteReferenceKindSchema = z.enum([
  'chapter',
  'paper',
  'method',
  'interlude',
  'learn-module',
  'interactive',
  'writing-note',
  'writing-essay',
  'external',
]);

export const siteReferenceStatusSchema = z.enum(['resolved', 'pending', 'external']);

export const siteReferenceSchema = z
  .object({
    kind: siteReferenceKindSchema,
    id: z.string().min(1),
    slug: z.string().min(1).optional(),
    href: safeHrefSchema.optional(),
    status: siteReferenceStatusSchema,
    label: z.string().min(1),
    title: z.string().min(1),
  })
  .superRefine((reference, ctx) => {
    if (reference.kind === 'external' && reference.status !== 'external') {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'External references must use status "external"',
      });
    }
    if (reference.kind !== 'external' && reference.status === 'external') {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Only kind "external" may use status "external"',
      });
    }
    if (reference.kind === 'external' && !reference.href) {
      ctx.addIssue({
        code: 'custom',
        path: ['href'],
        message: 'External references require href',
      });
    }
  });

export const upstreamNoteReferenceSchema = z.object({
  sourceId: z.string().min(1),
  path: z.string().min(1),
  title: z.string().min(1).optional(),
});

export const twoLensesStatusSchema = z.enum(['confirmed', 'draft']);

export const twoLensesLinkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: twoLensesStatusSchema,
  mathematical: siteReferenceSchema,
  political: siteReferenceSchema,
  rationale: z.string().min(1),
  websitePath: rootRelativePathSchema,
  concepts: z.array(z.string().min(1)),
  sourceNoteRefs: z.array(upstreamNoteReferenceSchema).default([]),
  zoteroKeys: z.array(z.string().min(1)).default([]),
});

export const derivedConnectionTypeSchema = z.enum([
  'two-lenses',
  'method-used',
  'chapter-related-paper',
  'shared-citation',
  'learning-path',
  'manual-curation',
]);

export const derivedConnectionConfidenceSchema = z.enum([
  'confirmed',
  'reviewed',
  'proposed',
]);

export const derivedConnectionOriginSchema = z.enum([
  'vault-export',
  'cross-vault-linker',
  'manual-fixture',
  'manual-curation',
]);

export const derivedConnectionSchema = z.object({
  id: z.string().min(1),
  source: siteReferenceSchema,
  target: siteReferenceSchema,
  connectionType: derivedConnectionTypeSchema,
  confidence: derivedConnectionConfidenceSchema,
  rationale: z.string().min(1),
  origin: derivedConnectionOriginSchema,
});

export const learningPathModuleExportSchema = z.object({
  moduleId: z.string().min(1),
  concepts: z.array(z.string().min(1)),
  sourceNoteRefs: z.array(upstreamNoteReferenceSchema).default([]),
  status: z.enum(['aligned', 'needs-review', 'missing-site-content']),
});

export const learningPathExportSchema = z.object({
  pathSlug: z.enum([
    'topology-social-scientists',
    'mathematics-of-poverty',
    'data-justice',
    'tda-practitioners',
  ]),
  generatedModules: z.array(learningPathModuleExportSchema),
  recommendedConnections: z.array(z.string().min(1)).default([]),
  twoLensesIds: z.array(z.string().min(1)).default([]),
});

export const phase3ExportSchema = z.object({
  manifest: exportManifestSchema,
  twoLenses: z.array(twoLensesLinkSchema).default([]),
  derivedConnections: z.array(derivedConnectionSchema).default([]),
  learningPaths: z.array(learningPathExportSchema).default([]),
});

export type Phase3Export = z.infer<typeof phase3ExportSchema>;
export type ExportManifest = z.infer<typeof exportManifestSchema>;
export type SiteReference = z.infer<typeof siteReferenceSchema>;
export type TwoLensesLink = z.infer<typeof twoLensesLinkSchema>;
export type DerivedConnection = z.infer<typeof derivedConnectionSchema>;
export type LearningPathExport = z.infer<typeof learningPathExportSchema>;
export type DerivedConnectionConfidence = z.infer<
  typeof derivedConnectionConfidenceSchema
>;
