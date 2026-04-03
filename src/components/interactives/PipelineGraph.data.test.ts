/**
 * PipelineGraph.data.test.ts — Task 3.4 — Agent_Interactive_Core
 *
 * Vitest unit tests for the `toPipelineGraph` data transform.
 *
 * Tests use a three-paper mock collection that mirrors the real dependency
 * structure (one root paper enabling two dependents) without requiring Astro.
 * All assertions are pure: no DOM, no rendering, no D3.
 */

import { describe, it, expect } from 'vitest';
import { toPipelineGraph } from './PipelineGraph.data';
import type { PaperEntry } from './PipelineGraph.data';

// ─── Mock data ────────────────────────────────────────────────────────────────

/** Three-paper collection: P1 (root) → P2, P1 → P3. */
const mockPapers: PaperEntry[] = [
  {
    id: 'paper-01',
    data: {
      paper_number: 1,
      title: 'Paper One',
      stage: 0,
      status: 'in-progress',
      depends_on: [],
      enables: [2, 3],
    },
  },
  {
    id: 'paper-02',
    data: {
      paper_number: 2,
      title: 'Paper Two',
      stage: 1,
      status: 'planned',
      depends_on: [1],
      enables: [],
    },
  },
  {
    id: 'paper-03',
    data: {
      paper_number: 3,
      title: 'Paper Three',
      stage: 1,
      status: 'planned',
      depends_on: [1],
      enables: [],
    },
  },
];

// ─── Nodes ────────────────────────────────────────────────────────────────────

describe('toPipelineGraph — nodes', () => {
  it('creates one node per paper entry', () => {
    const { nodes } = toPipelineGraph(mockPapers);
    expect(nodes).toHaveLength(3);
  });

  it('sorts nodes ascending by paper_number regardless of input order', () => {
    // Supply reversed to verify sort
    const shuffled = [mockPapers[2], mockPapers[0], mockPapers[1]];
    const { nodes } = toPipelineGraph(shuffled);
    expect(nodes.map((n) => n.paper_number)).toEqual([1, 2, 3]);
  });

  it('maps each node id to the entry slug', () => {
    const { nodes } = toPipelineGraph(mockPapers);
    expect(nodes[0].id).toBe('paper-01');
    expect(nodes[1].id).toBe('paper-02');
    expect(nodes[2].id).toBe('paper-03');
  });

  it('carries stage, status, and title onto nodes', () => {
    const { nodes } = toPipelineGraph(mockPapers);
    expect(nodes[0].stage).toBe(0);
    expect(nodes[0].status).toBe('in-progress');
    expect(nodes[0].title).toBe('Paper One');
    expect(nodes[1].stage).toBe(1);
  });

  it('carries compute field when present', () => {
    const withCompute: PaperEntry[] = [
      {
        id: 'paper-01',
        data: {
          paper_number: 1,
          title: 'GPU Paper',
          stage: 3,
          status: 'planned',
          depends_on: [],
          enables: [],
          compute: { hardware: 'GPU', runtime: '4h', cloud: true },
        },
      },
    ];
    const { nodes } = toPipelineGraph(withCompute);
    expect(nodes[0].compute).toEqual({ hardware: 'GPU', runtime: '4h', cloud: true });
  });

  it('leaves compute undefined when absent', () => {
    const { nodes } = toPipelineGraph(mockPapers);
    expect(nodes[0].compute).toBeUndefined();
  });
});

// ─── Edges ────────────────────────────────────────────────────────────────────

describe('toPipelineGraph — edges', () => {
  it('creates directed edges from depends_on', () => {
    const { edges } = toPipelineGraph(mockPapers);
    expect(edges).toContainEqual({ source: 'paper-01', target: 'paper-02' });
    expect(edges).toContainEqual({ source: 'paper-01', target: 'paper-03' });
  });

  it('deduplicates edges captured by both depends_on and enables', () => {
    // P1 enables [2, 3] AND P2/P3 depend_on [1]: both produce edges 1→2 and
    // 1→3.  After deduplication the result must contain exactly 2 edges.
    const { edges } = toPipelineGraph(mockPapers);
    expect(edges).toHaveLength(2);
  });

  it('produces no edges for an isolated paper', () => {
    const isolated: PaperEntry[] = [
      {
        id: 'paper-01',
        data: {
          paper_number: 1,
          title: 'Solo',
          stage: 0,
          status: 'planned',
          depends_on: [],
          enables: [],
        },
      },
    ];
    const { edges } = toPipelineGraph(isolated);
    expect(edges).toHaveLength(0);
  });

  it('skips self-loop edges', () => {
    const selfRef: PaperEntry[] = [
      {
        id: 'paper-01',
        data: {
          paper_number: 1,
          title: 'Self',
          stage: 0,
          status: 'planned',
          depends_on: [],
          enables: [1], // self-loop
        },
      },
    ];
    const { edges } = toPipelineGraph(selfRef);
    expect(edges).toHaveLength(0);
  });

  it('ignores references to unknown paper numbers', () => {
    const withUnknown: PaperEntry[] = [
      {
        id: 'paper-02',
        data: {
          paper_number: 2,
          title: 'Two',
          stage: 1,
          status: 'planned',
          depends_on: [99], // paper 99 does not exist in the collection
          enables: [],
        },
      },
    ];
    const { edges } = toPipelineGraph(withUnknown);
    expect(edges).toHaveLength(0);
  });

  it('handles multi-hop dependency chains correctly', () => {
    // P1 → P2 → P3 (linear chain)
    const chain: PaperEntry[] = [
      {
        id: 'paper-01',
        data: { paper_number: 1, title: 'A', stage: 0, status: 'planned', depends_on: [], enables: [] },
      },
      {
        id: 'paper-02',
        data: { paper_number: 2, title: 'B', stage: 1, status: 'planned', depends_on: [1], enables: [] },
      },
      {
        id: 'paper-03',
        data: { paper_number: 3, title: 'C', stage: 2, status: 'planned', depends_on: [2], enables: [] },
      },
    ];
    const { edges } = toPipelineGraph(chain);
    expect(edges).toHaveLength(2);
    expect(edges).toContainEqual({ source: 'paper-01', target: 'paper-02' });
    expect(edges).toContainEqual({ source: 'paper-02', target: 'paper-03' });
  });
});
