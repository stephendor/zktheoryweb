import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

// ─── Counting Lives: Chapters ────────────────────────────────────────────────

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/counting-lives/chapters' }),
  schema: z.object({
    title: z.string(),
    chapter_number: z.number().int().positive(),
    part: z.string().optional(),
    part_number: z.number().int().positive().optional(),
    transition: z.number().int().min(1).max(5).optional(),
    spine_role: z.string(),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
    key_figures: z.array(z.string()).default([]),
    mathematical_concepts: z.array(z.string()).default([]),
    interludes: z.array(z.string()).default([]),
    threads: z.object({
      scottish: z.boolean().default(false),
      gender: z.boolean().default(false),
    }),
    related_tda_papers: z.array(z.number().int()).default([]),
    key_claims: z.array(z.object({ claim: z.string(), detail: z.string() })).default([]),
  }),
});

// ─── Counting Lives: Transitions ─────────────────────────────────────────────

const transitions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/counting-lives/transitions' }),
  schema: z.object({
    title: z.string(),
    transition_number: z.number().int().min(1).max(5),
    era: z.string(),
    date_start: z.number().int(),
    date_end: z.number().int().optional(),
    key_chapters: z.array(z.number().int()).default([]),
    key_figures: z.array(z.string()).default([]),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── Counting Lives: Threads ─────────────────────────────────────────────────

const threads = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/counting-lives/threads' }),
  schema: z.object({
    title: z.string(),
    thread_id: z.enum(['scottish', 'gender']),
    description: z.string(),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── Counting Lives: Mathematical Interludes ─────────────────────────────────

const interludes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/counting-lives/interludes' }),
  schema: z.object({
    title: z.string(),
    interlude_slug: z.string(),
    related_chapters: z.array(z.number().int()).default([]),
    related_tda_methods: z.array(z.string()).default([]),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── Counting Lives: Historical Figures ──────────────────────────────────────

const figures = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/counting-lives/figures' }),
  schema: z.object({
    name: z.string(),
    dates: z.string().optional(),
    role: z.string(),
    related_chapters: z.array(z.number().int()).default([]),
    related_threads: z.array(z.enum(['scottish', 'gender'])).default([]),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── TDA: Papers ─────────────────────────────────────────────────────────────

const papers = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tda/papers' }),
  schema: z.object({
    title: z.string(),
    paper_number: z.number().int().min(1).max(10),
    stage: z.number().int().min(0).max(3),
    status: z
      .enum(['planned', 'in-progress', 'submitted', 'in-review', 'revision', 'published'])
      .default('planned'),
    target_journal: z.string().optional(),
    depends_on: z.array(z.number().int()).default([]),
    enables: z.array(z.number().int()).default([]),
    methods: z.array(z.string()).default([]),
    datasets: z.array(z.string()).default([]),
    compute: z
      .object({
        hardware: z.string().optional(),
        runtime: z.string().optional(),
        cloud: z.boolean().default(false),
      })
      .optional(),
    key_findings: z.array(z.string()).default([]),
    abstract: z.string().optional(),
    plain_summary: z.string().optional(),
    bibtex: z.string().optional(),
  }),
});

// ─── TDA: Methods ─────────────────────────────────────────────────────────────

const methods = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tda/methods' }),
  schema: z.object({
    title: z.string(),
    method_slug: z.string(),
    related_papers: z.array(z.number().int()).default([]),
    related_interludes: z.array(z.string()).default([]),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── TDA: Data Sources ────────────────────────────────────────────────────────

const dataSources = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tda/data-sources' }),
  schema: z.object({
    title: z.string(),
    dataset_id: z.string(),
    access_type: z.enum(['public', 'restricted', 'synthetic']),
    related_papers: z.array(z.number().int()).default([]),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── Learning Path Modules ────────────────────────────────────────────────────

const learnModules = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/learn' }),
  schema: z.object({
    title: z.string(),
    path: z.enum([
      'topology-social-scientists',
      'mathematics-of-poverty',
      'data-justice',
      'tda-practitioners',
    ]),
    module_number: z.number().int().positive(),
    core_concept: z.string(),
    interactive_slug: z.string().optional(),
    connections: z.object({
      chapters: z.array(z.number().int()).default([]),
      papers: z.array(z.number().int()).default([]),
      modules: z.array(z.string()).default([]),
      methods: z.array(z.string()).default([]),
    }),
    check_understanding: z.array(z.string()).default([]),
    status: z.enum(['drafting', 'in-review', 'complete']).default('drafting'),
  }),
});

// ─── Interactives ─────────────────────────────────────────────────────────────

const interactives = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/interactives' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    complexity: z.enum(['basic', 'intermediate', 'advanced']),
    related_paths: z.array(z.string()).default([]),
    related_chapters: z.array(z.number().int()).default([]),
    status: z.enum(['planned', 'in-progress', 'complete']).default('planned'),
  }),
});

// ─── Writing: Essays ─────────────────────────────────────────────────────────

const essays = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing/essays' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// ─── Writing: Notes ──────────────────────────────────────────────────────────

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const collections = {
  chapters,
  transitions,
  threads,
  interludes,
  figures,
  papers,
  methods,
  'data-sources': dataSources,
  'learn-modules': learnModules,
  interactives,
  essays,
  notes,
};
