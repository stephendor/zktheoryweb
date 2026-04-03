/**
 * PipelineGraph.data.ts — Task 3.4 — Agent_Interactive_Core
 *
 * TypeScript types and pure data-transform utilities for the TDA Research
 * Pipeline Graph.
 *
 * All types are consumed by PipelineGraph.tsx and the Astro data-fetch
 * wrapper at src/pages/tda/pipeline/index.astro.
 *
 * Key design decision: `depends_on` and `enables` in the papers schema use
 * integer paper_numbers, not slugs. The transform function builds a
 * paper_number → entry.id map internally and emits slug-based edges so
 * D3 can reference node objects by id.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaperStatus =
  | 'planned'
  | 'in-progress'
  | 'submitted'
  | 'in-review'
  | 'revision'
  | 'published';

export interface PipelineCompute {
  hardware?: string;
  runtime?: string;
  cloud: boolean;
}

/** A single node in the pipeline graph, representing one research paper. */
export interface PipelineNode {
  /** Astro content entry slug — used as the D3 node id and URL path segment. */
  id: string;
  paper_number: number;
  title: string;
  /** Research programme stage: 0 = Foundations, 1–3 = ascending complexity. */
  stage: number;
  status: PaperStatus;
  compute?: PipelineCompute;
}

/** A directed dependency edge: `source` must come before `target`. */
export interface PipelineEdge {
  /** Slug of the upstream (prerequisite) paper. */
  source: string;
  /** Slug of the downstream (dependent) paper. */
  target: string;
}

/** The complete graph dataset passed to PipelineGraph as the `data` prop. */
export interface PipelineGraphData {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

// ─── Paper entry shape ────────────────────────────────────────────────────────

/**
 * Minimal shape of an Astro content collection entry for the `papers`
 * collection. Narrowly typed so `toPipelineGraph` can be unit-tested
 * without Astro's generated types.
 */
export interface PaperEntry {
  /** Astro content entry id (equals the file slug). */
  id: string;
  data: {
    paper_number: number;
    title: string;
    stage: number;
    status: PaperStatus;
    compute?: PipelineCompute;
    /** Paper numbers of prerequisite papers. */
    depends_on: number[];
    /** Paper numbers that this paper unlocks. */
    enables: number[];
  };
}

// ─── Data transform ───────────────────────────────────────────────────────────

/**
 * Transform a flat array of paper collection entries into the `{ nodes, edges }`
 * structure consumed by `PipelineGraph`.
 *
 * Edge derivation:
 *   - `depends_on: [n]` on paper X  →  directed edge  n → X
 *   - `enables: [m]`   on paper Y  →  directed edge  Y → m
 *
 * Edges produced by both rules for the same relationship are deduplicated.
 * Edges referencing unknown paper numbers or forming self-loops are silently
 * skipped. Nodes are sorted ascending by `paper_number`.
 */
export function toPipelineGraph(entries: PaperEntry[]): PipelineGraphData {
  // Build paper_number → entry.id map for edge slug resolution
  const numToSlug = new Map<number, string>();
  for (const entry of entries) {
    numToSlug.set(entry.data.paper_number, entry.id);
  }

  const nodes: PipelineNode[] = entries
    .slice()
    .sort((a, b) => a.data.paper_number - b.data.paper_number)
    .map((entry) => ({
      id: entry.id,
      paper_number: entry.data.paper_number,
      title: entry.data.title,
      stage: entry.data.stage,
      status: entry.data.status,
      compute: entry.data.compute,
    }));

  // Deduplicate edges using canonical key "srcNum-tgtNum"
  const edgeKeys = new Set<string>();
  const edges: PipelineEdge[] = [];

  const addEdge = (srcNum: number, tgtNum: number): void => {
    if (srcNum === tgtNum) return; // skip self-loops
    const key = `${srcNum}-${tgtNum}`;
    if (edgeKeys.has(key)) return;
    const src = numToSlug.get(srcNum);
    const tgt = numToSlug.get(tgtNum);
    if (!src || !tgt) return; // skip references to unknown papers
    edgeKeys.add(key);
    edges.push({ source: src, target: tgt });
  };

  for (const entry of entries) {
    const { paper_number, depends_on, enables } = entry.data;
    for (const dep of depends_on) {
      addEdge(dep, paper_number);
    }
    for (const enab of enables) {
      addEdge(paper_number, enab);
    }
  }

  return { nodes, edges };
}
